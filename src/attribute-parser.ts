import { State } from "./State";
import { RegEl } from "./RegisteredElement";

/**
 * Scope context for variable resolution
 * Maintains hierarchy: local scope -> parent scopes -> global state registry
 */
class ScopeContext {
	private variables = new Map<string, State<any>>();
	private parent?: ScopeContext;

	constructor(parent?: ScopeContext) {
		this.parent = parent;
	}

	set(name: string, state: State<any>): void {
		this.variables.set(name, state);
	}

	get(name: string): State<any> | undefined {
		// Check local scope first
		const local = this.variables.get(name);
		if (local) return local;

		// Check parent scopes
		if (this.parent) {
			return this.parent.get(name);
		}

		// TODO: Check global state registry as fallback
		// For now, return undefined if not found
		return undefined;
	}

	createChild(): ScopeContext {
		return new ScopeContext(this);
	}
}

/**
 * CSP-compliant expression resolver
 * Parses property chains and creates reactive computed states
 */
class ExpressionResolver {
	private scopeContext: ScopeContext;

	constructor(scopeContext: ScopeContext) {
		this.scopeContext = scopeContext;
	}

	/**
	 * Parse a property chain like "user.profile.name" into ["user", "profile", "name"]
	 */
	private parsePropertyChain(expression: string): string[] {
		// Simple property chain parser - handles dot notation
		// TODO: Expand to handle array access [0], function calls(), etc.
		return expression
			.trim()
			.split(".")
			.map((part) => part.trim());
	}

	/**
	 * Parse literal values like true, false, numbers, and strings
	 */
	private parseLiteral(expression: string): any {
		// Boolean literals
		if (expression === "true") return true;
		if (expression === "false") return false;

		// Null and undefined
		if (expression === "null") return null;
		if (expression === "undefined") return undefined;

		// Number literals
		const num = Number(expression);
		if (!isNaN(num) && isFinite(num)) {
			return num;
		}

		// String literals (quoted)
		if (
			(expression.startsWith('"') && expression.endsWith('"')) ||
			(expression.startsWith("'") && expression.endsWith("'"))
		) {
			return expression.slice(1, -1);
		}

		// Not a literal
		return undefined;
	}

	/**
	 * Create a reactive State that traverses a property chain
	 */
	resolveExpression(expression: string): State<any> {
		// Handle literal values first
		const literal = this.parseLiteral(expression.trim());
		if (literal !== undefined) {
			return new State(literal);
		}

		const propertyChain = this.parsePropertyChain(expression);
		const rootVariableName = propertyChain[0];

		if (!rootVariableName) {
			throw new Error(`Invalid expression: ${expression}`);
		}

		const rootState = this.scopeContext.get(rootVariableName);
		if (!rootState) {
			throw new Error(
				`Variable '${rootVariableName}' not found in scope`
			);
		}

		// If it's just a single variable, return it directly
		if (propertyChain.length === 1) {
			return rootState;
		}

		// Create a computed state that traverses the property chain
		return new State(() => {
			let current = rootState.value;

			// Traverse the property chain starting from index 1
			for (let i = 1; i < propertyChain.length; i++) {
				const property = propertyChain[i];
				if (current == null || property == null) {
					return undefined;
				}
				current = (current as any)[property];
			}

			return current;
		});
	}

	/**
	 * Check if an expression evaluates to truthy
	 */
	resolveBooleanExpression(expression: string): State<boolean> {
		const valueState = this.resolveExpression(expression);
		return new State(() => Boolean(valueState.value));
	}

	/**
	 * Parse "items as item" or "items as key, value" syntax
	 */
	parseEachExpression(expression: string): {
		arrayState: State<any[]>;
		itemAlias: string;
		keyAlias?: string;
	} {
		const parts = expression.split(" as ");
		if (parts.length !== 2 || !parts[0] || !parts[1]) {
			throw new Error(
				`Invalid each expression: ${expression}. Expected format: "items as item" or "items as key, value"`
			);
		}

		const arrayExpression = parts[0].trim();
		const aliasesPart = parts[1].trim();

		// Parse aliases - can be "item" or "key, value"
		const aliases = aliasesPart.split(",").map((alias) => alias.trim());
		const itemAlias = aliases[0];
		const keyAlias = aliases.length > 1 ? aliases[1] : undefined;

		if (!itemAlias) {
			throw new Error(
				`Invalid each expression: ${expression}. Item alias cannot be empty`
			);
		}

		const arrayState = this.resolveExpression(arrayExpression);

		// Ensure it's treated as an array
		const typedArrayState = new State(() => {
			const value = arrayState.value;
			return Array.isArray(value) ? value : [];
		});

		return { arrayState: typedArrayState, itemAlias, keyAlias };
	}

	/**
	 * Parse "user as u, settings as s" syntax for data-scope
	 */
	parseScopeExpression(
		expression: string
	): Array<{ sourceExpression: string; alias: string }> {
		const scopeItems = expression.split(",").map((item) => item.trim());

		return scopeItems.map((item) => {
			const parts = item.split(" as ");
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
}

/**
 * Parses Manifold data attributes and creates RegisteredElement configs
 */
export class AttributeParser {
	private scopeContexts = new WeakMap<Element, ScopeContext>();
	private globalScopeContext = new ScopeContext();

	/**
	 * Parse an element and register it with RegisteredElement
	 */
	parseElement(element: HTMLElement): RegEl | null {
		const scopeContext = this.getScopeContext(element);
		const resolver = new ExpressionResolver(scopeContext);

		// Check for data-scope first to establish local scope
		this.parseDataScope(element, scopeContext, resolver);

		// Parse conditional attributes
		const showState = this.parseConditionalAttributes(element, resolver);

		// Parse data-each
		const eachConfig = this.parseDataEach(element, resolver);

		// Parse data-else
		const isElse = element.hasAttribute("data-else");

		// Only register if there are relevant attributes
		if (showState || eachConfig || isElse) {
			return RegEl.register(element, {
				show: showState,
				each: eachConfig?.arrayState,
				else: isElse,
				// TODO: Add props for scoped variables
			});
		}

		return null;
	}

	/**
	 * Get or create scope context for an element
	 */
	private getScopeContext(element: HTMLElement): ScopeContext {
		// Check if element already has a scope context
		const existing = this.scopeContexts.get(element);
		if (existing) return existing;

		// Find parent scope context by walking up the DOM
		let parent = element.parentElement;
		while (parent) {
			const parentContext = this.scopeContexts.get(parent);
			if (parentContext) {
				// Create child context
				const childContext = parentContext.createChild();
				this.scopeContexts.set(element, childContext);
				return childContext;
			}
			parent = parent.parentElement;
		}

		// No parent scope found, use global context
		const childContext = this.globalScopeContext.createChild();
		this.scopeContexts.set(element, childContext);
		return childContext;
	}

	/**
	 * Parse data-scope attribute and establish local variables
	 */
	private parseDataScope(
		element: HTMLElement,
		scopeContext: ScopeContext,
		resolver: ExpressionResolver
	): void {
		const scopeExpression = element.getAttribute("data-scope");
		if (!scopeExpression) return;

		const scopeItems = resolver.parseScopeExpression(scopeExpression);

		for (const { sourceExpression, alias } of scopeItems) {
			const sourceState = resolver.resolveExpression(sourceExpression);
			scopeContext.set(alias, sourceState);
		}
	}

	/**
	 * Parse conditional attributes (data-if, data-else-if)
	 */
	private parseConditionalAttributes(
		element: HTMLElement,
		resolver: ExpressionResolver
	): State<boolean> | undefined {
		const ifExpression = element.getAttribute("data-if");
		const elseIfExpression = element.getAttribute("data-else-if");

		if (ifExpression) {
			return resolver.resolveBooleanExpression(ifExpression);
		} else if (elseIfExpression) {
			return resolver.resolveBooleanExpression(elseIfExpression);
		}

		return undefined;
	}

	/**
	 * Parse data-each attribute
	 */
	private parseDataEach(
		element: HTMLElement,
		resolver: ExpressionResolver
	): { arrayState: State<any[]> } | undefined {
		const eachExpression = element.getAttribute("data-each");
		if (!eachExpression) return undefined;

		const { arrayState } = resolver.parseEachExpression(eachExpression);

		// TODO: We need to communicate the aliases back to RegisteredElement
		// For now, just return the array state
		return { arrayState };
	}

	/**
	 * Add a global variable to the root scope context
	 */
	addGlobalVariable(name: string, state: State<any>): void {
		this.globalScopeContext.set(name, state);
	}

	/**
	 * Parse all elements in a container
	 */
	parseContainer(container: HTMLElement | Document = document): void {
		// Find all elements with Manifold data attributes
		const selector =
			"[data-if], [data-else-if], [data-else], [data-each], [data-scope]";
		const elements = container.querySelectorAll(selector);

		for (let i = 0; i < elements.length; i++) {
			const element = elements[i] as HTMLElement;
			this.parseElement(element);
		}
	}
}

// Export a default instance for convenience
export const attributeParser = new AttributeParser();
