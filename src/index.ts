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
const watch = <T>(value: T) => new State(value);

export default {
	State,
	watch,
	init,
};
