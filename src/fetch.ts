import { VT_CLASS } from "./css.ts";
import RegEl from "./registry.ts";

/** Methods used when inserting fetched content into the DOM. */
type InsertContentMethod = "append" | "prepend" | "replace";

/**
 * Options controlling how fetched DOM content is inserted.
 * @public
 */
export type FetchDOMOptions = {
	from?: string;
	to: string;
	method: InsertContentMethod;
	insertScripts?: boolean | string[];
	insertStyles?: boolean | string[];
	addTransitionClass?: string;
};

/** @internal */
const cssEscape = (value: string) => {
	// Prefer native if available
	if (typeof CSS !== "undefined" && typeof CSS.escape === "function")
		return CSS.escape(value);
	// Minimal fallback sufficient for attribute selector values used here
	return value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
};

/** @internal */
const cloneAndAppendChildren = (src: ParentNode, dest: DocumentFragment) => {
	const topLevel: Element[] = [];
	for (const node of Array.from(src.childNodes)) {
		const cloned = document.importNode(node, true);
		dest.appendChild(cloned);
		if (cloned.nodeType === 1) topLevel.push(cloned as Element);
	}
	return topLevel;
};

/** @internal */
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

/** @internal */
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

/**
 * Fetch HTML content and insert it into the document according to options.
 * @public
 */
const fetchContent = async (
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
				// Use globalThis to access process safely
				const globalProcess = (globalThis as Record<string, unknown>)
					.process as { cwd?: () => string } | undefined;
				const filePath = path.resolve(
					globalProcess?.cwd?.() || ".",
					stripped
				);
				return readFile(filePath, "utf8");
			}
			// Browser relative URL fallback
			const globalWindow = (globalThis as Record<string, unknown>)
				.window as { location?: { href?: string } } | undefined;
			const baseHref =
				typeof globalWindow !== "undefined" &&
				typeof globalWindow.location?.href === "string"
					? globalWindow.location.href
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

	// Add transition attributes/classes to incoming nodes; ensure they are name-captured for VT
	if (ops.addTransitionClass) {
		for (const el of topLevel) {
			el.setAttribute("data-mf-transition", ops.addTransitionClass);
			el.classList.add(ops.addTransitionClass);
			const hel = el as HTMLElement;
			hel.style.setProperty(VT_CLASS, ops.addTransitionClass);
			// Ensure this element is independently captured by VT
			const existingName = hel.style.getPropertyValue(
				"view-transition-name"
			);
			if (!existingName) {
				const rand = Math.random().toString(36).slice(2);
				hel.style.setProperty(
					"view-transition-name",
					`mf-${ops.addTransitionClass}-${rand}`
				);
			}
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

	const startVT = (cb: () => void) => {
		type DocWithVT = Document & {
			startViewTransition?: (cb: () => void) => {
				finished?: Promise<unknown>;
			};
		};
		const d = document as DocWithVT;
		const canVT =
			RegEl._viewTransitionsEnabled &&
			typeof d.startViewTransition === "function";
		if (canVT && d.startViewTransition) {
			return d.startViewTransition(cb);
		}
		cb();
		return null as { finished?: Promise<unknown> } | null;
	};

	// If replacing, mark outgoing direct children so they participate in the outro
	let outgoing: HTMLElement[] = [];
	if (ops.method === "replace") {
		const targetEl = target as HTMLElement | null;
		if (targetEl) {
			outgoing = Array.from(targetEl.children).filter(
				(n): n is HTMLElement => n instanceof HTMLElement
			);
			if (ops.addTransitionClass) {
				for (const el of outgoing) {
					el.classList.add(ops.addTransitionClass);
					el.style.setProperty(VT_CLASS, ops.addTransitionClass);
					// Ensure outgoing has a VT name so ::view-transition-old(*.class) can match
					const existingName = el.style.getPropertyValue(
						"view-transition-name"
					);
					if (!existingName) {
						const rand = Math.random().toString(36).slice(2);
						el.style.setProperty(
							"view-transition-name",
							`mf-${ops.addTransitionClass}-${rand}`
						);
					}
				}
			}
		}
	}

	// Flush styles on outgoing + incoming before snapshot
	if (RegEl._viewTransitionsEnabled) {
		try {
			const toFlush = [...outgoing, ...topLevel];
			for (const el of toFlush) void (el as HTMLElement).offsetWidth;
			const container = target as HTMLElement | null;
			if (container) void container.getBoundingClientRect();
			void document.body.offsetWidth;
		} catch (_e) {
			// ignore
		}
		// One or two RAFs to ensure UA applies classes before snapshot
		await new Promise<void>((r) =>
			typeof requestAnimationFrame !== "undefined"
				? requestAnimationFrame(() => r())
				: setTimeout(() => r(), 0)
		);
		await new Promise<void>((r) =>
			typeof requestAnimationFrame !== "undefined"
				? requestAnimationFrame(() => r())
				: setTimeout(() => r(), 0)
		);
	}

	const t = startVT(performInsert);
	if (t?.finished) await t.finished.catch(() => {});
	if (ops.addTransitionClass) {
		for (const el of topLevel) {
			(el as HTMLElement).style.removeProperty(VT_CLASS);
			el.classList.remove(ops.addTransitionClass);
		}
	}

	// Registration is handled automatically by the global MutationObserver in RegEl

	// Optionally insert scripts/styles into the document and execute/apply them
	insertScripts(scripts as HTMLScriptElement[], ops.insertScripts);
	insertStyles(styles, ops.insertStyles);
};

/**
 * A handle for content fetched from a remote resource with convenience
 * methods to insert the content into the document.
 * @public
 */
export class FetchedContent {
	constructor(
		private url: string | URL,
		private fetchOps: RequestInit,
		private defaultOps?: Omit<FetchDOMOptions, "to" | "method">
	) {}

	replace(
		to: string,
		ops?: Omit<FetchDOMOptions, "to" | "method">
	): Promise<void> {
		return fetchContent(
			this.url,
			{ ...this.defaultOps, ...ops, method: "replace", to },
			this.fetchOps
		);
	}

	append(
		to: string,
		ops?: Omit<FetchDOMOptions, "to" | "method">
	): Promise<void> {
		return fetchContent(
			this.url,
			{ ...this.defaultOps, ...ops, method: "append", to },
			this.fetchOps
		);
	}

	prepend(
		to: string,
		ops?: Omit<FetchDOMOptions, "to" | "method">
	): Promise<void> {
		return fetchContent(
			this.url,
			{ ...this.defaultOps, ...ops, method: "prepend", to },
			this.fetchOps
		);
	}
}

/**
 * Fetch utilities used by the library. Consumers typically use the static
 * helpers on `Manifold` but these helpers are exported here for tests and
 * advanced usage.
 * @internal
 */
export default {
	get(
		url: string | URL,
		fetchOps?: RequestInit,
		defaultOps?: Omit<FetchDOMOptions, "to" | "method">
	): FetchedContent {
		return new FetchedContent(
			url,
			{ ...(fetchOps || {}), method: "GET" },
			defaultOps
		);
	},
	post(
		url: string | URL,
		fetchOps?: RequestInit,
		defaultOps?: Omit<FetchDOMOptions, "to" | "method">
	): FetchedContent {
		return new FetchedContent(
			url,
			{ ...(fetchOps || {}), method: "POST" },
			defaultOps
		);
	},
	fetch: fetchContent,
};
