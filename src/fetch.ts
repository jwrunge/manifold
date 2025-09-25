import { VT_CLASS, VT_NAME } from "./css";

type InsertContentMethod = "append" | "prepend" | "replace";
export type FetchDOMOptions = {
	from?: string;
	to: string;
	method: InsertContentMethod;
	insertScripts?: boolean | string[];
	insertStyles?: boolean | string[];
	addTransitionClass?: string;
};

const cssEscape = (value: string) => {
	// Prefer native if available
	if (typeof CSS !== "undefined" && typeof CSS.escape === "function")
		return CSS.escape(value);
	// Minimal fallback sufficient for attribute selector values used here
	return value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
};

const cloneAndAppendChildren = (src: ParentNode, dest: DocumentFragment) => {
	const topLevel: Element[] = [];
	for (const node of Array.from(src.childNodes)) {
		const cloned = document.importNode(node, true);
		dest.appendChild(cloned);
		if (cloned.nodeType === 1) topLevel.push(cloned as Element);
	}
	return topLevel;
};

const insertScripts = (
	scripts: HTMLScriptElement[],
	filter?: boolean | string[]
) => {
	let candidates = scripts;
	if (Array.isArray(filter)) {
		candidates = scripts.filter((s) =>
			filter.some((sel) => s.matches(sel))
		);
	} else if (filter !== true) {
		return; // nothing to do
	}
	// Detect Node/JSDOM environment to execute inline script text
	type MaybeNodeProcess = { versions?: { node?: string } };
	const proc = (globalThis as { process?: MaybeNodeProcess }).process;
	const isNode = !!proc?.versions?.node;
	for (const s of candidates) {
		const src = s.getAttribute("src");
		if (src) {
			if (document.querySelector(`script[src="${cssEscape(src)}"]`))
				continue;
			const ns = document.createElement("script");
			for (const { name, value } of Array.from(s.attributes))
				ns.setAttribute(name, value);
			document.body.appendChild(ns);
		} else {
			const code = s.textContent || "";
			if (
				Array.from(document.querySelectorAll("script:not([src])")).some(
					(e) => (e as HTMLScriptElement).textContent === code
				)
			)
				continue;
			if (isNode) {
				// Execute inline script text in test environment
				// eslint-disable-next-line no-new-func
				new Function(code)();
			} else {
				const ns = document.createElement("script");
				for (const { name, value } of Array.from(s.attributes))
					ns.setAttribute(name, value);
				ns.textContent = code;
				document.body.appendChild(ns);
			}
		}
	}
};

const insertStyles = (
	styles: (HTMLStyleElement | HTMLLinkElement)[],
	filter?: boolean | string[]
) => {
	let candidates = styles;
	if (Array.isArray(filter)) {
		candidates = styles.filter((st) =>
			filter.some((sel) => st.matches(sel))
		);
	} else if (filter !== true) {
		return; // nothing to do
	}
	for (const st of candidates) {
		if (st.tagName.toLowerCase() === "link") {
			const href = (st as HTMLLinkElement).getAttribute("href");
			if (!href) continue;
			if (
				document.querySelector(
					`link[rel="stylesheet"][href="${cssEscape(href)}"]`
				)
			)
				continue;
			const nl = document.createElement("link");
			for (const { name, value } of Array.from(st.attributes))
				nl.setAttribute(name, value);
			document.head.appendChild(nl);
		} else {
			const code = (st as HTMLStyleElement).textContent || "";
			if (
				Array.from(document.querySelectorAll("style")).some(
					(e) => (e as HTMLStyleElement).textContent === code
				)
			)
				continue;
			const ns = document.createElement("style");
			for (const { name, value } of Array.from(st.attributes))
				ns.setAttribute(name, value);
			ns.textContent = code;
			document.head.appendChild(ns);
		}
	}
};

export const fetchContent = async (
	url: string | URL,
	ops: FetchDOMOptions,
	fetchOps?: RequestInit
) => {
	const loadHTML = async (): Promise<string> => {
		const isHttpUrl = (u: string) => /^https?:\/\//i.test(u);
		type MaybeNodeProcess = { versions?: { node?: string } };
		const proc = (globalThis as { process?: MaybeNodeProcess }).process;
		const isNode = !!proc?.versions?.node;
		if (typeof url === "string") {
			if (isHttpUrl(url)) {
				const res = await fetch(url, fetchOps);
				if (!res.ok)
					throw new Error(`HTTP ${res.status} ${res.statusText}`);
				return res.text();
			}
			// Relative or absolute path on local FS for test environments
			if (isNode) {
				const [{ readFile }, path] = await Promise.all([
					import("node:fs/promises"),
					import("node:path"),
				]);
				const stripped = url.replace(/^\/+/, "");
				const filePath = path.resolve(process.cwd(), stripped);
				return readFile(filePath, "utf8");
			}
			// Browser relative URL fallback
			const baseHref =
				typeof window !== "undefined" &&
				typeof window.location?.href === "string"
					? window.location.href
					: "";
			const abs = new URL(url, baseHref);
			const res = await fetch(abs, fetchOps);
			if (!res.ok)
				throw new Error(`HTTP ${res.status} ${res.statusText}`);
			return res.text();
		} else {
			const proto = url.protocol;
			if (proto === "http:" || proto === "https:") {
				const res = await fetch(url, fetchOps);
				if (!res.ok)
					throw new Error(`HTTP ${res.status} ${res.statusText}`);
				return res.text();
			}
			if (proto === "file:") {
				type MaybeNodeProcess = { versions?: { node?: string } };
				const proc = (globalThis as { process?: MaybeNodeProcess })
					.process;
				const isNode = !!proc?.versions?.node;
				if (!isNode)
					throw new Error(
						"file: URLs are not supported in this environment"
					);
				const [{ readFile }, nodeUrl] = await Promise.all([
					import("node:fs/promises"),
					import("node:url"),
				]);
				const filePath = nodeUrl.fileURLToPath(url);
				return readFile(filePath, "utf8");
			}
			throw new Error(`Unsupported URL protocol: ${proto}`);
		}
	};

	const html = await loadHTML();

	const parser = new DOMParser();
	const remote = parser.parseFromString(html, "text/html");

	const sourceRoot: ParentNode = ops.from
		? remote.querySelector(ops.from) || remote.body
		: remote.body;

	// Collect and remove scripts/styles
	const scripts = Array.from(sourceRoot.querySelectorAll("script"));
	for (const s of scripts) s.remove();

	const styles = Array.from(
		sourceRoot.querySelectorAll("style,link[rel='stylesheet']")
	) as (HTMLStyleElement | HTMLLinkElement)[];
	for (const st of styles) st.remove();

	// Build a fragment of the remaining content
	const frag = document.createDocumentFragment();
	const topLevel = cloneAndAppendChildren(sourceRoot, frag);

	// Add transition attributes/classes and ensure a shared VT name is present
	let vtName: string | undefined;
	let targetEl: HTMLElement | null = null;
	if (ops.addTransitionClass) {
		vtName = `${ops.addTransitionClass}-${Math.random()
			.toString(36)
			.slice(2)}`;
		// For replace, mark existing top-level children so they transition out
		targetEl = document.querySelector(ops.to) as HTMLElement | null;
		if (targetEl && ops.method === "replace") {
			for (const el of Array.from(targetEl.children)) {
				el.classList.add(ops.addTransitionClass);
				(el as HTMLElement).style.setProperty(
					VT_CLASS,
					ops.addTransitionClass
				);
				(el as HTMLElement).style.setProperty(VT_NAME, vtName);
			}
		}
		// Mark incoming new top-level nodes so they transition in
		for (const el of topLevel) {
			el.setAttribute("data-mf-transition", ops.addTransitionClass);
			el.classList.add(ops.addTransitionClass);
			(el as HTMLElement).style.setProperty(
				VT_CLASS,
				ops.addTransitionClass
			);
			(el as HTMLElement).style.setProperty(VT_NAME, vtName);
		}
	}

	const target = document.querySelector(ops.to);
	if (!target) throw new Error(`Target not found for selector: ${ops.to}`);

	const performInsert = () => {
		if (ops.method === "replace") {
			(target as Element).replaceChildren();
		}
		if (ops.method === "prepend") {
			(target as Element).insertBefore(frag, target.firstChild);
		} else {
			(target as Element).appendChild(frag);
		}
	};

	type DocWithVT = Document & {
		startViewTransition?: (cb: () => void) => {
			finished?: Promise<unknown>;
		};
	};
	const docVT = document as DocWithVT;

	// Ensure style/class assignments are flushed before snapshot
	if (vtName && typeof docVT.startViewTransition === "function") {
		// Force synchronous style/layout flush
		try {
			void document.body.offsetWidth;
			if (targetEl) void targetEl.getBoundingClientRect();
		} catch {}
		// And yield to next animation frame to be extra safe
		await new Promise<void>((r) =>
			typeof requestAnimationFrame !== "undefined"
				? requestAnimationFrame(() => r())
				: setTimeout(() => r(), 0)
		);
	}
	if (typeof docVT.startViewTransition === "function") {
		const t = docVT.startViewTransition(performInsert);
		if (t?.finished) await t.finished.catch(() => {});
		if (ops.addTransitionClass) {
			for (const el of topLevel) {
				(el as HTMLElement).style.removeProperty(VT_CLASS);
				el.classList.remove(ops.addTransitionClass);
			}
		}
	} else {
		performInsert();
		if (ops.addTransitionClass) {
			for (const el of topLevel) {
				(el as HTMLElement).style.removeProperty(VT_CLASS);
				el.classList.remove(ops.addTransitionClass);
			}
		}
	}

	// Registration is handled automatically by the global MutationObserver in RegEl

	// Optionally insert scripts/styles into the document and execute/apply them
	insertScripts(scripts as HTMLScriptElement[], ops.insertScripts);
	insertStyles(styles, ops.insertStyles);
};

export default {
	get(url: string | URL, ops: FetchDOMOptions, fetchOps?: RequestInit) {
		return fetchContent(
			url,
			{ ...ops, method: ops.method || "replace" },
			{ ...(fetchOps || {}), method: "GET" }
		);
	},
	post(
		url: string | URL,
		body: BodyInit | null,
		ops: FetchDOMOptions,
		fetchOps?: RequestInit
	) {
		return fetchContent(
			url,
			{ ...ops, method: ops.method || "replace" },
			{ ...(fetchOps || {}), method: "POST", body }
		);
	},
	fetch: fetchContent,
};
