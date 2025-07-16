import { State } from "./reactivity";

export class RegEl {
	static registry: WeakMap<Element | DocumentFragment, RegEl> = new WeakMap();
	private _variables: Map<string, State<unknown> | unknown> = new Map();
	private _regexCache: Map<string, RegExp> = new Map();

	constructor(
		public element: HTMLElement | SVGElement | DocumentFragment,
		private templateContent: DocumentFragment,
		props: Record<string, State<unknown>>,
		show?: () => boolean
	) {
		const el = this.element;
		if (show && (el instanceof HTMLElement || el instanceof SVGElement)) {
			const showState = new State(show);
			showState.effect(() => {
				el.style.display = showState.value ? "" : "none";
			});
		}

		for (const key in props) {
			this._variables.set(key, props[key]);
			const effect = () => this.updateTemplateContent();
			props[key]?.effect(effect);
			effect();
		}

		RegEl.registry.set(element, this);
	}

	private updateTemplateContent() {
		const templateContent = this.templateContent.cloneNode(
			true
		) as DocumentFragment;

		for (const [key, stateOrValue] of this._variables) {
			const value =
				stateOrValue instanceof State
					? stateOrValue.value
					: stateOrValue;
			this.replaceVariableInTemplate(templateContent, key, value);
		}

		this.element.replaceChildren(...Array.from(templateContent.childNodes));
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
}
