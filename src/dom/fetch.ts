import { VT_CLASS } from "./css.ts";
import {
	ensureViewTransitionName,
	flushBeforeTransition,
	runViewTransition,
} from "./transition.ts";

export type InsertContentMethod = "append" | "prepend" | "replace";

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
	const gCSS = (globalThis as { CSS?: { escape?: (s: string) => string } }).CSS;
	if (typeof gCSS !== "undefined" && typeof gCSS.escape === "function")
		return gCSS.escape(value);
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
	filter?: boolean | string[],
) => {
	let candidates = scripts;
	if (Array.isArray(filter)) {
		candidates = scripts.filter((s) => filter.some((sel) => s.matches(sel)));
	} else if (filter !== true) {
		return; // nothing to do
	}
	for (const s of candidates) {
		const src = s.getAttribute("src");
		if (src) {
			if (document.querySelector(`script[src="${cssEscape(src)}"]`)) continue;
			const ns = document.createElement("script");
			for (const { name, value } of Array.from(s.attributes))
				ns.setAttribute(name, value);
			document.body.appendChild(ns);
		} else {
			const code = s.textContent || "";
			if (
				Array.from(document.querySelectorAll("script:not([src])")).some(
					(e) => (e as HTMLScriptElement).textContent === code,
				)
			)
				continue;
			const ns = document.createElement("script");
			for (const { name, value } of Array.from(s.attributes))
				ns.setAttribute(name, value);
			ns.textContent = code;
			document.body.appendChild(ns);
		}
	}
};

const insertStyles = (
	styles: (HTMLStyleElement | HTMLLinkElement)[],
	filter?: boolean | string[],
) => {
	let candidates = styles;
	if (Array.isArray(filter)) {
		candidates = styles.filter((st) => filter.some((sel) => st.matches(sel)));
	} else if (filter !== true) {
		return; // nothing to do
	}
	for (const st of candidates) {
		if (st.tagName.toLowerCase() === "link") {
			const href = (st as HTMLLinkElement).getAttribute("href");
			if (!href) continue;
			if (
				document.querySelector(
					`link[rel="stylesheet"][href="${cssEscape(href)}"]`,
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
					(e) => (e as HTMLStyleElement).textContent === code,
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

const fetchContent = async (
	url: string | URL,
	ops: FetchDOMOptions,
	fetchOps?: RequestInit,
) => {
	const loadHTML = async (): Promise<string> => {
		if (typeof url === "string") {
			const res = await fetch(url, fetchOps);
			if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
			return res.text();
		}
		const res = await fetch(url, fetchOps);
		if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
		return res.text();
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
		sourceRoot.querySelectorAll("style,link[rel='stylesheet']"),
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
			ensureViewTransitionName(hel, `mf-${ops.addTransitionClass}`);
		}
	}

	const target = document.querySelector(ops.to);
	if (!target) throw new Error(`Target not found: ${ops.to}`);

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

	// If replacing, mark outgoing direct children so they participate in the outro
	let outgoing: HTMLElement[] = [];
	if (ops.method === "replace") {
		const targetEl = target as HTMLElement | null;
		if (targetEl) {
			outgoing = Array.from(targetEl.children).filter(
				(n): n is HTMLElement => n instanceof HTMLElement,
			);
			if (ops.addTransitionClass) {
				for (const el of outgoing) {
					el.classList.add(ops.addTransitionClass);
					el.style.setProperty(VT_CLASS, ops.addTransitionClass);
					ensureViewTransitionName(el, `mf-${ops.addTransitionClass}`);
				}
			}
		}
	}

	// Flush styles on outgoing + incoming before snapshot
	const flushTargets = [...outgoing, ...topLevel].map(
		(el) => el as HTMLElement,
	);
	await flushBeforeTransition(flushTargets, target as HTMLElement | null);

	const t = runViewTransition(performInsert);
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

export class FetchedContent {
	private url: string | URL;
	private fetchOps: RequestInit;
	private defaultOps?: Omit<FetchDOMOptions, "to" | "method">;

	constructor(
		url: string | URL,
		fetchOps: RequestInit,
		defaultOps?: Omit<FetchDOMOptions, "to" | "method">,
	) {
		this.url = url;
		this.fetchOps = fetchOps;
		this.defaultOps = defaultOps;
	}

	replace(
		to: string,
		ops?: Omit<FetchDOMOptions, "to" | "method">,
	): Promise<void> {
		return fetchContent(
			this.url,
			{ ...this.defaultOps, ...ops, method: "replace", to },
			this.fetchOps,
		);
	}

	append(
		to: string,
		ops?: Omit<FetchDOMOptions, "to" | "method">,
	): Promise<void> {
		return fetchContent(
			this.url,
			{ ...this.defaultOps, ...ops, method: "append", to },
			this.fetchOps,
		);
	}

	prepend(
		to: string,
		ops?: Omit<FetchDOMOptions, "to" | "method">,
	): Promise<void> {
		return fetchContent(
			this.url,
			{ ...this.defaultOps, ...ops, method: "prepend", to },
			this.fetchOps,
		);
	}
}

export default {
	get(
		url: string | URL,
		fetchOps?: RequestInit,
		defaultOps?: Omit<FetchDOMOptions, "to" | "method">,
	): FetchedContent {
		return new FetchedContent(
			url,
			{ ...(fetchOps || {}), method: "GET" },
			defaultOps,
		);
	},
	post(
		url: string | URL,
		fetchOps?: RequestInit,
		defaultOps?: Omit<FetchDOMOptions, "to" | "method">,
	): FetchedContent {
		return new FetchedContent(
			url,
			{ ...(fetchOps || {}), method: "POST" },
			defaultOps,
		);
	},
	fetch: fetchContent,
};
