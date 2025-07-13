import { State } from "./reactivity";

class RegEl {
	static registry: WeakMap<Element | DocumentFragment, RegEl> = new WeakMap();
	classList?: Set<string>;
	private _deregister_show?: () => void;

	constructor(public element: HTMLElement | SVGElement | DocumentFragment) {
		if (element instanceof Element)
			this.classList = new Set(Array.from(element.classList));
		RegEl.registry.set(element, this);
	}

	update(props: Record<string, unknown> = {}, show?: State<boolean>) {
		this._deregister_show?.();
		if (
			this.element instanceof HTMLElement ||
			this.element instanceof SVGElement
		) {
			this._deregister_show = show?.effect(() => {
				if (!show.value)
					(this.element as HTMLElement | SVGElement).style.display =
						"none";
				else
					(this.element as HTMLElement | SVGElement).style.display =
						"";
			});
		}

		// TODO: Check for registered parent elements to inherit props
		for (const [key, value] of Object.entries(props)) {
			this.replaceTextInElement(this.element, `\$\{${key}\}`, `${value}`);
		}
	}

	private replaceTextInElement(
		element: Element | DocumentFragment,
		search: string,
		replace: string
	) {
		const walker = document.createTreeWalker(
			element,
			NodeFilter.SHOW_TEXT,
			null
		);

		const textNodes: Text[] = [];
		let node: Text | null;

		// Collect all text nodes first to avoid modifying while iterating
		while ((node = walker.nextNode() as Text | null)) {
			if (node.textContent?.includes(search)) {
				textNodes.push(node);
			}
		}

		// Replace text content in collected text nodes
		textNodes.forEach((textNode) => {
			if (textNode.textContent) {
				textNode.textContent = textNode.textContent.replaceAll(
					search,
					replace
				);
			}
		});
	}
}

export type _RegEl = RegEl;

export const _registerElement = (
	element: HTMLElement | SVGElement | DocumentFragment
) => {
	if (RegEl.registry.has(element)) {
		return RegEl.registry.get(element)!;
	}

	return new RegEl(element);
};
