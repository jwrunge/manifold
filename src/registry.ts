import { State } from "./State";

export class RegEl {
	static registry: WeakMap<Element | DocumentFragment, RegEl> = new WeakMap();
	private _variables: Map<string, State<unknown> | unknown> = new Map();
	private _regexCache: Map<string, RegExp> = new Map();

	static register(
		element: HTMLElement | SVGElement | MathMLElement | DocumentFragment,
		ops?: {
			props?: Record<string, State<unknown>>;
			else?: boolean;
			show?: State<unknown>;
			each?: State<Array<unknown>>;
			templateContent?: DocumentFragment;
		}
	) {
		const regel = RegEl.registry.get(element);

		let show = ops?.show;

		if (regel) {
			regel.show ??= show;
			if (ops?.each) regel.each = ops.each;
			regel.addProps(ops?.props ?? {});
			return regel;
		}

		try {
			const newRegEl = new RegEl(
				element,
				ops?.props,
				show,
				ops?.each,
				ops?.templateContent,
				ops?.else
			);

			return newRegEl;
		} finally {
			const el = (element as HTMLElement).nextElementSibling;
			if ((el as HTMLElement)?.dataset["else"]) {
				RegEl.register(el as HTMLElement, {
					else: true,
				});
			}
		}
	}

	constructor(
		private element:
			| HTMLElement
			| SVGElement
			| MathMLElement
			| DocumentFragment,
		props: Record<string, State<unknown>> = {},
		private show?: State<unknown> | undefined,
		private each?: State<Array<unknown>> | undefined,
		private cachedTemplateContent?: DocumentFragment | null,
		private isElse?: boolean
	) {
		// For direct elements (no template), cache the element's content for data-each only
		if (!this.cachedTemplateContent && this.each) {
			this.cachedTemplateContent = document.createDocumentFragment();
			// Clone all child nodes to preserve the original content
			Array.from(element.childNodes).forEach((child) => {
				this.cachedTemplateContent!.appendChild(child.cloneNode(true));
			});
		}

		// Handle data-else elements by creating a computed show state
		if (this.isElse && !this.show) {
			// Set a placeholder state that will be replaced
			this.show = new State(false);
		}

		this.show?.effect(() => {
			(this.element as HTMLElement | SVGElement).style.display = this
				.show!.value
				? ""
				: "none";
		});

		this.addProps(props);

		// Trigger initial show effect by accessing the value
		if (this.show) {
			this.show.value;
		}

		this.each?.effect(() => {
			// For each functionality, we need the original content as template
			if (!this.cachedTemplateContent) {
				return;
			}

			// Clear existing content
			element.replaceChildren();

			if (this.each!.value.length === 0) {
				return;
			}

			// Iterate through array items
			this.each!.value.forEach((item, index) => {
				const clone = this.cachedTemplateContent!.cloneNode(
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

	addProps(props: Record<string, State<unknown> | undefined>) {
		for (const key in props) {
			this._variables.set(key, props[key]);
			// Only set up general interpolation effects for non-data-each elements
			if (!this.each) {
				const effect = () => this.updateTemplateContent();
				props[key]?.effect(effect);
				effect();
			}
		}
	}

	private updateTemplateContent() {
		// This method is only called for general interpolation (non-data-each elements)
		// Update the existing DOM element in place
		for (const [key, stateOrValue] of this._variables) {
			const value =
				stateOrValue instanceof State
					? stateOrValue.value
					: stateOrValue;
			this.replaceVariableInTemplate(this.element as Node, key, value);
		}
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
		const rootState = this._variables.get(rootKey);
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
		this._variables.set("key", key);
		this._variables.set("value", value);

		// Replace variables in content
		this.replaceVariableInContent(content);

		// Clean up temporary variables
		this._variables.delete("key");
		this._variables.delete("value");
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
