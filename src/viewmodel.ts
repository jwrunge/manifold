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

const recursiveAssign = <T>(obj: T, key: keyof T, value: unknown) => {
	if (typeof obj === "object" && obj !== null && key in obj) {
		if (typeof obj[key] === "object" && obj[key] !== null) {
			recursiveAssign(obj[key] as T, key, value);
		} else {
			(obj as any)[key] = value as T[keyof T];
		}
	} else {
		obj[key] = value as T[keyof T];
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
			const props = func();

			if (element)
				for (const key in props) {
					const value = props[key as keyof typeof props];

					if (key.startsWith("on"))
						(element as any)[key] = value as EventListener;
					else
						recursiveAssign(
							element as ElementFrom<T>,
							key as keyof ElementFrom<T>,
							value
						);
				}

			resolve(element as ElementFrom<T> | null);
		};

		if (document.readyState === "loading") {
			document.addEventListener("DOMContentLoaded", register);
		} else {
			register();
		}
	});
};
