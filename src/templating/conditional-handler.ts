import { type Effect, effect } from "../Effect.ts";
import type { Sibling } from "./types.ts";

/**
 * Handles conditional templating logic (if/elseif/else)
 */
export function handleConditional(
	state: Record<string, unknown>,
	siblings: Sibling[],
	updateDisplay: (sibs: Pick<Sibling, "el">[]) => void
): Effect {
	const ef = effect(() => {
		let matched = false;
		for (const { el, fn, attrName } of siblings) {
			el.mfshow = false;
			if (!matched) {
				el.mfshow =
					attrName === "else"
						? true
						: !!fn?.({
								state,
								element: el,
						  });
				matched = !!el.mfshow;
			}
		}
		updateDisplay(siblings);
	});

	return ef;
}
