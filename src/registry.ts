import { evaluateExpression } from "./expression-parser";
import { State } from "./State";
import { isEqual } from "./equality";

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

	// Debug method to access registry
	static getRegEl(element: Element | DocumentFragment): RegEl | undefined {
		return RegEl._registry.get(element);
	}

	private _cachedContent: Node | null = null;

	// Each loop state tracking for efficient updates
	private _previousEachArray: Array<unknown> = [];
	private _eachClones: Array<{
		element: HTMLElement;
		regEl: RegEl;
		value: unknown;
		index: number;
	}> = [];

	// Helper function to create context from props
	private static createContext(
		props: Record<string, State<unknown>>
	): Record<string, unknown> {
		const context: Record<string, unknown> = {};
		for (const [key, state] of Object.entries(props)) {
			context[key] = state.value;
		}
		return context;
	}

	// Helper function to set element property
	private static setElementProperty(
		element: HTMLElement | SVGElement | MathMLElement,
		property: string,
		value: unknown
	): void {
		if (property in element) {
			(element as any)[property] = value;
		} else {
			element.setAttribute(property, String(value ?? ""));
		}
	}

	// Helper function to parse property:expression binding
	private static parseBinding(
		binding: string
	): { property: string; expr: string } | null {
		// Split only on the first colon to handle expressions with colons in them
		const colonIndex = binding.indexOf(":");
		if (colonIndex === -1) return null;

		const property = binding.substring(0, colonIndex).trim();
		const expr = binding.substring(colonIndex + 1).trim();
		if (!property || !expr) return null;
		return { property, expr };
	}

	// Helper function to split bind expressions respecting quotes
	private static splitBindExpressions(bindStr: string): string[] {
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
	}

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
				const context = RegEl.createContext(props);
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
				const context = RegEl.createContext(props);
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
			const parsed = RegEl.parseBinding(binding);
			if (!parsed) return;
			const { property, expr } = parsed;

			// Parse the bind expression to handle aliases - pass current props for context
			const { processedExpression } = RegEl.parseAliases(
				expr,
				props,
				false
			);
			const exprResult = evaluateExpression(processedExpression);

			// Create a state that evaluates the bind expression with full props context
			const newState = new State(() => {
				const context = RegEl.createContext(props);
				return exprResult.fn(context);
			});

			// Set up the effect to update the property
			newState?.effect(() => {
				RegEl.setElementProperty(element, property, newState.value);
			});

			// Trigger initial evaluation
			newState.value;
		});

		// Handle sync (two-way binding)
		element.dataset["sync"]?.split(/\s*,\s*/).forEach((binding) => {
			const parsed = RegEl.parseBinding(binding);
			if (!parsed) return;
			const { property, expr } = parsed;

			// Parse the sync expression to handle aliases using the current props context
			const { processedExpression } = RegEl.parseAliases(
				expr,
				props,
				false
			);
			const exprResult = evaluateExpression(processedExpression);

			// Create a state that evaluates the sync expression with full props context
			const newState = new State(() => {
				const context = RegEl.createContext(props);
				const result = exprResult.fn(context);
				return result;
			});

			// Set up the effect to update the property (state -> element)
			newState?.effect(() => {
				try {
					RegEl.setElementProperty(element, property, newState.value);
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
			// Parse data-each expression: "@items as item, index" or "@items as item"
			const eachMatch = eachExpr.match(
				/@([a-zA-Z_$][a-zA-Z0-9_.$]*)\s+as\s+(.+)/
			);
			if (eachMatch) {
				const [, stateRef] = eachMatch;
				// Get the array state directly
				const arrayState = State.get<Array<unknown>>(stateRef);
				if (arrayState) {
					eachState = arrayState;
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
			if (!Array.isArray(eachArray)) {
				console.warn("Each value is not an array:", eachArray);
				return;
			}

			// Extract key and value names from data-each expression
			const eachExpr = (element as HTMLElement).dataset?.["each"] || "";
			const [, aliasExpr] = eachExpr.split(" as ");
			const aliases = aliasExpr?.split(",").map((s) => s.trim()) || [
				"item",
				"index",
			];
			const valName = aliases[0] || "item";
			const keyName = aliases[1] || "index";

			// Hide the original template element
			element.style.display = "none";

			// Efficiently update the DOM using diffing
			this._updateEachLoop(eachArray, valName, keyName, element);
		});

		// Trigger initial render by accessing the value
		if (this._each) {
			this._each.value;
		}

		RegEl._registry.set(element, this);
	}

	/**
	 * Efficiently update the each loop DOM by comparing the new array with the previous one
	 * Only updates elements that have actually changed
	 */
	private _updateEachLoop(
		newArray: Array<unknown>,
		valName: string,
		keyName: string,
		templateElement: HTMLElement | SVGElement | MathMLElement
	): void {
		const parent = templateElement.parentElement;
		if (!parent) return;

		// If it's the first render or the array lengths differ significantly, do a full rebuild
		if (
			this._eachClones.length === 0 ||
			Math.abs(newArray.length - this._previousEachArray.length) >
				newArray.length / 2
		) {
			this._fullRebuildEachLoop(
				newArray,
				valName,
				keyName,
				templateElement
			);
			return;
		}

		// Perform efficient diffing
		const oldArray = this._previousEachArray;
		const changes: Array<{
			type: "keep" | "update" | "add" | "remove";
			oldIndex?: number;
			newIndex: number;
			value: unknown;
		}> = [];

		// Find what changed using a simple diff algorithm
		for (let newIndex = 0; newIndex < newArray.length; newIndex++) {
			const newValue = newArray[newIndex];
			let foundIndex = -1;

			// Look for this value in the old array
			for (let oldIndex = 0; oldIndex < oldArray.length; oldIndex++) {
				if (isEqual(oldArray[oldIndex], newValue)) {
					foundIndex = oldIndex;
					break;
				}
			}

			if (foundIndex !== -1) {
				// Found the same value - check if it moved
				const existingClone = this._eachClones[foundIndex];
				if (existingClone && foundIndex === newIndex) {
					// Same position, just update index
					changes.push({
						type: "keep",
						oldIndex: foundIndex,
						newIndex,
						value: newValue,
					});
				} else {
					// Moved or different position, update it
					changes.push({
						type: "update",
						oldIndex: foundIndex,
						newIndex,
						value: newValue,
					});
				}
			} else {
				// New item
				changes.push({ type: "add", newIndex, value: newValue });
			}
		}

		// Handle removals (items in old array but not in new array)
		for (let oldIndex = 0; oldIndex < oldArray.length; oldIndex++) {
			const oldValue = oldArray[oldIndex];
			let found = false;
			for (const newValue of newArray) {
				if (isEqual(oldValue, newValue)) {
					found = true;
					break;
				}
			}
			if (!found) {
				changes.push({
					type: "remove",
					oldIndex,
					newIndex: -1,
					value: oldValue,
				});
			}
		}

		// Apply changes efficiently
		const newClones: Array<
			| {
					element: HTMLElement;
					regEl: RegEl;
					value: unknown;
					index: number;
			  }
			| undefined
		> = new Array(newArray.length);
		const elementsToRemove: HTMLElement[] = [];

		// Process removes first
		for (const change of changes) {
			if (change.type === "remove" && change.oldIndex !== undefined) {
				const clone = this._eachClones[change.oldIndex];
				if (clone) {
					elementsToRemove.push(clone.element);
				}
			}
		}

		// Remove elements from DOM
		elementsToRemove.forEach((element) => element.remove());

		// Process keeps and updates first (preserve existing elements)
		for (const change of changes) {
			if (change.type === "keep" && change.oldIndex !== undefined) {
				// Just update the index
				const clone = this._eachClones[change.oldIndex];
				if (clone) {
					this._updateCloneIndex(clone, change.newIndex);
					newClones[change.newIndex] = {
						...clone,
						index: change.newIndex,
					};
				}
			} else if (
				change.type === "update" &&
				change.oldIndex !== undefined
			) {
				// Update value and index
				const clone = this._eachClones[change.oldIndex];
				if (clone) {
					this._updateCloneValue(
						clone,
						change.value,
						change.newIndex
					);
					newClones[change.newIndex] = {
						...clone,
						value: change.value,
						index: change.newIndex,
					};
				}
			}
		}

		// Now process adds in order from 0 to newArray.length-1
		const addChanges = changes
			.filter((c) => c.type === "add")
			.sort((a, b) => a.newIndex - b.newIndex);
		for (const change of addChanges) {
			// Create new element
			const newClone = this._createCloneForValue(
				change.value,
				change.newIndex,
				valName,
				keyName,
				templateElement
			);
			if (newClone) {
				newClones[change.newIndex] = newClone;
			}
		}

		// Now reinsert all elements in the correct order
		for (let i = 0; i < newClones.length; i++) {
			const clone = newClones[i];
			if (clone) {
				// Find the position to insert this element
				const insertReferenceNode = this._findInsertPosition(
					i,
					newClones,
					templateElement
				);

				// Check if element is already in the DOM at the correct position
				const isAlreadyInCorrectPosition =
					clone.element.parentNode &&
					clone.element.nextSibling === insertReferenceNode;

				// Only insert if it's not already in the right position
				if (!isAlreadyInCorrectPosition) {
					if (insertReferenceNode) {
						parent.insertBefore(clone.element, insertReferenceNode);
					} else {
						parent.appendChild(clone.element);
					}
				}
			}
		}

		// Update our tracking arrays
		this._eachClones = newClones.filter(
			(
				clone
			): clone is {
				element: HTMLElement;
				regEl: RegEl;
				value: unknown;
				index: number;
			} => clone !== undefined
		);
		this._previousEachArray = [...newArray]; // Copy the array
	}

	/**
	 * Full rebuild of the each loop when diffing is not efficient
	 */
	private _fullRebuildEachLoop(
		newArray: Array<unknown>,
		valName: string,
		keyName: string,
		templateElement: HTMLElement | SVGElement | MathMLElement
	): void {
		const parent = templateElement.parentElement;
		if (!parent) return;

		// Remove all existing clones
		this._eachClones.forEach((clone) => clone.element.remove());
		this._eachClones = [];

		if (newArray.length === 0) {
			this._previousEachArray = [];
			return;
		}

		// Create new clones for each item
		let insertReferenceNode = templateElement.nextSibling;
		for (let i = 0; i < newArray.length; i++) {
			const value = newArray[i];
			const clone = this._createCloneForValue(
				value,
				i,
				valName,
				keyName,
				templateElement
			);
			if (clone) {
				parent.insertBefore(clone.element, insertReferenceNode);
				// Update the reference node to insert the next element after this one
				insertReferenceNode = clone.element.nextSibling;
				this._eachClones.push(clone);
			}
		}

		this._previousEachArray = [...newArray];
	}

	/**
	 * Create a new cloned element for a specific array value
	 */
	private _createCloneForValue(
		value: unknown,
		index: number,
		valName: string,
		keyName: string,
		templateElement: HTMLElement | SVGElement | MathMLElement
	): {
		element: HTMLElement;
		regEl: RegEl;
		value: unknown;
		index: number;
	} | null {
		// Clone the template element
		const clonedElement = templateElement.cloneNode(true) as HTMLElement;

		// Mark as clone and remove the data-each attribute to prevent recursive processing
		clonedElement.setAttribute("data-mf-each-clone", "true");
		clonedElement.removeAttribute("data-each");
		clonedElement.style.display = ""; // Ensure clone is visible

		// Create props for this iteration
		const iterationProps: Record<string, State<unknown>> = {};

		// Only inherit props that don't conflict with iteration aliases
		for (const [key, state] of Object.entries(this.props)) {
			if (key !== keyName && key !== valName) {
				iterationProps[key] = state;
			}
		}

		// Add iteration-specific props
		iterationProps[keyName] = new State(index);
		iterationProps[valName] = new State(value);

		// Create a RegEl for the cloned element with iteration props
		const cloneRegEl = new RegEl(clonedElement, iterationProps);

		// Set up data-bind expressions for the cloned element
		this._setupCloneBindings(clonedElement, iterationProps);

		return {
			element: clonedElement,
			regEl: cloneRegEl,
			value,
			index,
		};
	}

	/**
	 * Update the index of an existing clone
	 */
	private _updateCloneIndex(
		clone: {
			element: HTMLElement;
			regEl: RegEl;
			value: unknown;
			index: number;
		},
		newIndex: number
	): void {
		// Find the keyName from the clone's regEl props
		for (const [, state] of Object.entries(clone.regEl.props)) {
			if (
				typeof state.value === "number" &&
				state.value === clone.index
			) {
				// This is likely the index state
				state.value = newIndex;
				break;
			}
		}
	}

	/**
	 * Update both value and index of an existing clone
	 */
	private _updateCloneValue(
		clone: {
			element: HTMLElement;
			regEl: RegEl;
			value: unknown;
			index: number;
		},
		newValue: unknown,
		newIndex: number
	): void {
		// Update both value and index states
		for (const [, state] of Object.entries(clone.regEl.props)) {
			if (
				typeof state.value === "number" &&
				state.value === clone.index
			) {
				// This is the index state
				state.value = newIndex;
			} else if (isEqual(state.value, clone.value)) {
				// This is the value state
				state.value = newValue;
			}
		}
	}

	/**
	 * Find the correct insertion position for a new element
	 */
	private _findInsertPosition(
		targetIndex: number,
		clones: Array<
			| {
					element: HTMLElement;
					regEl: RegEl;
					value: unknown;
					index: number;
			  }
			| undefined
		>,
		templateElement: HTMLElement | SVGElement | MathMLElement
	): Node | null {
		// If inserting at the beginning, insert after the template
		if (targetIndex === 0) {
			return templateElement.nextSibling;
		}

		// Look for the previous existing element before this position
		for (let i = targetIndex - 1; i >= 0; i--) {
			if (clones[i]) {
				return clones[i]!.element.nextSibling;
			}
		}

		// If no element found before, insert after template
		return templateElement.nextSibling;
	}

	/**
	 * Set up data-bind expressions for a cloned element
	 */
	private _setupCloneBindings(
		clonedElement: HTMLElement,
		iterationProps: Record<string, State<unknown>>
	): void {
		// Handle data-bind expressions for the cloned element and all its descendants
		const elementsWithBind = [
			clonedElement,
			...Array.from(clonedElement.querySelectorAll("[data-bind]")),
		];

		elementsWithBind.forEach((element) => {
			const bindAttr = (element as HTMLElement).dataset?.["bind"];
			if (!bindAttr) return;

			const bindExpressions = RegEl.splitBindExpressions(bindAttr);

			bindExpressions.forEach((binding) => {
				const parsed = RegEl.parseBinding(binding);
				if (!parsed) return;
				const { property, expr } = parsed;

				const processedExpr = expr;

				const exprResult = evaluateExpression(processedExpr);

				// Create a state that evaluates the bind expression with iteration props context
				const newState = new State(() => {
					const context = RegEl.createContext(iterationProps);
					const result = exprResult.fn(context);
					return result;
				});

				// Set up the effect to update the property
				newState?.effect(() => {
					RegEl.setElementProperty(
						element as HTMLElement,
						property,
						newState.value
					);
				});

				// Trigger initial evaluation
				newState.value;
			});
		});
	}
}
