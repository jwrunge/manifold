import { State } from "./State";
import { MANIFOLD_ATTRIBUTES, RegEl } from "./registry";

export { State };
export { RegEl } from "./registry";

const init = (
	container: HTMLElement | SVGElement | MathMLElement | Document = document
) => {
	// Find all elements with data attributes
	for (const el of Array.from(
		container.querySelectorAll(
			MANIFOLD_ATTRIBUTES.map((attr) => `[data-${attr}]`).join(", ")
		)
	))
		RegEl.register(el as HTMLElement | SVGElement | MathMLElement);
};

// Factory function for creating reactive state
function watch<T>(deriveFn: () => T): State<T>;
function watch<T>(value: T): State<T>;
function watch<T>(value: T | (() => T)): State<T> {
	if (typeof value === "function") {
		return new State(value as () => T);
	}
	return new State(value as T);
}

export default {
	State,
	watch,
	init,
};
