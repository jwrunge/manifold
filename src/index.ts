import { State } from "./State";
import { MANIFOLD_ATTRIBUTES, RegEl } from "./registry";

export { State };
export { RegEl } from "./registry";

export const createState = <T>(value: T | (() => T)): State<T> =>
	new State(value);

// Global state registry for managing application state
const globalState: Record<string, State<unknown>> = {};

// Function to create and register global state
export const $ = {
	create: <T extends Record<string, any>>(initialState: T) => {
		const stateObj: Record<string, State<any>> = {};
		for (const [key, value] of Object.entries(initialState)) {
			stateObj[key] = new State(value);
			globalState[key] = stateObj[key];
		}
		return stateObj;
	},
};

export function init(
	container: HTMLElement | SVGElement | MathMLElement | Document = document
) {
	// Find all elements with data attributes
	for (const el of Array.from(
		container.querySelectorAll(
			MANIFOLD_ATTRIBUTES.map((attr) => `[data-${attr}]`).join(", ")
		)
	))
		RegEl.register(el as HTMLElement | SVGElement | MathMLElement);
}

export default {
	State,
	createState,
	$,
	init,
};
