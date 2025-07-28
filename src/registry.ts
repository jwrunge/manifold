import { evaluateExpression, STATE_RE } from "./expression-parser";
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
] as const;

export interface ParsedElement {
	show?: State<unknown>; // Condition based on data-if or data-else-if
	each?: State<Array<unknown>>; // Loop State based on data-each
	props: Record<string, State<unknown>>; // Any bound properties (assigned with data-bind or data-scope) - a .effect() should be set on any State bound to a property with data-bind BEFORE adding to this Record that updates the bound property
	else?: boolean; // Whether or not this element has a data-else attribute
}

export class RegEl {
	static registry: WeakMap<Element | DocumentFragment, RegEl> = new WeakMap();
	static expressions: Map<
		string,
		(vars: Record<string, unknown>) => unknown
	> = new Map();
	static stateExpression: Map<State<unknown>, string> = new Map();

	private _regexCache: Map<string, RegExp> = new Map();
	private cachedContent: Node | null = null;

	static register(element: HTMLElement | SVGElement | MathMLElement) {
		const props: Record<string, State<unknown>> = {};
		const attrState = new Map<string, State<unknown>>();

		for (const attr of MANIFOLD_ATTRIBUTES) {
			const attrStr =
				element.dataset[
					attr.replace(/-([a-z])/g, (_, letter) =>
						letter.toUpperCase()
					)
				];

			// Get State variables
			for (const ref of Array.from(
				(attrStr ?? "").matchAll(STATE_RE),
				(match) => match[1]!
			)) {
				const refName = ref.split(".")[0] ?? "";
				const S = State.get<unknown>(refName);
				if (S) {
					props[refName] = S;
					attrState.set(attr, S);
				}
			}
		}

		// Traverse ancestors to find inherited props
		let parent = element.parentElement;
		while (parent) {
			const regPar = RegEl.registry.get(parent);
			if (regPar)
				for (const [key, state] of Object.entries(regPar.props))
					props[key] ??= state;
			parent = parent.parentElement;
		}

		// Handy re-register function
		element.mfRegister = () => RegEl.register(element);

		// Handle conditionals
		// TODO: Traverse up for conditionals for if, else-if, and else

		// Handle bind
		element.dataset["bind"]?.split(/\s*,\s*/).forEach((binding) => {
			const [property, expr] = binding.split(":").map((s) => s.trim());
			if (!property || !expr) return;

			const fn = evaluateExpression(expr);
			const bindState = attrState.get("bind");
			if (!bindState) return;

			const newState = new State(() =>
				fn({ ...props, [bindState.name]: bindState.value })
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
				return evaluator(context);
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
				return evaluator(context);
			}) as State<Array<unknown>>;
		}

		return new RegEl(element, props, showState, eachState);
	}

	constructor(
		private element:
			| HTMLElement
			| SVGElement
			| MathMLElement
			| DocumentFragment,
		public props: Record<string, State<unknown>> = {},
		private show?: State<unknown> | undefined,
		private each?: State<Array<unknown>> | undefined
	) {
		this.cachedContent = element.cloneNode(true);

		this.show?.effect(() => {
			(this.element as HTMLElement | SVGElement).style.display = this
				.show!.value
				? ""
				: "none";
		});

		// Trigger initial show effect by accessing the value
		if (this.show) {
			this.show.value;
		}

		this.each?.effect(() => {
			// For each functionality, we need the original content as template
			if (!this.cachedContent) {
				return;
			}

			// Clear existing content
			element.replaceChildren();

			if (this.each!.value.length === 0) {
				return;
			}

			// Iterate through array items
			this.each!.value.forEach((item, index) => {
				const clone = this.cachedContent!.cloneNode(
					true
				) as DocumentFragment;

				// Replace iteration variables directly in the clone
				this.replaceIterationVariables(clone, String(index), item);

				const comment = document.createComment(`MF_EACH_${index}`);
				element.appendChild(comment);

				// Append the fragment (this will move all child nodes from fragment to element)
				element.appendChild(clone);
			});
		});

		// Trigger initial render by accessing the value
		if (this.each) {
			this.each.value;
		}

		RegEl.registry.set(element, this);
	}

	private getRegex(key: string): RegExp {
		let pattern = this._regexCache.get(key);
		if (!pattern) {
			pattern = new RegExp(`\\$\\{${key}\\}`, "g");
			this._regexCache.set(key, pattern);
		}
		return pattern;
	}

	private replaceVariableInTemplate(node: Node, key: string, value: unknown) {
		if (node.nodeType === Node.TEXT_NODE && node.textContent) {
			node.textContent = node.textContent.replace(
				this.getRegex(key),
				String(value ?? "")
			);
		} else if (node.nodeType === Node.ELEMENT_NODE) {
			const element = node as Element;
			for (let i = 0; i < element.attributes.length; i++) {
				const attr = element.attributes[i]!;
				attr.value = attr.value.replace(
					this.getRegex(key),
					String(value ?? "")
				);
			}
		}

		for (const child of Array.from(node.childNodes)) {
			this.replaceVariableInTemplate(child, key, value);
		}
	}

	private replaceVariableInContent(content: DocumentFragment) {
		for (const child of Array.from(content.childNodes)) {
			this.replaceVariableInNode(child);
		}
	}

	private replaceVariableInNode(node: Node) {
		if (node.nodeType === Node.TEXT_NODE && node.textContent) {
			// Replace all possible variable patterns
			node.textContent = this.replaceAllVariables(node.textContent);
		} else if (node.nodeType === Node.ELEMENT_NODE) {
			const element = node as Element;
			for (let i = 0; i < element.attributes.length; i++) {
				const attr = element.attributes[i]!;
				attr.value = this.replaceAllVariables(attr.value);
			}
		}

		for (const child of Array.from(node.childNodes)) {
			this.replaceVariableInNode(child);
		}
	}

	private replaceAllVariables(text: string): string {
		// Find all ${...} patterns and replace them
		return text.replace(/\$\{([^}]+)\}/g, (_, varPath) => {
			const value = this.getVariableValue(varPath);
			return String(value ?? "");
		});
	}

	private getVariableValue(varPath: string): unknown {
		// Handle nested property access (e.g., "user.name")
		const parts = varPath.split(".");
		const rootKey = parts[0];

		if (!rootKey) return undefined;

		// Get the root state object
		const rootState = this.props.get(rootKey);
		if (!rootState) return undefined;

		let current = rootState instanceof State ? rootState.value : rootState;

		// Navigate through nested properties
		for (let i = 1; i < parts.length; i++) {
			const part = parts[i];
			if (current && typeof current === "object" && part) {
				current = (current as any)[part];
			} else {
				return undefined;
			}
		}

		return current;
	}

	private replaceIterationVariables(
		content: DocumentFragment,
		key: string,
		value: unknown
	) {
		// Temporarily add iteration variables to our variables map
		this.props.set("key", key);
		this.props.set("value", value);

		// Replace variables in content
		this.replaceVariableInContent(content);

		// Clean up temporary variables
		this.props.delete("key");
		this.props.delete("value");
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
