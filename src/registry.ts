import { State } from "./reactivity";

class RegEl {
	static registry: WeakMap<Element | DocumentFragment, RegEl> = new WeakMap();
	classList?: Set<string>;
	private _deregister_show?: () => void;

	constructor(public element: HTMLElement | SVGElement | DocumentFragment) {
		if (element instanceof Element) {
			this.classList = new Set();
			for (let i = 0; i < element.classList.length; i++) {
				this.classList.add(element.classList[i]!);
			}
		}
		RegEl.registry.set(element, this);
	}

	update(props: Record<string, unknown> = {}, show?: State<boolean>) {
		this._deregister_show?.();
		const el = this.element;
		if (el instanceof HTMLElement || el instanceof SVGElement) {
			this._deregister_show = show?.effect(() => {
				el.style.display = show.value ? "" : "none";
			});
		}

		// TODO: Check for registered parent elements to inherit props
		for (const key in props) {
			this.replaceTextInElement(el, `\$\{${key}\}`, String(props[key]));
		}
	}

	private replaceTextInElement(
		element: Element | DocumentFragment,
		search: string,
		replace: string
	) {
		const walker = document.createTreeWalker(
			element,
			4, // NodeFilter.SHOW_TEXT
			null
		);

		let node: Text | null;
		while ((node = walker.nextNode() as Text | null)) {
			const content = node.textContent;
			if (content?.includes(search)) {
				node.textContent = content.replaceAll(search, replace);
			}
		}
	}
}

export type _RegEl = RegEl;

export const _registerElement = (
	element: HTMLElement | SVGElement | DocumentFragment
) => RegEl.registry.get(element) ?? new RegEl(element);
