import { State } from "./reactivity";

export class RegEl {
	static registry: WeakMap<Element | DocumentFragment, RegEl> = new WeakMap();
	classList?: Set<string>;
	show?: State<boolean>;
	private _originalTextContent: Map<Text, string> = new Map();
	private _variables: Map<string, State<unknown> | unknown> = new Map();
	private _textNodeVariables: Map<Text, Set<string>> = new Map();

	constructor(
		public element: HTMLElement | SVGElement | DocumentFragment,
		props: Record<string, () => unknown>,
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
			const value = new State(props[key]);
			this._variables.set(key, value);
			value.effect(() => {
				console.log("Variable changed", key, value.value);
				this._originalTextContent.forEach((originalText, textNode) => {
					const variablesInThisNode =
						this._textNodeVariables.get(textNode);

					if (variablesInThisNode?.has(key)) {
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
			});

			// Initial update and analyze which variables are used in which text nodes
			this._analyzeAndUpdateAllText();

			RegEl.registry.set(element, this);

			// Store original text content
			this._storeOriginalTextContent();
		}
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
}
