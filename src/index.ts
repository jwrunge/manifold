import { State } from "./State";
import { evaluateExpression } from "./expression-parser";
import { RegEl } from "./registry";

export { State };
export { evaluateExpression, extractVariableNames } from "./expression-parser";
export { createEffect } from "./State";
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

// Parse data attributes and extract state information
function parseDataAttributes(element: HTMLElement) {
	const attributes: Record<string, string> = {};

	// Data attributes we care about
	const dataAttrs = [
		"if",
		"else-if",
		"else",
		"each",
		"scope",
		"await",
		"then",
		"process",
		"target",
		"bind",
		"sync",
	];

	for (const attr of dataAttrs) {
		const camelCase = attr.replace(/-([a-z])/g, (_, letter) =>
			letter.toUpperCase()
		);
		const value = element.dataset[camelCase];
		if (value !== undefined) {
			attributes[attr] = value;
		}
	}

	return attributes;
}

// Parse state references from text content
function parseTextInterpolation(text: string): string[] {
	const stateRefs: string[] = [];
	const matches = text.match(/\$\{([^}]+)\}/g);

	if (matches) {
		for (const match of matches) {
			const varPath = match.slice(2, -1); // Remove ${ and }
			// Extract the root variable name from nested paths
			const rootName = varPath.split(".")[0];
			if (rootName && !rootName.includes("@")) {
				// Don't include @ prefixed ones here
				stateRefs.push(rootName);
			}
		}
	}

	return stateRefs;
}

// Parse state references (@ prefixed variables)
function parseStateReferences(expression: string): string[] {
	const stateRefs: string[] = [];
	const matches = expression.match(
		/@([a-zA-Z_$][a-zA-Z0-9_$]*(?:\.[a-zA-Z_$][a-zA-Z0-9_$]*)*)/g
	);

	if (matches) {
		for (const match of matches) {
			const stateName = match.slice(1); // Remove @ prefix
			stateRefs.push(stateName);
		}
	}

	return stateRefs;
}

// Create context from state references
function createContext(stateRefs: string[]): Record<string, any> {
	const context: Record<string, any> = {};

	for (const ref of stateRefs) {
		const parts = ref.split(".");
		const rootName = parts[0];

		if (rootName && globalState[rootName]) {
			if (parts.length === 1) {
				context[rootName] = globalState[rootName];
			} else {
				// For nested properties, we need to get the current value
				context[rootName] = globalState[rootName];
			}
		}
	}

	return context;
}

// Initialize Manifold on the page
export function init(container: HTMLElement | Document = document) {
	// Find all elements with data attributes
	const dataElements = Array.from(
		container.querySelectorAll(
			"[data-if], [data-else-if], [data-else], [data-each], [data-scope], [data-bind], [data-sync], [data-await]"
		)
	);

	// Also find all elements that contain ${} interpolation
	const allElements = Array.from(container.querySelectorAll("*"));
	const interpolationElements = allElements.filter((element) => {
		const htmlElement = element as HTMLElement;
		// Check if element's text content or attributes contain ${}
		const textContent = htmlElement.textContent || "";
		const hasTextInterpolation = /\$\{[^}]+\}/.test(textContent);

		// Check attributes for interpolation
		const hasAttrInterpolation = Array.from(htmlElement.attributes).some(
			(attr) => /\$\{[^}]+\}/.test(attr.value)
		);

		return hasTextInterpolation || hasAttrInterpolation;
	});

	// Combine and deduplicate elements
	const allElementsToProcess = new Set([
		...dataElements,
		...interpolationElements,
	]);

	for (const element of allElementsToProcess) {
		try {
			const htmlElement = element as HTMLElement;
			const attributes = parseDataAttributes(htmlElement);

			// Parse state references from all attributes
			const allStateRefs = new Set<string>();
			for (const [, value] of Object.entries(attributes)) {
				if (value) {
					const refs = parseStateReferences(value);
					refs.forEach((ref) => allStateRefs.add(ref));
				}
			}

			// Also parse state references from text interpolation
			const textContent = htmlElement.textContent || "";
			const textRefs = parseTextInterpolation(textContent);
			textRefs.forEach((ref) => allStateRefs.add(ref));

			// Parse state references from attributes with interpolation
			Array.from(htmlElement.attributes).forEach((attr) => {
				const attrRefs = parseTextInterpolation(attr.value);
				attrRefs.forEach((ref) => allStateRefs.add(ref));
			});

			// Create context and props
			const context = createContext(Array.from(allStateRefs));
			const props: Record<string, State<unknown>> = {};

			// Convert state references to actual State objects
			for (const ref of allStateRefs) {
				const rootName = ref.split(".")[0];
				if (rootName && globalState[rootName]) {
					props[rootName] = globalState[rootName];
				}
			}

			// Handle different data attributes
			let show: State<unknown> | undefined;
			let each: State<Array<unknown>> | undefined;

			if (attributes["if"]) {
				// Remove @ prefix for evaluation
				const expression = attributes["if"].replace(/@/g, "");
				show = new State(() => {
					const ctx = createEvaluationContext(context);
					return evaluateExpression(expression, ctx);
				});
			} else if (attributes["else-if"]) {
				const expression = attributes["else-if"].replace(/@/g, "");
				show = new State(() => {
					const ctx = createEvaluationContext(context);
					return evaluateExpression(expression, ctx);
				});
			}

			if (attributes["each"]) {
				const expression = attributes["each"].replace(/@/g, "");
				each = new State(() => {
					const ctx = createEvaluationContext(context);
					const result = evaluateExpression(expression, ctx);
					return Array.isArray(result) ? result : [];
				});
			}

			// Register the element
			RegEl.register(htmlElement, {
				props,
				show,
				each,
				else: attributes["else"] !== undefined,
			});
		} catch (error) {
			console.warn("Failed to initialize element:", element, error);
		}
	}
}

// Create evaluation context from state objects
function createEvaluationContext(
	stateContext: Record<string, any>
): Record<string, any> {
	const ctx: Record<string, any> = {};

	for (const [key, value] of Object.entries(stateContext)) {
		if (value instanceof State) {
			ctx[key] = value.value;
		} else {
			ctx[key] = value;
		}
	}

	return ctx;
}

export default {
	State,
	createState,
	$,
	init,
	evaluateExpression: (expr: string, context: Record<string, any>) =>
		import("./expression-parser").then((m) =>
			m.evaluateExpression(expr, context)
		),
};
