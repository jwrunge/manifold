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

export type DeepPartial<T> = {
	[K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K];
};

export type DeepPartialWithTypedListeners<T extends Element> = {
	[K in keyof T]?: K extends keyof EventMap
		? EventListenerWithTarget<EventMap[K], T>
		: T[K] extends object
		? DeepPartial<T[K]>
		: T[K];
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
	class?: string[];
};
