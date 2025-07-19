import { State } from "./State";
import { RegEl } from "./RegisteredElement";

const QUOTE = /["'`]/;
const LITERALS: Record<string, unknown> = {
	true: true,
	false: false,
	null: null,
	undefined: undefined,
};

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
}

class ExpressionResolver {
	constructor(private scopeContext: ScopeContext) {}

	resolveExpression(exp: string): State<unknown> {
		const expression = exp.trim();

		// Check literals first
		if (expression in LITERALS) {
			return new State(LITERALS[expression]);
		}

		// Check numbers
		const num = +expression;
		if (!isNaN(num) && isFinite(num)) {
			return new State(num);
		}

		// Check quoted strings
		if (expression.length > 1) {
			const first = expression[0];
			const last = expression.slice(-1);
			if (first && QUOTE.test(first) && first === last) {
				return new State(expression.slice(1, -1));
			}
		}

		// Parse property chain
		const chain = expression.split(".").map((s) => s.trim());
		const root = chain[0];

		if (!root) throw new Error(`Invalid expression: ${expression}`);

		const rootState = this.scopeContext.get(root);
		if (!rootState) {
			// Try to find global JavaScript variable as fallback
			const globalVar = this.tryGetGlobalVariable(root);
			if (globalVar) {
				// Auto-register it for future use
				this.scopeContext.set(root, globalVar);
			} else {
				throw new Error(`Variable '${root}' not found in scope`);
			}
		}

		const resolvedRoot = this.scopeContext.get(root)!;

		if (chain.length === 1) return resolvedRoot;

		return new State(() => {
			let current = resolvedRoot.value;
			for (let i = 1; i < chain.length && current != null; i++) {
				const prop = chain[i];
				if (prop) current = (current as any)[prop];
			}
			return current;
		});
	}

	private tryGetGlobalVariable(name: string): State<unknown> | null {
		if (typeof window !== "undefined") {
			const globalValue = (window as any)[name];
			if (globalValue !== undefined) {
				// If it's already a State, use it directly
				if (globalValue instanceof State) {
					return globalValue;
				}
				// Otherwise wrap it in a State
				return new State(globalValue);
			}
		}
		return null;
	}

	resolveBooleanExpression(expression: string) {
		return new State(() =>
			Boolean(this.resolveExpression(expression).value)
		);
	}

	parseEachExpression(expression: string) {
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

		const arrayState = this.resolveExpression(arrayExpr.trim());
		const typedArrayState = new State(() => {
			const value = arrayState.value;
			return Array.isArray(value) ? value : [];
		});

		return { arrayState: typedArrayState, itemAlias, keyAlias };
	}

	parseScopeExpression(expression: string) {
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
}

export class AttributeParser {
	private scopeContexts = new WeakMap<Element, ScopeContext>();
	private globalScopeContext = new ScopeContext();

	parseElement(element: HTMLElement) {
		const scopeContext = this.getScopeContext(element);
		const resolver = new ExpressionResolver(scopeContext);

		this.parseDataScope(element, scopeContext, resolver);
		const showState = this.parseConditionalAttributes(element, resolver);
		const eachConfig = this.parseDataEach(element, resolver);
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

	private parseDataScope(
		element: HTMLElement,
		scopeContext: ScopeContext,
		resolver: ExpressionResolver
	) {
		const scopeExpression = element.getAttribute("data-scope");
		if (!scopeExpression) return;

		const scopeItems = resolver.parseScopeExpression(scopeExpression);
		for (const { sourceExpression, alias } of scopeItems) {
			const sourceState = resolver.resolveExpression(sourceExpression);
			scopeContext.set(alias, sourceState);
		}
	}

	private parseConditionalAttributes(
		element: HTMLElement,
		resolver: ExpressionResolver
	) {
		const ifExpression = element.getAttribute("data-if");
		const elseIfExpression = element.getAttribute("data-else-if");

		if (ifExpression)
			return resolver.resolveBooleanExpression(ifExpression);
		if (elseIfExpression)
			return resolver.resolveBooleanExpression(elseIfExpression);
		return undefined;
	}

	private parseDataEach(element: HTMLElement, resolver: ExpressionResolver) {
		const eachExpression = element.getAttribute("data-each");
		if (!eachExpression) return undefined;

		const { arrayState } = resolver.parseEachExpression(eachExpression);
		return { arrayState };
	}

	addGlobalVariable(name: string, state: State<unknown>) {
		this.globalScopeContext.set(name, state);
	}

	parseContainer(container: HTMLElement | Document = document) {
		const elements = container.querySelectorAll(
			"[data-if], [data-else-if], [data-else], [data-each], [data-scope]"
		);
		for (let i = 0; i < elements.length; i++) {
			this.parseElement(elements[i] as HTMLElement);
		}
	}
}

export const attributeParser = new AttributeParser();
