import { State } from "./reactivity";

export class RegEl {
	static registry: WeakMap<Element | DocumentFragment, RegEl> = new WeakMap();
	classList?: Set<string>;
	show?: State<boolean>;
	private _variables: Map<string, State<unknown> | unknown> = new Map();

	constructor(
		public element: HTMLElement | SVGElement | DocumentFragment,
		private template: HTMLTemplateElement,
		props: Record<string, State<unknown>>,
		show?: () => boolean
	) {
		console.log("PROPS", props);

		if (element instanceof Element) {
			this.classList = new Set();
			for (let i = 0; i < element.classList.length; i++) {
				this.classList.add(element.classList[i]!);
			}
		}

		const el = this.element;
		if (el instanceof HTMLElement || el instanceof SVGElement) {
			this.show = show ? new State(show) : undefined;
			this.show?.effect(() => {
				el.style.display = this.show?.value ? "" : "none";
			});
		}

		for (const key in props) {
			this._variables.set(key, props[key]);
			const effect = () => {
				console.log("Variable changed", key, props[key]!.value);
				const value = props[key]!.value;
				this.updateTemplateContent(key, value);
			};
			props[key]?.effect(effect);
			effect();
		}

		RegEl.registry.set(element, this);
	}

	private updateTemplateContent(targetKey: string, targetValue: unknown) {
		console.log(
			"updateTemplateContent called with:",
			targetKey,
			targetValue
		);

		// Always refresh from template to ensure placeholders are available
		const templateContent = this.template.content.cloneNode(
			true
		) as DocumentFragment;

		// Replace all variables in the fresh template content
		for (const [key, stateOrValue] of this._variables) {
			const value =
				stateOrValue instanceof State
					? stateOrValue.value
					: stateOrValue;
			this.replaceVariableInTemplate(templateContent, key, value);
		}

		// Replace the element's content with the processed template
		if (this.element instanceof DocumentFragment) {
			// Clear and replace DocumentFragment content
			while (this.element.firstChild) {
				this.element.removeChild(this.element.firstChild);
			}
			this.element.appendChild(templateContent);
		} else {
			// Replace element content
			this.element.innerHTML = "";
			this.element.appendChild(templateContent);
		}

		console.log("Element updated, new content:", this.element.textContent);
	}

	private replaceVariableInTemplate(node: Node, key: string, value: unknown) {
		if (node.nodeType === Node.TEXT_NODE) {
			// Handle text nodes - replace ${key} patterns
			if (node.textContent) {
				const pattern = new RegExp(`\\$\\{${key}\\}`, "g");
				const originalText = node.textContent;
				const newText = originalText.replace(
					pattern,
					String(value ?? "")
				);
				node.textContent = newText;
				if (originalText !== newText) {
					console.log(`  Replaced "${originalText}" -> "${newText}"`);
				}
			}
		} else if (node.nodeType === Node.ELEMENT_NODE) {
			const element = node as Element;

			// Process attributes - replace ${key} patterns in attribute values
			for (let i = 0; i < element.attributes.length; i++) {
				const attr = element.attributes[i]!;
				const pattern = new RegExp(`\\$\\{${key}\\}`, "g");
				const originalValue = attr.value;
				const newValue = originalValue.replace(
					pattern,
					String(value ?? "")
				);
				if (originalValue !== newValue) {
					console.log(
						`  Attribute ${attr.name}: "${originalValue}" -> "${newValue}"`
					);
					attr.value = newValue;
				}
			}
		}

		// Recursively process child nodes
		for (const child of Array.from(node.childNodes)) {
			this.replaceVariableInTemplate(child, key, value);
		}
	}
}
