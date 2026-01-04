import { VT_NAME } from "./css.ts";

export type ViewTransitionHandle = {
	finished?: Promise<unknown>;
};

let viewTransitionsEnabled = false;
let initialBufferTimeout: number | null = null;

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
	if (!viewTransitionsEnabled || typeof !document?.startViewTransition === "function") {
		callback();
		return null;
	}
	return document.startViewTransition?.(callback) ?? null;
};

export const ensureViewTransitionName = (el: HTMLElement) => {
	const style = el.style as CSSStyleDeclaration & {
		viewTransitionName?: string;
	};
	if (style.viewTransitionName) return;
	style.setProperty(VT_NAME, "match-element");
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
	if (viewTransitionsEnabled || typeof document === "undefined") return;
	try {
		for (const el of elements) void el.offsetWidth;
		if (container) void container.getBoundingClientRect();
		if (document.body) void document.body.offsetWidth;
	} catch {}
	await nextFrame();
	await nextFrame();
};
