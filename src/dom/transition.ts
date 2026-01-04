import { VT_CLASS, VT_NAME } from "./css.ts";

export type ViewTransitionHandle = {
	finished?: Promise<unknown>;
};

export type TransitionElement = HTMLElement | SVGElement | MathMLElement;
export type TransitionClassResolver =
	| string
	| ((el: TransitionElement, index: number) => string | null | undefined);
export type TransitionStarter = (
	callback: () => void,
) => ViewTransitionHandle | null;

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

export const ensureViewTransitionName = (el: HTMLElement) => {
	const style = el.style as CSSStyleDeclaration & {
		viewTransitionName?: string;
	};
	if (style.viewTransitionName) return;
	style.setProperty(VT_NAME, "match-element");
};

export const withTransitionStaging = (
	nodes: TransitionElement[],
	run: () => void,
	vtClass?: TransitionClassResolver,
	startTransition: TransitionStarter = runViewTransition,
) => {
	const classTargets: TransitionElement[] = [];

	if (vtClass) {
		nodes.forEach((el, index) => {
			const resolved =
				typeof vtClass === "function" ? vtClass(el, index) : vtClass;
			if (!resolved) return;
			el.style.setProperty(VT_CLASS, resolved);
			classTargets.push(el);
		});
	}

	const cleanup = () => {
		for (const el of classTargets) {
			el.style.removeProperty(VT_CLASS);
		}
	};

	const transition = startTransition(run);
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
