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
	"elseif",
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

	// Debug method to access registry
	static getRegEl(element: Element | DocumentFragment): RegEl | undefined {
		return RegEl._registry.get(element);
	}

	private _regexCache: Map<string, RegExp> = new Map();
	private _cachedContent: Node | null = null;

	// Helper function to parse and create aliased states
	static parseAliases(
		text: string,
		props: Record<string, State<unknown>>,
		includeBaseStates: boolean
	): { processedExpression: string } {
		console.log(
			`[PARSE ALIASES DEBUG] Input: "${text}", includeBaseStates: ${includeBaseStates}`
		);

		let processedExpression = text;

		// Parse aliases: "@counter as count" or "@user.name as name"
		const aliasRegex =
			/@([a-zA-Z_$][a-zA-Z0-9_.$]*)\s+as\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/g;
		let match;

		while ((match = aliasRegex.exec(text)) !== null) {
			const [fullMatch, stateRef, aliasName] = match;
			if (!stateRef || !aliasName) continue;

			console.log(
				`[PARSE ALIASES DEBUG] Found alias: ${stateRef} as ${aliasName}`
			);

			// Replace the alias expression with just the alias name
			processedExpression = processedExpression.replace(
				fullMatch,
				`@${aliasName}`
			);

			// Add the alias to props
			if (stateRef.includes(".")) {
				// Property path alias: "@user.name as name"
				const [stateName] = stateRef.split(".");
				const state = State.get<unknown>(stateName);
				if (state) {
					// Create a computed state for the property
					const computedState = new State(() => {
						const obj = state.value;
						const propPath = stateRef.split(".").slice(1);
						let current: any = obj;
						for (const prop of propPath) {
							if (current && typeof current === "object") {
								current = current[prop];
							} else {
								current = undefined;
								break;
							}
						}
						return current;
					});
					props[aliasName] = computedState;
					console.log(
						`[PARSE ALIASES DEBUG] Added property alias: ${aliasName} -> ${stateRef}`,
						computedState
					);
				}
			} else {
				// Simple state alias: "@counter as count"
				const state = State.get<unknown>(stateRef);
				if (state) {
					props[aliasName] = state;
					console.log(
						`[PARSE ALIASES DEBUG] Added simple alias: ${aliasName} -> ${stateRef}`,
						state
					);
				} else {
					console.warn(
						`[PARSE ALIASES DEBUG] State ${stateRef} not found for alias ${aliasName}`
					);
				}
			}

			// Add base state if needed
			if (includeBaseStates) {
				const [stateName] = stateRef.split(".");
				const baseState = State.get<unknown>(stateName);
				if (baseState && stateName && !props[stateName]) {
					props[stateName] = baseState;
					console.log(
						`[PARSE ALIASES DEBUG] Added base state: ${stateName}`,
						baseState
					);
				}
			}
		}

		console.log(
			`[PARSE ALIASES DEBUG] Processed expression: "${processedExpression}"`
		);
		console.log(`[PARSE ALIASES DEBUG] Current props:`, Object.keys(props));

		return { processedExpression };
	} // Helper function to add simple state references (no aliasing)
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
		console.log(
			`[INHERITANCE DEBUG] Starting ancestor traversal for element:`,
			element
		);
		console.log(`[INHERITANCE DEBUG] First parent:`, parent);

		while (parent) {
			const regPar = RegEl._registry.get(parent);
			console.log(
				`[INHERITANCE DEBUG] Checking parent:`,
				parent,
				`RegEl:`,
				regPar
			);
			if (regPar) {
				console.log(
					`[INHERITANCE DEBUG] Found parent RegEl with props:`,
					Object.keys(regPar.props)
				);
				for (const [key, state] of Object.entries(regPar.props)) {
					if (!props[key]) {
						props[key] = state;
						console.log(
							`[INHERITANCE DEBUG] Inherited prop: ${key}`,
							state
						);
					} else {
						console.log(
							`[INHERITANCE DEBUG] Prop ${key} already exists, skipping`
						);
					}
				}
			}
			parent = parent.parentElement;
		}

		console.log(
			`[INHERITANCE DEBUG] Final props after inheritance:`,
			Object.keys(props)
		);

		// PHASE 2: Now evaluate all expressions with complete props context
		for (const attr of MANIFOLD_ATTRIBUTES) {
			const attrText = element.dataset[attr];
			if (!attrText) continue;
			if (attr === "scope") continue; // Already handled in phase 1

			// Parse aliases and get processed expression
			const { processedExpression } = RegEl.parseAliases(
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
			// Always create a new state that evaluates the processed expression
			const evaluatedState = new State(() => {
				const context: Record<string, unknown> = {};
				for (const [key, state] of Object.entries(props)) {
					context[key] = state.value;
				}
				return exprResult.fn(context);
			});
			attrState.set(attr, evaluatedState);
		}

		// Handle conditionals
		// TODO: Traverse up for conditionals for if, else-if, and else
		const ifExpr = element.dataset["if"] ?? element.dataset["elseif"];
		const isElif = !!element.dataset["elseif"];
		const isElse = !!element.dataset["else"];
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

		if (isElif || isElse) {
			let conditionalStates: State<unknown>[] = [];

			// Find all previous conditional elements (data-if, data-elseif) in this conditional chain
			let cond = element.previousElementSibling;
			while (cond) {
				const ifCondition = (cond as HTMLElement).dataset?.["if"];
				const elifCondition = (cond as HTMLElement).dataset?.["elseif"];

				if (ifCondition || elifCondition) {
					const rl = RegEl._registry.get(cond as Element);
					if (rl?._show) {
						conditionalStates.unshift(rl._show); // Add to beginning to maintain order
					}
				}

				// Stop when we reach the initial if condition
				if (ifCondition) break;

				// Skip text nodes (whitespace) and continue
				cond = cond.previousElementSibling;
			}

			if (isElif) {
				// For elseif: show only if this condition is true AND all previous conditions are false
				const currentCondition = showState;
				showState = new State(() => {
					const previousConditionsTrue = conditionalStates.some(
						(s) => s.value
					);
					const currentConditionTrue =
						currentCondition?.value ?? false;
					return !previousConditionsTrue && currentConditionTrue;
				});
			} else if (isElse) {
				// For else: show only if all previous conditions are false
				showState = new State(() => {
					return !conditionalStates.some((s) => s.value);
				});
			}
		}

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

		console.log(`[REGISTER DEBUG] Element:`, element);
		console.log(`[REGISTER DEBUG] Element ID:`, element.id);
		console.log(
			`[REGISTER DEBUG] Final props before processing:`,
			Object.keys(props)
		);
		console.log(`[REGISTER DEBUG] Props details:`, props);

		// Handle sync (two-way binding)
		element.dataset["sync"]?.split(/\s*,\s*/).forEach((binding) => {
			const [property, expr] = binding.split(":").map((s) => s.trim());
			if (!property || !expr) return;

			console.log(
				`[SYNC DEBUG] Setting up sync for ${property}:${expr} on element:`,
				element
			);
			console.log(
				`[SYNC DEBUG] Available props at sync time:`,
				Object.keys(props)
			);

			// Parse the sync expression to handle aliases using the current props context
			const { processedExpression } = RegEl.parseAliases(
				expr,
				props,
				false
			);
			const exprResult = evaluateExpression(processedExpression);

			console.log(
				`[SYNC DEBUG] Processed expression: ${processedExpression}, original: ${expr}`
			);
			console.log(`[SYNC DEBUG] Expression result:`, exprResult);

			// Create a state that evaluates the sync expression with full props context
			const newState = new State(() => {
				const context: Record<string, unknown> = {};
				for (const [key, state] of Object.entries(props)) {
					context[key] = state.value;
				}
				const result = exprResult.fn(context);
				console.log(
					`[SYNC DEBUG] State evaluation - context:`,
					context,
					`result:`,
					result
				);
				return result;
			});

			// Set up the effect to update the property (state -> element)
			newState?.effect(() => {
				try {
					console.log(
						`[SYNC DEBUG] Updating ${property} to:`,
						newState.value
					);
					if (property in element) {
						(element as any)[property] = newState.value;
					} else {
						element.setAttribute(
							property,
							String(newState.value ?? "")
						);
					}
				} catch (error) {
					console.warn(`Failed to set ${property}:`, error);
				}
			});

			// Set up event listener for two-way binding (element -> state)
			let targetState: State<unknown> | undefined;
			let targetProperty: string | undefined;

			// For sync, we need to resolve the target state to update
			if (processedExpression.startsWith("@")) {
				const stateRef = processedExpression.slice(1); // Remove @
				console.log(
					`[SYNC DEBUG] Resolving state reference: ${stateRef}`
				);
				console.log(
					`[SYNC DEBUG] Available props:`,
					Object.keys(props)
				);

				if (stateRef.includes(".")) {
					// Property path: "@user.name"
					const [stateName, ...propPath] = stateRef.split(".");
					targetState = State.get<unknown>(stateName);
					targetProperty = propPath.join(".");
					console.log(
						`[SYNC DEBUG] Property path - stateName: ${stateName}, targetState:`,
						targetState,
						`targetProperty: ${targetProperty}`
					);
				} else {
					// Simple state or aliased state: "@counter" or "@count"
					// Check if it's an alias in props first
					if (props[stateRef]) {
						targetState = props[stateRef];
						console.log(
							`[SYNC DEBUG] Found aliased state for ${stateRef}:`,
							targetState
						);
					} else {
						// Direct state reference
						targetState = State.get<unknown>(stateRef);
						console.log(
							`[SYNC DEBUG] Found direct state for ${stateRef}:`,
							targetState
						);
					}
				}
			}

			console.log(`[SYNC DEBUG] Final targetState:`, targetState);

			if (targetState) {
				// Determine the appropriate event type
				const eventType =
					property === "value" || property === "textContent"
						? "input"
						: property === "checked"
						? "change"
						: "input";

				console.log(`[SYNC DEBUG] Adding ${eventType} event listener`);

				element.addEventListener(eventType, () => {
					let newValue: unknown;
					if (property in element) {
						newValue = (element as any)[property];
					} else {
						newValue = element.getAttribute(property);
					}

					console.log(
						`[SYNC DEBUG] Event triggered - ${eventType}, newValue:`,
						newValue
					);

					// Handle type conversion
					if (property === "checked") {
						newValue = Boolean(newValue);
					} else if (
						property === "value" &&
						element instanceof HTMLInputElement &&
						element.type === "number"
					) {
						const numValue = parseFloat(String(newValue));
						if (!isNaN(numValue)) {
							newValue = numValue;
						}
					}

					console.log(
						`[SYNC DEBUG] After type conversion:`,
						newValue
					);

					try {
						if (targetProperty) {
							console.log(
								`[SYNC DEBUG] Updating object property ${targetProperty}`
							);
							// Update object property (e.g., user.name)
							const currentValue = targetState.value;
							if (
								typeof currentValue === "object" &&
								currentValue !== null
							) {
								const newStateValue = {
									...(currentValue as any),
								};
								const propPath = targetProperty.split(".");
								let current: any = newStateValue;
								for (let i = 0; i < propPath.length - 1; i++) {
									const propName = propPath[i];
									if (propName && current) {
										current = current[propName];
									}
								}
								const lastProp = propPath[propPath.length - 1];
								if (current && lastProp) {
									current[lastProp] = newValue;
									targetState.value = newStateValue;
									console.log(
										`[SYNC DEBUG] Updated state to:`,
										newStateValue
									);
								}
							}
						} else {
							console.log(`[SYNC DEBUG] Updating entire state`);
							// Update entire state
							targetState.value = newValue;
							console.log(
								`[SYNC DEBUG] Updated state to:`,
								newValue
							);
						}
					} catch (error) {
						console.warn(`Failed to update state:`, error);
					}
				});
			} else {
				console.warn(
					`[SYNC DEBUG] No target state found for ${processedExpression}`
				);
			}

			// Trigger initial evaluation
			newState.value;
		});

		// Handle await

		// Handle then
		// Handle process
		// Handle target

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
