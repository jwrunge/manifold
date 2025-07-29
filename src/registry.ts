import {
	evaluateExpression,
	ExpressionResult,
	evalProp,
} from "./expression-parser";
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

	static register(element: HTMLElement | SVGElement | MathMLElement) {
		element.mfRegister = () => RegEl.register(element);

		const props: Record<string, State<unknown>> = {};
		const attrState = new Map<string, State<unknown>>();

		// Parse scope declarations first to handle aliasing
		const scopeDeclaration = element.dataset["scope"];
		if (scopeDeclaration) {
			// Parse "@user, @counter as count, @user.name as name" format
			const scopeItems = scopeDeclaration.split(",").map((s) => s.trim());
			for (const item of scopeItems) {
				// Check for aliasing pattern: "@counter as count" or "@user.name as name"
				const asMatch = item.match(
					/^@([a-zA-Z_$][a-zA-Z0-9_$]*(?:\.[a-zA-Z_$][a-zA-Z0-9_$]*)*)\s+as\s+([a-zA-Z_$][a-zA-Z0-9_$]*)$/
				);
				if (asMatch) {
					const [, fullPath, aliasName] = asMatch;
					if (!fullPath || !aliasName) continue;

					const baseName = fullPath.split(".")[0];
					if (!baseName) continue;

					const baseState = State.get<unknown>(baseName);
					if (baseState) {
						// For simple state references like "@counter as count"
						if (!fullPath.includes(".")) {
							props[aliasName] = baseState;
						} else {
							// For property paths like "@user.name as name"
							// Create a derived state that evaluates the property path
							const derivedState = new State(() => {
								const context: Record<string, unknown> = {};
								context[baseName] = baseState.value;
								return evalProp(fullPath, context);
							});
							props[aliasName] = derivedState;
						}
					}
				} else {
					// Handle simple "@user" format (no aliasing)
					const simpleMatch = item.match(
						/^@([a-zA-Z_$][a-zA-Z0-9_$]*)$/
					);
					if (simpleMatch) {
						const [, stateName] = simpleMatch;
						if (stateName) {
							const S = State.get<unknown>(stateName);
							if (S) {
								props[stateName] = S;
							}
						}
					}
				}
			}
		}

		// Process other manifold attributes and extract their state dependencies
		for (const attr of MANIFOLD_ATTRIBUTES) {
			if (attr === "scope") continue; // Already handled above

			const attrText = element.dataset[attr];
			if (!attrText) continue;

			// Parse the expression to get both the function and state dependencies
			const exprResult = evaluateExpression(attrText);

			// Add any state dependencies that aren't already in props
			for (const stateRef of exprResult.stateRefs) {
				if (!props[stateRef]) {
					const S = State.get<unknown>(stateRef);
					if (S) {
						props[stateRef] = S;
						attrState.set(attr, S);
					}
				}
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

		for (const [attr, expTxt] of Object.entries(element.dataset)) {
			console.log("ATTR", attr, expTxt);
			const exprResult = evaluateExpression(expTxt);
			console.log("Function:", exprResult.fn);
			console.log("States:", exprResult.stateRefs);
			console.log("Result:", exprResult.fn(props));
		}

		// Handle conditionals
		// TODO: Traverse up for conditionals for if, else-if, and else

		// Handle bind
		element.dataset["bind"]?.split(/\s*,\s*/).forEach((binding) => {
			const [property, expr] = binding.split(":").map((s) => s.trim());
			if (!property || !expr) return;

			const exprResult = evaluateExpression(expr);
			const bindState = attrState.get("bind");
			if (!bindState) return;

			const newState = new State(() =>
				exprResult.fn({ ...props, [bindState.name!]: bindState.value })
			);
			newState?.effect(() => {
				if (property in element)
					(element as any)[property] = newState.value;
				else
					element.setAttribute(
						property,
						String(newState.value ?? "")
					);
			});
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
			const evaluator = evaluateExpression(ifExpr);
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
			const evaluator = evaluateExpression(eachExpr);
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
