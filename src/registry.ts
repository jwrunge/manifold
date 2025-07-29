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
		let processedExpression = text;

		// Parse aliases: "@counter as count" or "@user.name as name"
		const aliasRegex =
			/@([a-zA-Z_$][a-zA-Z0-9_.$]*)\s+as\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/g;
		let match;

		while ((match = aliasRegex.exec(text)) !== null) {
			const [fullMatch, stateRef, aliasName] = match;
			if (!stateRef || !aliasName) continue;

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
				}
			} else {
				// Simple state alias: "@counter as count"
				const state = State.get<unknown>(stateRef);
				if (state) {
					props[aliasName] = state;
				}
			}

			// Add base state if needed
			if (includeBaseStates) {
				const [stateName] = stateRef.split(".");
				const baseState = State.get<unknown>(stateName);
				if (baseState && stateName && !props[stateName]) {
					props[stateName] = baseState;
				}
			}
		}

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
			} else if (attr === "each") {
				// Skip data-each during props collection - it has special syntax and is handled separately
				continue;
			} else {
				// For all other attributes, collect aliases and add base states as needed
				RegEl.parseAliases(attrText, props, true);
			}
		}

		// Traverse ancestors to find inherited props
		let parent = element.parentElement;

		while (parent) {
			const regPar = RegEl._registry.get(parent);
			if (regPar) {
				for (const [key, state] of Object.entries(regPar.props)) {
					if (!props[key]) {
						props[key] = state;
					}
				}
			}
			parent = parent.parentElement;
		}

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

			// Parse the bind expression to handle aliases - pass current props for context
			const { processedExpression } = RegEl.parseAliases(
				expr,
				props,
				false
			);
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

		// Handle sync (two-way binding)
		element.dataset["sync"]?.split(/\s*,\s*/).forEach((binding) => {
			const [property, expr] = binding.split(":").map((s) => s.trim());
			if (!property || !expr) return;

			// Parse the sync expression to handle aliases using the current props context
			const { processedExpression } = RegEl.parseAliases(
				expr,
				props,
				false
			);
			const exprResult = evaluateExpression(processedExpression);

			// Create a state that evaluates the sync expression with full props context
			const newState = new State(() => {
				const context: Record<string, unknown> = {};
				for (const [key, state] of Object.entries(props)) {
					context[key] = state.value;
				}
				const result = exprResult.fn(context);
				return result;
			});

			// Set up the effect to update the property (state -> element)
			newState?.effect(() => {
				try {
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

				if (stateRef.includes(".")) {
					// Property path: "@user.name"
					const [stateName, ...propPath] = stateRef.split(".");
					targetState = State.get<unknown>(stateName);
					targetProperty = propPath.join(".");
				} else {
					// Simple state or aliased state: "@counter" or "@count"
					// Check if it's an alias in props first
					if (props[stateRef]) {
						targetState = props[stateRef];
					} else {
						// Direct state reference
						targetState = State.get<unknown>(stateRef);
					}
				}
			}

			if (targetState) {
				// Determine the appropriate event type
				const eventType =
					property === "value" || property === "textContent"
						? "input"
						: property === "checked"
						? "change"
						: "input";

				element.addEventListener(eventType, () => {
					let newValue: unknown;
					if (property in element) {
						newValue = (element as any)[property];
					} else {
						newValue = element.getAttribute(property);
					}

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

					try {
						if (targetProperty) {
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
								}
							}
						} else {
							// Update entire state
							targetState.value = newValue;
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
			console.log("Processing data-each expression:", eachExpr);
			// Parse data-each expression: "@items as item, index" or "@items as item"
			const eachMatch = eachExpr.match(
				/@([a-zA-Z_$][a-zA-Z0-9_.$]*)\s+as\s+(.+)/
			);
			console.log("Regex match result:", eachMatch);
			if (eachMatch) {
				const [, stateRef] = eachMatch;
				console.log("State reference:", stateRef);
				// Get the array state directly
				const arrayState = State.get<Array<unknown>>(stateRef);
				console.log("Found array state:", arrayState);
				if (arrayState) {
					eachState = arrayState;
					console.log("Set each state:", eachState);
				} else {
					console.warn(`State not found for: ${stateRef}`);
				}
			} else {
				console.warn(
					`Invalid data-each expression format: ${eachExpr}`
				);
			}
		}

		return new RegEl(element, props, showState, eachState);
	}

	// Getter for cached template content
	get cachedTemplateContent(): DocumentFragment | null {
		if (
			this._cachedContent &&
			this._cachedContent.nodeType === Node.DOCUMENT_FRAGMENT_NODE
		) {
			return this._cachedContent as DocumentFragment;
		} else if (this._cachedContent) {
			// Convert element to document fragment
			const fragment = document.createDocumentFragment();
			fragment.appendChild(this._cachedContent.cloneNode(true));
			return fragment;
		}
		return null;
	}

	// Getter for each state
	get each(): State<Array<unknown>> | undefined {
		return this._each;
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
		const element = this._element as
			| HTMLElement
			| SVGElement
			| MathMLElement;
		this._cachedContent = element.cloneNode(true);

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

		// Handle each loop - element with data-each is the template that gets repeated
		this._each?.effect(() => {
			const eachArray = this._each!.value;
			console.log("Data-each array value:", eachArray);
			if (!Array.isArray(eachArray)) {
				console.warn("Each value is not an array:", eachArray);
				return;
			}

			// Extract key and value names from data-each expression
			const eachExpr = (element as HTMLElement).dataset?.["each"] || "";
			console.log("Data-each expression:", eachExpr);
			const [, aliasExpr] = eachExpr.split(" as ");
			const aliases = aliasExpr?.split(",").map((s) => s.trim()) || [
				"item",
				"index",
			];
			const valName = aliases[0] || "item";
			const keyName = aliases[1] || "index";
			console.log("Aliases - value:", valName, "key:", keyName);

			// Hide the original template element
			element.style.display = "none";

			// Remove any existing cloned elements (look for elements with data-mf-each-clone attribute)
			const parent = element.parentElement;
			if (parent) {
				const existingClones = parent.querySelectorAll(
					"[data-mf-each-clone]"
				);
				existingClones.forEach((clone) => clone.remove());
			}

			if (eachArray.length === 0) {
				console.log("Empty array, nothing to render");
				return;
			}

			// Create items for each array element
			for (let i = 0; i < eachArray.length; i++) {
				const value = eachArray[i];
				console.log(`Creating item ${i}:`, value);

				// Clone the template element
				const template = element.cloneNode(true) as HTMLElement;

				// Mark as clone and remove the data-each attribute to prevent recursive processing
				template.setAttribute("data-mf-each-clone", "true");
				template.removeAttribute("data-each");
				template.style.display = ""; // Ensure clone is visible

				// Create props for this iteration
				const iterationProps: Record<string, State<unknown>> = {};

				// Only inherit props that don't conflict with iteration aliases
				for (const [key, state] of Object.entries(this.props)) {
					if (key !== keyName && key !== valName) {
						iterationProps[key] = state;
					}
				}

				// Add iteration-specific props
				iterationProps[keyName] = new State(i);
				iterationProps[valName] = new State(value);
				console.log("Iteration props:", Object.keys(iterationProps));

				// Insert the clone after the template element
				if (parent) {
					parent.insertBefore(template, element.nextSibling);
				}

				// Create a RegEl for the cloned element with iteration props
				// We need to manually set up the data-bind expressions with the iteration context
				const cloneRegEl = new RegEl(template, iterationProps);

				// Handle data-bind expressions for the cloned element
				console.log(
					"Template data-bind attribute:",
					template.dataset["bind"]
				);

				// Split data-bind expressions respecting quotes
				const splitBindExpressions = (bindStr: string): string[] => {
					const expressions: string[] = [];
					let current = "";
					let inQuotes = false;
					let quoteChar = "";

					for (let i = 0; i < bindStr.length; i++) {
						const char = bindStr[i];

						if (
							(char === '"' || char === "'") &&
							(i === 0 || bindStr[i - 1] !== "\\")
						) {
							if (!inQuotes) {
								inQuotes = true;
								quoteChar = char;
							} else if (char === quoteChar) {
								inQuotes = false;
								quoteChar = "";
							}
						}

						if (char === "," && !inQuotes) {
							expressions.push(current.trim());
							current = "";
						} else {
							current += char;
						}
					}

					if (current.trim()) {
						expressions.push(current.trim());
					}

					return expressions;
				};

				const bindExpressions = template.dataset["bind"]
					? splitBindExpressions(template.dataset["bind"])
					: [];
				bindExpressions.forEach((binding) => {
					console.log("Processing binding:", binding);
					// Split only on the first colon to handle expressions with colons in them
					const colonIndex = binding.indexOf(":");
					if (colonIndex === -1) return;

					const property = binding.substring(0, colonIndex).trim();
					const expr = binding.substring(colonIndex + 1).trim();
					console.log(
						"Split result - property:",
						property,
						"expr:",
						expr
					);
					if (!property || !expr) return;

					// For cloned elements, we need to manually map @ references to context keys
					// The expression evaluator expects context keys without @ prefix
					// So @index should become index, @todo should become todo, etc.
					// But we need to keep the @ for the expression parser to recognize them as state refs
					let processedExpr = expr;

					console.log("Original expression:", expr);
					console.log("Processed expression:", processedExpr);

					const exprResult = evaluateExpression(processedExpr);

					// Create a state that evaluates the bind expression with iteration props context
					const newState = new State(() => {
						const context: Record<string, unknown> = {};
						// Map iteration props to context without the @ prefix
						for (const [key, state] of Object.entries(
							iterationProps
						)) {
							context[key] = state.value;
						}
						console.log("=== CLONE BIND DEBUG ===");
						console.log("Expression:", processedExpr);
						console.log(
							"Iteration props keys:",
							Object.keys(iterationProps)
						);
						console.log("Context keys:", Object.keys(context));
						console.log("Context values:", context);
						console.log(
							"Expression state refs:",
							exprResult.stateRefs
						);

						const result = exprResult.fn(context);
						console.log("Clone bind result:", result);
						return result;
					});

					// Set up the effect to update the property
					newState?.effect(() => {
						if (property in template)
							(template as any)[property] = newState.value;
						else
							template.setAttribute(
								property,
								String(newState.value ?? "")
							);
					});

					// Trigger initial evaluation
					newState.value;
				});
			}
		});

		// Trigger initial render by accessing the value
		if (this._each) {
			this._each.value;
		}

		RegEl._registry.set(element, this);
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
