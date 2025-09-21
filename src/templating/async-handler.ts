import applyAliasPattern from "../alias-destructure";
import { type Effect, effect } from "../Effect";
import type { Sibling } from "./types";

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
	updateDisplay: (sibs: Pick<Sibling, "el">[]) => void
): Effect {
	let lastPromise: Promise<unknown> | null = null;

	const ef = effect(() => {
		const root = siblings[0];
		const thenLink = siblings.find((s) => s.attrName === "then");
		const catchLink = siblings.find((s) => s.attrName === "catch");

		// Evaluate expression to obtain maybe-promise
		const result = root.fn?.({
			state,
			element: root.el,
		});

		const isThenable =
			result &&
			// biome-ignore lint/suspicious/noExplicitAny: explicit any for thenable check
			(typeof (result as any).then === "function" ||
				// biome-ignore lint/suspicious/noExplicitAny: explicit any for thenable check
				typeof (result as any).catch === "function");

		// Reset gating
		root.el.mfawait = isThenable; // show loader
		if (thenLink) thenLink.el.mfawait = !isThenable;
		if (catchLink) catchLink.el.mfawait = false;

		updateDisplay(siblings);

		if (!isThenable) {
			// Treat non-promise as immediate success
			root.el.mfawait = false;
			if (thenLink) thenLink.el.mfawait = true;
			// Apply alias pattern for immediate value to then-link's scope
			if (thenLink?.alias) {
				const thenInst = RegElClass._registerOrGet(thenLink.el, state);
				if (thenInst)
					applyAliasPattern(thenLink.alias, result, thenInst._state);
			}
			updateDisplay(siblings);
			return;
		}

		if ((result as Promise<unknown>) === lastPromise) return; // avoid duplicating handlers
		lastPromise = result as Promise<unknown>;

		(result as Promise<unknown>).then(
			(_val) => {
				root.el.mfawait = false;
				if (thenLink) thenLink.el.mfawait = true;
				// Destructure aliases for :then value using the sibling's expression string
				if (thenLink?.alias) {
					const thenInst = RegElClass._registerOrGet(
						thenLink.el,
						state
					);

					if (thenInst)
						applyAliasPattern(
							thenLink.alias,
							_val,
							thenInst._state
						);
				}
				updateDisplay(siblings);
			},
			(_err) => {
				root.el.mfawait = false;
				if (catchLink) catchLink.el.mfawait = true;
				if (catchLink?.alias) {
					const catchInst = RegElClass._registry.get(catchLink.el);
					if (catchInst)
						applyAliasPattern(
							catchLink.alias,
							_err,
							catchInst._state
						);
				}
				updateDisplay(siblings);
			}
		);
	});

	return ef;
}
