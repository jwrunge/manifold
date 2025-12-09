import applyAliasPattern from "../../parsing/alias-destructure.ts";
import { type Effect, effect } from "../../reactivity/effect.ts";
import type { Sibling } from "./types.ts";

// Type for the RegEl class (to avoid circular dependencies)
interface RegElLike {
	_state: Record<string, unknown>;
}

interface RegElStatic {
	_registry: WeakMap<Node, RegElLike>;
	_registerOrGet(el: Node, state: Record<string, unknown>): RegElLike;
}

/**
 * Handles async templating logic (:await/then/catch)
 */
export function handleAsync(
	state: Record<string, unknown>,
	siblings: Sibling[],
	RegElClass: RegElStatic,
	updateDisplay: (sibs: Pick<Sibling, "el">[]) => void,
): Effect {
	let lastPromise: Promise<unknown> | null = null;
	let promiseId = 0;

	// Helper to set display states for all siblings
	const setStates = (await_: boolean, then_: boolean, catch_: boolean) => {
		const root = siblings[0];
		const thenLink = siblings.find((s) => s.attrName === "then");
		const catchLink = siblings.find((s) => s.attrName === "catch");
		root.el.mfawait = await_;
		if (thenLink) thenLink.el.mfawait = then_;
		if (catchLink) catchLink.el.mfawait = catch_;
		updateDisplay(siblings);
	};

	// Helper to apply alias to sibling
	const applyAlias = (
		attrName: "then" | "catch",
		value: unknown,
		useRegistry = false,
	) => {
		const link = siblings.find((s) => s.attrName === attrName);
		if (link?.alias) {
			const inst = useRegistry
				? RegElClass._registry.get(link.el)
				: RegElClass._registerOrGet(link.el, state);
			if (inst) applyAliasPattern(link.alias, value, inst._state);
		}
	};

	const ef = effect(() => {
		const root = siblings[0];
		const result = root.fn?.({ state, element: root.el });
		const isThenable =
			result &&
			// biome-ignore lint/suspicious/noExplicitAny: explicit any for thenable check
			(typeof (result as any).then === "function" ||
				// biome-ignore lint/suspicious/noExplicitAny: explicit any for thenable check
				typeof (result as any).catch === "function");

		setStates(Boolean(isThenable), false, false);

		if (!isThenable) {
			setStates(false, true, false);
			applyAlias("then", result);
			return;
		}

		if ((result as Promise<unknown>) === lastPromise) return;
		lastPromise = result as Promise<unknown>;
		const currentPromiseId = ++promiseId;

		(result as Promise<unknown>).then(
			(val) => {
				if (currentPromiseId !== promiseId) return;
				setStates(false, true, false);
				applyAlias("then", val);
			},
			(err) => {
				if (currentPromiseId !== promiseId) return;
				setStates(false, false, true);
				applyAlias("catch", err, true);
			},
		);
	});

	return ef;
}
