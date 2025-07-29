import { evaluateExpression, evalProp } from "./expression-parser";
import { State } from "./State";

// Extend element interfaces to include mfRegister
declare global {
	interface HTMLElement {
		mfRegister?: () => RegEl;
	}
	interface SVGElement {
		mfRegister?: () => RegEl;
	}
	interface MathMLElement {
		mfRegister?: () => RegEl;
	}
}

export const MANIFOLD_ATTRIBUTES = [
	"if",
	"elif",
	"else",
	"each",
	"scope",
	"await",
	"then",
	"process",
	"target",
	"bind",
	"sync",
] as const;

export interface ParsedElement {
	show?: State<unknown>; // Condition based on data-if or data-else-if
	each?: State<Array<unknown>>; // Loop State based on data-each
	props: Record<string, State<unknown>>; // Any bound properties (assigned with data-bind or data-scope) - a .effect() should be set on any State bound to a property with data-bind BEFORE adding to this Record that updates the bound property
	else?: boolean; // Whether or not this element has a data-else attribute
}

export class RegEl {
	private static _registry: WeakMap<Element | DocumentFragment, RegEl> =
		new WeakMap();
	private static _expressions = new Set<(vars: Record<string, any>) => any>();
	private static _stateExpression: Map<State<unknown>, string> = new Map();

	private _regexCache: Map<string, RegExp> = new Map();
	private _cachedContent: Node | null = null;

	// Helper function to parse and create aliased states
	private static parseAliases(
		expression: string,
		props: Record<string, State<unknown>>,
		addBaseStateForAliases: boolean = true
	): { processedExpression: string; hasAliases: boolean } {
		let processedExpression = expression;
		let hasAliases = false;

		// Find all "@stateRef as alias" patterns in the expression
		const aliasRegex =
			/@([a-zA-Z_$][a-zA-Z0-9_$]*(?:\.[a-zA-Z_$][a-zA-Z0-9_$]*)*)\s+as\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/g;
		let match;

		while ((match = aliasRegex.exec(expression)) !== null) {
			const [fullMatch, stateRef, aliasName] = match;
			if (!stateRef || !aliasName) continue;

			hasAliases = true;
			const baseStateName = stateRef.split(".")[0];
			if (!baseStateName) continue;

			const baseState = State.get<unknown>(baseStateName);
			if (baseState) {
				// Only add base state to props if explicitly requested
				// For scope declarations, we don't want the base state unless it's also used directly
				if (addBaseStateForAliases && !props[baseStateName]) {
					props[baseStateName] = baseState;
				}

				// Create derived state for the alias
				if (!stateRef.includes(".")) {
					// Simple state reference: "@user as me"
					props[aliasName] = baseState;
				} else {
					// Property path: "@user.name as name"
					const derivedState = new State(() => {
						const context: Record<string, unknown> = {};
						context[baseStateName] = baseState.value;
						return evalProp(stateRef, context);
					});
					props[aliasName] = derivedState;
				}

				// Replace the "@stateRef as alias" with just the alias in the expression
				processedExpression = processedExpression.replace(
					fullMatch,
					aliasName
				);
			}
		}

		return { processedExpression, hasAliases };
	}

	// Helper function to add simple state references (no aliasing)
	private static addSimpleStateRefs(
		expression: string,
		props: Record<string, State<unknown>>
	): void {
		// First, remove all aliasing patterns from the expression to avoid false matches
		const withoutAliases = expression.replace(
			/@([a-zA-Z_$][a-zA-Z0-9_$]*(?:\.[a-zA-Z_$][a-zA-Z0-9_$]*)*)\s+as\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/g,
			""
		);

		const simpleStateRegex = /@([a-zA-Z_$][a-zA-Z0-9_$]*)/g;
		let match;

		while ((match = simpleStateRegex.exec(withoutAliases)) !== null) {
			const [, stateName] = match;
			if (stateName && !props[stateName]) {
				const state = State.get<unknown>(stateName);
				if (state) {
					props[stateName] = state;
				}
			}
		}
	}

	static register(element: HTMLElement | SVGElement | MathMLElement) {
		element.mfRegister = () => RegEl.register(element);

		const props: Record<string, State<unknown>> = {};
		const attrState = new Map<string, State<unknown>>();

		// PHASE 1: Collect ALL props from ALL attributes (no evaluations yet)
		for (const attr of MANIFOLD_ATTRIBUTES) {
			const attrText = element.dataset[attr];
			if (!attrText) continue;

			if (attr === "scope") {
				// Parse scope declarations: "@user, @counter as count, @user.name as name"
				const scopeItems = attrText.split(",").map((s) => s.trim());
				for (const item of scopeItems) {
					// For scope, don't add base states for aliases - only the alias itself
					RegEl.parseAliases(item, props, false);
					RegEl.addSimpleStateRefs(item, props);
				}
			} else {
				// For all other attributes, collect aliases and add base states as needed
				RegEl.parseAliases(attrText, props, true);
			}
		}

		// Traverse ancestors to find inherited props
		let parent = element.parentElement;
		while (parent) {
			const regPar = RegEl._registry.get(parent);
			if (regPar)
				for (const [key, state] of Object.entries(regPar.props))
					props[key] ??= state;
			parent = parent.parentElement;
		}

		// PHASE 2: Now evaluate all expressions with complete props context
		for (const attr of MANIFOLD_ATTRIBUTES) {
			const attrText = element.dataset[attr];
			if (!attrText) continue;
			if (attr === "scope") continue; // Already handled in phase 1

			// Parse aliases and get processed expression
			const { processedExpression, hasAliases } = RegEl.parseAliases(
				attrText,
				{}, // Empty props object since we already collected everything
				false // Don't add any more props
			);

			// Parse the processed expression
			const exprResult = evaluateExpression(processedExpression);

			// Add any remaining state dependencies that weren't caught by aliasing
			for (const stateRef of exprResult.stateRefs) {
				if (!props[stateRef]) {
					const state = State.get<unknown>(stateRef);
					if (state) {
						props[stateRef] = state;
					}
				}
			}

			// Store the expression result for this attribute
			if (hasAliases) {
				// Create a new state that evaluates the processed expression
				const evaluatedState = new State(() => {
					const context: Record<string, unknown> = {};
					for (const [key, state] of Object.entries(props)) {
						context[key] = state.value;
					}
					return exprResult.fn(context);
				});
				attrState.set(attr, evaluatedState);
			} else {
				// No aliases - use the first state dependency if available
				const firstStateRef = exprResult.stateRefs[0];
				if (firstStateRef && props[firstStateRef]) {
					attrState.set(attr, props[firstStateRef]);
				}
			}
		}

		// Handle conditionals
		// TODO: Traverse up for conditionals for if, else-if, and else

		// Handle bind
		element.dataset["bind"]?.split(/\s*,\s*/).forEach((binding) => {
			const [property, expr] = binding.split(":").map((s) => s.trim());
			if (!property || !expr) return;

			// Parse the bind expression to handle aliases
			const { processedExpression } = RegEl.parseAliases(expr, {}, false);
			const exprResult = evaluateExpression(processedExpression);

			// Create a state that evaluates the bind expression with full props context
			const newState = new State(() => {
				const context: Record<string, unknown> = {};
				for (const [key, state] of Object.entries(props)) {
					context[key] = state.value;
				}
				return exprResult.fn(context);
			});

			// Set up the effect to update the property
			newState?.effect(() => {
				if (property in element)
					(element as any)[property] = newState.value;
				else
					element.setAttribute(
						property,
						String(newState.value ?? "")
					);
			});

			// Trigger initial evaluation
			newState.value;
		});

		// Handle sync
		// if (expressions["sync"]) {
		// 	expressions["sync"].split(/\s*,\s*/).forEach((binding) => {
		// 		const [property, expr] = binding
		// 			.split(":")
		// 			.map((s) => s.trim());
		// 		if (!property || !expr) return;

		// 		(element as any)[property] = () => console.log(expr);
		// 	});
		// }

		// Handle await

		// Handle then
		// Handle process
		// Handle target

		// Get expression strings from dataset
		const ifExpr = element.dataset["if"] ?? element.dataset["elseIf"];
		const eachExpr = element.dataset["each"];

		// Create show State if conditional expression exists
		let showState: State<unknown> | undefined;
		if (ifExpr) {
			// Always parse the expression with aliases and use full props context
			const { processedExpression } = RegEl.parseAliases(
				ifExpr,
				{},
				false
			);
			const evaluator = evaluateExpression(processedExpression);
			showState = new State(() => {
				const context: Record<string, unknown> = {};
				for (const [key, state] of Object.entries(props)) {
					context[key] = state.value;
				}
				return evaluator.fn(context);
			});
		}

		// Create each State if each expression exists
		let eachState: State<Array<unknown>> | undefined;
		if (eachExpr) {
			// Always parse the expression with aliases and use full props context
			const { processedExpression } = RegEl.parseAliases(
				eachExpr,
				{},
				false
			);
			const evaluator = evaluateExpression(processedExpression);
			eachState = new State(() => {
				const context: Record<string, unknown> = {};
				for (const [key, state] of Object.entries(props)) {
					context[key] = state.value;
				}
				return evaluator.fn(context);
			}) as State<Array<unknown>>;
		}

		return new RegEl(element, props, showState, eachState);
	}

	constructor(
		private _element:
			| HTMLElement
			| SVGElement
			| MathMLElement
			| DocumentFragment,
		public props: Record<string, State<unknown>> = {},
		private _show?: State<unknown> | undefined,
		private _each?: State<Array<unknown>> | undefined
	) {
		this._cachedContent = _element.cloneNode(true);

		this._show?.effect(() => {
			(this._element as HTMLElement | SVGElement).style.display = this
				._show!.value
				? ""
				: "none";
		});

		// Trigger initial show effect by accessing the value
		if (this._show) {
			this._show.value;
		}

		this._each?.effect(() => {
			// For each functionality, we need the original content as template
			if (!this._cachedContent) {
				return;
			}

			// Clear existing content
			_element.replaceChildren();

			if (this._each!.value.length === 0) {
				return;
			}

			// Iterate through array items
			// this.each!.value.forEach((item, index) => {
			// 	const clone = this.cachedContent!.cloneNode(
			// 		true
			// 	) as DocumentFragment;

			// 	// Replace iteration variables directly in the clone
			// 	this.replaceIterationVariables(clone, String(index), item);

			// 	const comment = document.createComment(`MF_EACH_${index}`);
			// 	element.appendChild(comment);

			// 	// Append the fragment (this will move all child nodes from fragment to element)
			// 	element.appendChild(clone);
			// });
		});

		// Trigger initial render by accessing the value
		if (this._each) {
			this._each.value;
		}

		RegEl._registry.set(_element, this);
	}

	private getRegex(key: string): RegExp {
		let pattern = this._regexCache.get(key);
		if (!pattern) {
			pattern = new RegExp(`\\$\\{${key}\\}`, "g");
			this._regexCache.set(key, pattern);
		}
		return pattern;
	}
}

const findNode = (
	element: Node,
	ops?: {
		type?: Node["nodeType"];
		name?: string;
		backward?: boolean;
		txt?: string | number;
	}
): Node | null | undefined => {
	const { type, name, txt, backward } = {
		type: Node.COMMENT_NODE,
		...ops,
	};

	let current = backward ? element.previousSibling : element.nextSibling;
	while (current) {
		if (
			(name && (current as HTMLElement).dataset?.[name]) ||
			(current.nodeType === type &&
				txt &&
				current.textContent?.startsWith(`${txt}`))
		)
			return current;
		current = backward ? current.previousSibling : current.nextSibling;
	}
};

const extractKeyValNames = (element: HTMLElement | SVGElement): string[] => {
	return element.dataset?.["mfAs"]?.split(/\s*,\s*/) ?? ["value", "key"];
};
