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

export const viewmodel = <T extends ElementKeys = "element">(
	type: T,
	selector: string,
	func: () => DeepPartial<ElementFrom<T>>
): void => {
	const element = document.querySelector(selector);
	console.log(type, element, func);
	return;
};
