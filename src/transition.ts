import { VT_CLASS, VT_NAME } from "./css.ts";

export type ViewTransitionHandle = {
	finished?: Promise<unknown>;
};

let viewTransitionsEnabled = false;
let initialBufferTimeout: number | null = null;

type DocumentWithVT = Document & {
	startViewTransition?: (cb: () => void) => ViewTransitionHandle | null;
};

const getDocumentWithVT = (): DocumentWithVT | null => {
	if (typeof document === "undefined") return null;
	const doc = document as DocumentWithVT;
	return typeof doc.startViewTransition === "function" ? doc : null;
};

export const areViewTransitionsEnabled = () => viewTransitionsEnabled;

export const scheduleViewTransitionBuffer = (delay = 100) => {
	if (typeof document === "undefined") return;
	if (initialBufferTimeout) clearTimeout(initialBufferTimeout);
	initialBufferTimeout = setTimeout(() => {
		viewTransitionsEnabled = true;
		initialBufferTimeout = null;
	}, delay) as unknown as number;
};

export const runViewTransition = (
	callback: () => void,
): ViewTransitionHandle | null => {
	const doc = getDocumentWithVT();
	if (!areViewTransitionsEnabled() || !doc) {
		callback();
		return null;
	}
	return doc.startViewTransition?.(callback) ?? null;
};

export const ensureViewTransitionName = (
	el: HTMLElement,
	prefix?: string,
) => {
	const style = el.style as CSSStyleDeclaration & {
		viewTransitionName?: string;
	};
	if (style.viewTransitionName) return style.viewTransitionName;
	const rand = Math.random().toString(36).slice(2);
	const fallback = "mf";
	const name = prefix && prefix.length > 0 ? `${prefix}-${rand}` : `${fallback}${rand}`;
	style.setProperty(VT_NAME, name);
	return name;
};

export const withTransitionStaging = (
	nodes: HTMLElement[],
	run: () => void,
	vtClass?: string,
) => {
	if (nodes.length === 0) {
		run();
		return;
	}
	if (vtClass) {
		for (const el of nodes) {
			el.style.setProperty(VT_CLASS, vtClass);
		}
	}
	const tempName = `mfpair-${Math.random().toString(36).slice(2)}`;
	const prevNames = nodes.map((el) => {
		const style = el.style as CSSStyleDeclaration & {
			viewTransitionName?: string;
		};
		const prev = style.viewTransitionName || "";
		el.style.setProperty(VT_NAME, tempName);
		return { el, prev };
	});
	try {
		void nodes[0].offsetWidth;
	} catch {}
	const cleanup = () => {
		for (const el of nodes) {
			el.style.removeProperty(VT_CLASS);
		}
		for (const { el, prev } of prevNames) {
			if (prev) el.style.setProperty(VT_NAME, prev);
			else el.style.removeProperty(VT_NAME);
		}
	};
	const transition = runViewTransition(run);
	if (transition?.finished) transition.finished.finally(cleanup);
	else cleanup();
};

const nextFrame = () =>
	new Promise<void>((resolve) => {
		if (typeof requestAnimationFrame !== "undefined") {
			requestAnimationFrame(() => resolve());
		} else {
			setTimeout(() => resolve(), 0);
		}
	});

export const flushBeforeTransition = async (
	elements: Iterable<HTMLElement>,
	container?: HTMLElement | null,
) => {
	if (!areViewTransitionsEnabled() || typeof document === "undefined") return;
	try {
		for (const el of elements) void el.offsetWidth;
		if (container) void container.getBoundingClientRect();
		if (document.body) void document.body.offsetWidth;
	} catch {}
	await nextFrame();
	await nextFrame();
};
