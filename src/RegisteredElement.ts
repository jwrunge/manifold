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

		if (regel) {
			regel.show ??= ops?.show;
			if (ops?.each) regel.each = ops.each;
			regel.addProps(ops?.props ?? {});
			return regel;
		}
		return new RegEl(
			element,
			ops?.props,
			ops?.show,
			ops?.each,
			ops?.templateContent
		);
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
		private cachedTemplateContent?: DocumentFragment | null
	) {
		this.cachedTemplateContent ??=
			element.firstChild instanceof HTMLTemplateElement
				? ((
						element.firstChild as HTMLTemplateElement
				  ).content.cloneNode(true) as DocumentFragment)
				: null;

		this.show?.effect(() => {
			(this.element as HTMLElement | SVGElement).style.display = this
				.show!.value
				? ""
				: "none";
		});

		this.addProps(props);

		this.each?.effect(() => {
			const template = element.querySelector("template");
			if (!template) return;

			if (!this.cachedTemplateContent) {
				this.cachedTemplateContent = template.content.cloneNode(
					true
				) as DocumentFragment;
			}

			const [valName, keyName] = extractKeyValNames(
				element as HTMLElement | SVGElement
			);
			let current: Node | null | undefined;

			if (this.each!.value.length === 0) {
				element.replaceChildren(template);
				return;
			}

			for (const key in this.each!.value) {
				current = findCommentNode(
					current ?? template,
					`MF_EACH_${key}`
				);

				if (!current) {
					const clone = document.importNode(template.content, true);
					const comment = document.createComment(`MF_EACH_${key}`);
					element.appendChild(comment);

					const childCountBefore = element.childNodes.length;
					element.appendChild(clone);

					const targetElement = Array.from(element.childNodes)
						.slice(childCountBefore)
						.find(
							(node) => node.nodeType === Node.ELEMENT_NODE
						) as HTMLElement;

					if (targetElement) {
						const props: Record<string, State<unknown>> = {};
						props[keyName!] = new State(() => key);
						props[valName!] = new State(
							() => this.each!.value[key]
						);

						// Pass the template content directly to RegEl.register
						RegEl.register(targetElement, {
							templateContent:
								this.cachedTemplateContent!.cloneNode(
									true
								) as DocumentFragment,
							props,
						});
					}
				}
			}

			if (current) {
				const next = findCommentNode(current ?? template, "MF_EACH_");
				while (next?.nextSibling) {
					next.nextSibling.remove();
				}
				(next as ChildNode)?.remove();
			}
		});

		RegEl.registry.set(element, this);
	}

	addProps(props: Record<string, State<unknown> | undefined>) {
		for (const key in props) {
			this._variables.set(key, props[key]);
			const effect = () => this.updateTemplateContent();
			props[key]?.effect(effect);
			effect();
		}
	}

	private updateTemplateContent() {
		// If we have cached template content, use it (for templates with ${} placeholders)
		if (this.cachedTemplateContent) {
			// Clone the template so we don't mutate the original
			const templateClone = this.cachedTemplateContent.cloneNode(
				true
			) as DocumentFragment;

			for (const [key, stateOrValue] of this._variables) {
				const value =
					stateOrValue instanceof State
						? stateOrValue.value
						: stateOrValue;
				this.replaceVariableInTemplate(templateClone, key, value);
			}

			this.element.replaceChildren(
				...Array.from(templateClone.childNodes)
			);
		} else {
			// If no template content, update the existing DOM element in place
			for (const [key, stateOrValue] of this._variables) {
				const value =
					stateOrValue instanceof State
						? stateOrValue.value
						: stateOrValue;
				this.replaceVariableInTemplate(
					this.element as Node,
					key,
					value
				);
			}
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
}

const findCommentNode = (
	element: Node,
	txt?: string | number
): Node | null | undefined => {
	if (!txt) return null;

	let current = element.nextSibling;
	while (current) {
		if (
			current.nodeType === Node.COMMENT_NODE &&
			current.textContent?.startsWith(`${txt}`)
		)
			return current;
		current = current.nextSibling;
	}
};

const extractKeyValNames = (element: HTMLElement | SVGElement): string[] => {
	return element.dataset?.["mfAs"]?.split(/\s*,\s*/) ?? ["value", "key"];
};
