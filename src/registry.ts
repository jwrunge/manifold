import { State } from "./reactivity";

class RegEl {
	static registry: WeakMap<Element | DocumentFragment, RegEl> = new WeakMap();
	classList?: Set<string>;
	private _deregister_show?: () => void;
	private _deregister_props = new Map<string, () => void>();

	constructor(public element: HTMLElement | SVGElement | DocumentFragment) {
		if (element instanceof Element)
			this.classList = new Set(Array.from(element.classList));
		RegEl.registry.set(element, this);
	}

	update(props: Record<string, State<unknown>> = {}, show?: State<boolean>) {
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
			const dereg = this._deregister_props.get(key);
			dereg?.();

			this._deregister_props.set(
				key,
				value.effect(() => {
					this.element.textContent =
						this.element.textContent?.replaceAll(
							`\$\{${key}\}`,
							`${value.value}`
						) ?? "";
				})
			);
		}
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
