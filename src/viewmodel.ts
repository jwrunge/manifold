import { State } from "./reactivity";

type EventMap = {
	// Mouse Events
	onclick: MouseEvent;
	ondblclick: MouseEvent;
	onmousedown: MouseEvent;
	onmouseup: MouseEvent;
	onmouseover: MouseEvent;
	onmousemove: MouseEvent;
	onmouseout: MouseEvent;
	onmouseenter: MouseEvent;
	onmouseleave: MouseEvent;
	// Keyboard Events
	onkeydown: KeyboardEvent;
	onkeyup: KeyboardEvent;
	onkeypress: KeyboardEvent;
	// Form Events
	onchange: Event;
	oninput: Event;
	onsubmit: SubmitEvent;
	onfocus: FocusEvent;
	onblur: FocusEvent;
	// Drag Events
	ondrag: DragEvent;
	ondragend: DragEvent;
	ondragenter: DragEvent;
	ondragleave: DragEvent;
	ondragover: DragEvent;
	ondragstart: DragEvent;
	ondrop: DragEvent;
	// Touch Events
	ontouchstart: TouchEvent;
	ontouchmove: TouchEvent;
	ontouchend: TouchEvent;
	ontouchcancel: TouchEvent;
	// Other Common Events
	onscroll: Event;
	onload: Event;
	onerror: ErrorEvent;
};

type EventListenerWithTarget<
	TEvent extends Event,
	TElement extends EventTarget
> = (event: TEvent & { target: TElement }) => void;

type WithTypedListeners<T extends HTMLElement | SVGElement | MathMLElement> = {
	[K in keyof T]?: K extends keyof EventMap
		? EventListenerWithTarget<EventMap[K], T>
		: T[K];
};

export type DeepPartial<T> = {
	[P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type ElementKeys =
	| "element"
	| keyof HTMLElementTagNameMap
	| keyof SVGElementTagNameMap
	| keyof MathMLElementTagNameMap;

export type ElementFrom<T extends ElementKeys> = (T extends "element"
	? HTMLElement
	: T extends keyof HTMLElementTagNameMap
	? HTMLElementTagNameMap[T]
	: T extends keyof SVGElementTagNameMap
	? SVGElementTagNameMap[T]
	: T extends keyof MathMLElementTagNameMap
	? MathMLElementTagNameMap[T]
	: HTMLElement) & {
	class?: Record<string, string>;
};

const applyProperty = (
	element: ElementFrom<ElementKeys>,
	key: keyof ElementFrom<ElementKeys>,
	value: unknown
) => {
	if (typeof value === "object" && value !== null) {
		if (key === "style") Object.assign(element.style, value);
		else if (key === "class") {
			for (const className in value) {
				if ((value as any)[className]) {
					element.classList.add(className);
				} else {
					element.classList.remove(className); // For falsey values
				}
			}
		}
	} else if (key in element || element.hasAttribute(key)) {
		(element as any)[key] = value;
	} else {
		element.setAttribute(key, String(value));
	}
};

export const viewmodel = <T extends ElementKeys = "element">(
	_type: T,
	selector: string,
	func: () => DeepPartial<ElementFrom<T>>
): Promise<ElementFrom<T> | null> => {
	return new Promise((resolve) => {
		const register = () => {
			const element = document.querySelector(selector);

			if (!element) {
				console.warn(
					`viewmodel: Element with selector "${selector}" not found.`
				);
				resolve(null);
				return;
			}

			State.prototype.effect(() => {
				const props = func();

				for (const key in props) {
					const value = props[key as keyof typeof props];

					if (key.startsWith("on")) {
						(element as any)[key] = value as EventListener;
					} else {
						applyProperty(
							element as ElementFrom<T>,
							key as keyof Element,
							value
						);
					}
				}
			});

			resolve(element as ElementFrom<T> | null);
		};

		if (document.readyState === "loading") {
			document.addEventListener("DOMContentLoaded", register);
		} else {
			register();
		}
	});
};
