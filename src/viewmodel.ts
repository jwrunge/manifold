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
	_type: T,
	selector: string,
	func: () => DeepPartial<ElementFrom<T>>
): void => {
	const register = () => {
		const element = document.querySelector(selector);
		const props = func();

		if (element)
			for (const key in props)
				(element as any)[key] = props[key as keyof typeof props];
	};

	if (document.readyState === "loading") {
		document.addEventListener("DOMContentLoaded", register);
	} else {
		register();
	}
};
