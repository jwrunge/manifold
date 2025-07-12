import { State } from "./reactivity";

class RegisteredElement {
	static registry: WeakMap<Element, RegisteredElement> = new WeakMap();
	classList: Set<string>;

	constructor(
		private element: HTMLElement | SVGElement,
		public show?: State<boolean>,
		public props: Map<string, State<unknown>> = new Map()
	) {
		this.classList = new Set(Array.from(element.classList));

		show?.effect(() => {
			if (!show.value) element.style.display = "none";
			else element.style.display = "";
		});

		// TODO: Check for registered parent elements to inherit props

		props.forEach((value, key) => {
			// Replace text content of each key with its value
		});

		RegisteredElement.registry.set(element, this);
	}
}
