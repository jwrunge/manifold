// Helper type to extract the event type from GlobalEventHandlers
type ExtractEventType<T> = T extends ((this: any, ev: infer E) => any) | null
	? E extends Event
		? E
		: Event
	: Event;

type EventListenerWithTarget<
	TEvent extends Event,
	TElement extends EventTarget
> = (event: TEvent & { currentTarget: TElement }) => void;

export type DeepPartial<T> = {
	[K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K];
};

// Utility type to get settable properties of an element (excluding readonly properties)
type SettableElementProperties<T extends Element> = {
	[K in keyof T]?: K extends keyof GlobalEventHandlers
		? EventListenerWithTarget<ExtractEventType<GlobalEventHandlers[K]>, T>
		: T[K] extends object
		? DeepPartial<T[K]>
		: T[K];
};

export type DeepPartialWithTypedListeners<T extends Element> =
	SettableElementProperties<T> & {
		// Custom properties that don't exist on DOM elements but are handled by the framework
		class?: string[];
	};

export type ElementKeys =
	| "element"
	| keyof HTMLElementTagNameMap
	| keyof SVGElementTagNameMap
	| keyof MathMLElementTagNameMap;

export type ElementFrom<T extends ElementKeys> = T extends "element"
	? HTMLElement
	: T extends keyof HTMLElementTagNameMap
	? HTMLElementTagNameMap[T]
	: T extends keyof SVGElementTagNameMap
	? SVGElementTagNameMap[T]
	: T extends keyof MathMLElementTagNameMap
	? MathMLElementTagNameMap[T]
	: HTMLElement;
