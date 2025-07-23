import { State } from "./State";
import { RegEl } from "./RegisteredElement";
import { evaluateExpression, extractVariableNames } from "./expression-parser";

class ScopeContext {
	private vars = new Map<string, State<unknown>>();
	constructor(private parent?: ScopeContext) {}

	set(name: string, state: State<unknown>) {
		this.vars.set(name, state);
	}

	get(name: string): State<unknown> | undefined {
		return this.vars.get(name) ?? this.parent?.get(name);
	}

	createChild() {
		return new ScopeContext(this);
	}

	// Convert scope context to plain object for expression evaluation
	toContext(): Record<string, any> {
		const ctx: Record<string, any> = this.parent?.toContext() ?? {};

		// Add our variables, dereferencing State values
		for (const [key, state] of this.vars) {
			ctx[key] = state.value;
		}

		return ctx;
	}
}

export class AttributeParser {
	private scopeContexts = new WeakMap<Element, ScopeContext>();
	private globalScopeContext = new ScopeContext();

	/**
	 * Create a reactive State from an expression string with auto-discovery of global variables
	 */
	private createStateFromExpression(
		expression: string,
		scopeContext: ScopeContext
	): State<unknown> {
		return new State(() => {
			// Auto-discover and register missing variables
			const variableNames = extractVariableNames(expression);
			for (const varName of variableNames) {
				if (!scopeContext.get(varName)) {
					if (typeof window !== "undefined") {
						const globalValue = (window as any)[varName];
						if (globalValue !== undefined) {
							scopeContext.set(
								varName,
								globalValue instanceof State
									? globalValue
									: new State(globalValue)
							);
						} else {
							// Ensure missing variables are set to undefined in context
							scopeContext.set(varName, new State(undefined));
						}
					} else {
						// Ensure missing variables are set to undefined in context
						scopeContext.set(varName, new State(undefined));
					}
				}
			}

			const result = evaluateExpression(
				expression,
				scopeContext.toContext()
			);
			return result === undefined ? "" : result;
		});
	}

	/**
	 * Create a boolean State from an expression for conditional rendering
	 */
	private createBooleanStateFromExpression(
		expression: string,
		scopeContext: ScopeContext
	): State<boolean> {
		return new State(() => {
			// Auto-discover and register missing variables
			const variableNames = extractVariableNames(expression);
			for (const varName of variableNames) {
				if (!scopeContext.get(varName)) {
					if (typeof window !== "undefined") {
						const globalValue = (window as any)[varName];
						if (globalValue !== undefined) {
							scopeContext.set(
								varName,
								globalValue instanceof State
									? globalValue
									: new State(globalValue)
							);
						} else {
							// Ensure missing variables are set to undefined in context
							scopeContext.set(varName, new State(undefined));
						}
					} else {
						// Ensure missing variables are set to undefined in context
						scopeContext.set(varName, new State(undefined));
					}
				}
			}

			return Boolean(
				evaluateExpression(expression, scopeContext.toContext())
			);
		});
	}

	parseElement(element: HTMLElement) {
		const scopeContext = this.getScopeContext(element);

		this.parseDataScope(element, scopeContext);
		this.parseDataBind(element, scopeContext);
		this.parseDataSync(element, scopeContext);
		const showState = this.parseConditionalAttributes(
			element,
			scopeContext
		);
		const eachConfig = this.parseDataEach(element, scopeContext);
		const isElse = element.hasAttribute("data-else");

		if (showState || eachConfig || isElse) {
			return RegEl.register(element, {
				show: showState,
				each: eachConfig?.arrayState,
				else: isElse,
			});
		}
		return null;
	}

	private getScopeContext(element: HTMLElement) {
		const existing = this.scopeContexts.get(element);
		if (existing) return existing;

		let parent = element.parentElement;
		while (parent) {
			const parentContext = this.scopeContexts.get(parent);
			if (parentContext) {
				const childContext = parentContext.createChild();
				this.scopeContexts.set(element, childContext);
				return childContext;
			}
			parent = parent.parentElement;
		}

		const childContext = this.globalScopeContext.createChild();
		this.scopeContexts.set(element, childContext);
		return childContext;
	}

	private parseDataScope(element: HTMLElement, scopeContext: ScopeContext) {
		const scopeExpression = element.getAttribute("data-scope");
		if (!scopeExpression) return;

		const scopeItems = this.parseScopeExpression(scopeExpression);
		for (const { sourceExpression, alias } of scopeItems) {
			const sourceState = this.createStateFromExpression(
				sourceExpression,
				scopeContext
			);
			scopeContext.set(alias, sourceState);
		}
	}

	private parseDataBind(element: HTMLElement, scopeContext: ScopeContext) {
		const bindExpression = element.getAttribute("data-bind");
		if (!bindExpression) return;

		// Parse property bindings: "prop1: expr1, prop2: expr2, ..." or single expression
		const bindings = bindExpression.split(",").map((binding) => {
			const colonIndex = binding.indexOf(":");
			return colonIndex === -1
				? { property: null, expression: binding.trim() }
				: {
						property: binding.slice(0, colonIndex).trim(),
						expression: binding.slice(colonIndex + 1).trim(),
				  };
		});

		for (const { property, expression } of bindings) {
			const state = this.createStateFromExpression(
				expression,
				scopeContext
			);
			if (property === null) {
				// Bind entire state object to element
				state.effect(() => {
					const value = state.value;
					if (typeof value === "object" && value !== null) {
						Object.assign(element, value);
					}
				});
			} else {
				// Bind specific property
				state.effect(() => {
					(element as any)[property] = state.value;
				});
			}
		}
	}

	private parseDataSync(element: HTMLElement, scopeContext: ScopeContext) {
		const syncExpression = element.getAttribute("data-sync");
		if (!syncExpression) return;

		const trimmed = syncExpression.trim();
		// For data-sync, we need a simple variable reference (no property access)
		if (trimmed.includes(".")) {
			throw new Error(
				`data-sync requires exactly one variable, got: ${syncExpression}`
			);
		}

		const variableNames = extractVariableNames(trimmed);
		if (variableNames.length !== 1) {
			throw new Error(
				`data-sync requires exactly one variable, got: ${syncExpression}`
			);
		}

		const state = scopeContext.get(variableNames[0]!);
		if (!state) {
			throw new Error(
				`Variable '${variableNames[0]}' not found in scope for data-sync`
			);
		}

		// Set up two-way binding
		state.effect(() => {
			if (
				element instanceof HTMLInputElement ||
				element instanceof HTMLTextAreaElement
			) {
				element.value = String(state.value ?? "");
			}
		});

		// Listen for input changes
		const updateHandler = (event: Event) => {
			const target = event.target as
				| HTMLInputElement
				| HTMLTextAreaElement;
			state.value = target.value;
		};

		element.addEventListener("input", updateHandler);
		element.addEventListener("change", updateHandler);
	}

	private parseConditionalAttributes(
		element: HTMLElement,
		scopeContext: ScopeContext
	) {
		const ifExpression = element.getAttribute("data-if");
		const elseIfExpression = element.getAttribute("data-else-if");

		if (ifExpression)
			return this.createBooleanStateFromExpression(
				ifExpression,
				scopeContext
			);
		if (elseIfExpression)
			return this.createBooleanStateFromExpression(
				elseIfExpression,
				scopeContext
			);
		return undefined;
	}

	private parseDataEach(element: HTMLElement, scopeContext: ScopeContext) {
		const eachExpression = element.getAttribute("data-each");
		if (!eachExpression) return undefined;

		const { arrayState, itemAlias, keyAlias } = this.parseEachExpression(
			eachExpression,
			scopeContext
		);
		return { arrayState, itemAlias, keyAlias };
	}

	private parseEachExpression(
		expression: string,
		scopeContext: ScopeContext
	) {
		const parts = expression.split(" as ");
		if (parts.length !== 2 || !parts[0] || !parts[1]) {
			throw new Error(
				`Invalid each expression: ${expression}. Expected format: "items as item" or "items as key, value"`
			);
		}

		const [arrayExpr, aliasesPart] = parts;
		const aliases = aliasesPart
			.trim()
			.split(",")
			.map((s) => s.trim());
		const itemAlias = aliases[0];
		const keyAlias = aliases[1];

		if (!itemAlias) {
			throw new Error(
				`Invalid each expression: ${expression}. Item alias cannot be empty`
			);
		}

		const arrayState = this.createStateFromExpression(
			arrayExpr.trim(),
			scopeContext
		);
		const typedArrayState = new State(() => {
			const value = arrayState.value;
			return Array.isArray(value) ? value : [];
		});

		return { arrayState: typedArrayState, itemAlias, keyAlias };
	}

	private parseScopeExpression(expression: string) {
		return expression.split(",").map((item) => {
			const parts = item.trim().split(" as ");
			if (parts.length !== 2 || !parts[0] || !parts[1]) {
				throw new Error(
					`Invalid scope expression: ${item}. Expected format: "source as alias"`
				);
			}
			return {
				sourceExpression: parts[0].trim(),
				alias: parts[1].trim(),
			};
		});
	}

	addGlobalVariable(name: string, state: State<unknown>) {
		this.globalScopeContext.set(name, state);
	}

	parseContainer(container: HTMLElement | Document = document) {
		const elements = container.querySelectorAll(
			"[data-if], [data-else-if], [data-else], [data-each], [data-scope], [data-bind], [data-sync]"
		);
		for (let i = 0; i < elements.length; i++) {
			this.parseElement(elements[i] as HTMLElement);
		}
	}
}

export const attributeParser = new AttributeParser();
