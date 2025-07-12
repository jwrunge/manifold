import { State } from "./reactivity";

class RegEl {
	static registry: WeakMap<Element, RegEl> = new WeakMap();
	classList: Set<string>;
	private _deregister_show?: () => void;
	private _deregister_props = new Map<string, () => void>();

	constructor(public element: HTMLElement | SVGElement) {
		this.classList = new Set(Array.from(element.classList));
		RegEl.registry.set(element, this);
	}

	_update(
		props: Map<string, State<unknown>> = new Map(),
		show?: State<boolean>
	) {
		this._deregister_show?.();
		this._deregister_show = show?.effect(() => {
			if (!show.value) this.element.style.display = "none";
			else this.element.style.display = "";
		});

		// TODO: Check for registered parent elements to inherit props
		props.forEach((value, key) => {
			const dereg = this._deregister_props.get(key);
			dereg?.();

			this._deregister_props.set(
				key,
				value.effect(() => {
					// TODO: Effect to update the element's textContent or property
				})
			);
		});
	}
}

export type _RegEl = RegEl;

export const _registerElement = (element: HTMLElement | SVGElement) => {
	if (RegEl.registry.has(element)) {
		return RegEl.registry.get(element)!;
	}

	return new RegEl(element);
};
