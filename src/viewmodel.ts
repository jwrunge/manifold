type DeepPartial<T> = {
	[P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

type ElementKeys =
	| "element"
	| keyof HTMLElementTagNameMap
	| keyof SVGElementTagNameMap
	| keyof MathMLElementTagNameMap;

type ElementFrom<T extends ElementKeys> = T extends "element"
	? HTMLElement
	: T extends keyof HTMLElementTagNameMap
	? HTMLElementTagNameMap[T]
	: T extends keyof SVGElementTagNameMap
	? SVGElementTagNameMap[T]
	: T extends keyof MathMLElementTagNameMap
	? MathMLElementTagNameMap[T]
	: HTMLElement;

export const viewmodel = <T extends ElementKeys = "element">(
	type: T,
	selector: string,
	func: () => DeepPartial<ElementFrom<T>>
): void => {
	const element = document.querySelector(selector) as ElementFrom<T> | null;
	return;
};

const m = viewmodel("div", "#mydiv", () => ({
	class: "example-class",
	id: "example-id",
	dog: "YES",
	style: { color: "red", fontSize: "16px", cow: "YES" },
	textContent: "Hello, World!",
}));
