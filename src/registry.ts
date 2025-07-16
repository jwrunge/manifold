import { State } from "./reactivity";

class RegEl {
	static registry: WeakMap<Element | DocumentFragment, RegEl> = new WeakMap();
	classList?: Set<string>;
	private _deregister_show?: () => void;
	private _originalTextContent: Map<Text, string> = new Map();

	constructor(public element: HTMLElement | SVGElement | DocumentFragment) {
		if (element instanceof Element) {
			this.classList = new Set();
			for (let i = 0; i < element.classList.length; i++) {
				this.classList.add(element.classList[i]!);
			}
		}
		RegEl.registry.set(element, this);

		// Store original text content
		this._storeOriginalTextContent();
	}

	private _storeOriginalTextContent() {
		const walker = document.createTreeWalker(
			this.element,
			4, // NodeFilter.SHOW_TEXT
			null
		);

		let node: Text | null;
		while ((node = walker.nextNode() as Text | null)) {
			if (node.textContent) {
				this._originalTextContent.set(node, node.textContent);
			}
		}
	}

	private _variables: Map<string, State<unknown> | unknown> = new Map();
	private _textNodeVariables: Map<Text, Set<string>> = new Map();

	update(props: Record<string, unknown> = {}, show?: State<boolean>) {
		this._deregister_show?.();
		const el = this.element;
		if (el instanceof HTMLElement || el instanceof SVGElement) {
			this._deregister_show = show?.effect(() => {
				el.style.display = show.value ? "" : "none";
			});
		}

		// Store all variables and create effects for State objects
		for (const key in props) {
			const value = props[key];
			this._variables.set(key, value);

			if (value instanceof State) {
				value.effect(() => this._updateTextForVariable(key));
			}
		}

		// Initial update and analyze which variables are used in which text nodes
		this._analyzeAndUpdateAllText();
	}

	private _analyzeAndUpdateAllText() {
		this._textNodeVariables.clear();

		this._originalTextContent.forEach((originalText, textNode) => {
			const variablesInThisNode = new Set<string>();
			let updatedText = originalText;

			// Replace all variables in the text and track which ones are used
			this._variables.forEach((value, key) => {
				const searchPattern = `\$\{${key}\}`;
				if (originalText.includes(searchPattern)) {
					variablesInThisNode.add(key);
					const actualValue =
						value instanceof State ? value.value : value;
					updatedText = updatedText.replaceAll(
						searchPattern,
						String(actualValue)
					);
				}
			});

			this._textNodeVariables.set(textNode, variablesInThisNode);
			textNode.textContent = updatedText;
		});
	}

	public _updateTextForVariable(changedVariable: string) {
		// Only update text nodes that actually use this variable
		this._originalTextContent.forEach((originalText, textNode) => {
			const variablesInThisNode = this._textNodeVariables.get(textNode);

			if (variablesInThisNode?.has(changedVariable)) {
				let updatedText = originalText;

				// Replace all variables in this text node
				this._variables.forEach((value, key) => {
					const actualValue =
						value instanceof State ? value.value : value;
					const searchPattern = `\$\{${key}\}`;
					updatedText = updatedText.replaceAll(
						searchPattern,
						String(actualValue)
					);
				});

				textNode.textContent = updatedText;
			}
		});
	}
}

export type _RegEl = RegEl;

export const _registerElement = (
	element: HTMLElement | SVGElement | DocumentFragment
) => RegEl.registry.get(element) ?? new RegEl(element);
