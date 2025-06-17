import {
	DeepPartialWithTypedListeners,
	ElementFrom,
	ElementKeys,
} from "./elementTypes";
import { State } from "./reactivity";

const applyProperty = (
	element: ElementFrom<ElementKeys>,
	key: keyof ElementFrom<ElementKeys>,
	value: unknown
) => {
	if (key === "style") Object.assign(element.style, value);
	else if (key === "class") {
		const classMap = State.elementClassList.get(element) || new Set();
		for (const className of value as string[]) {
			if (!classMap.has(className)) {
				element.classList.add(className);
				classMap.add(className);
			}
		}
		for (const className of classMap) {
			if (!(value as string[]).includes(className)) {
				element.classList.remove(className);
				classMap.delete(className);
			}
		}
		State.elementClassList.set(element, classMap);
	} else if (key in element) {
		(element as any)[key] = value;
	} else {
		element.setAttribute(key, String(value));
	}
};

export const viewmodel = <T extends ElementKeys = "element">(
	_type: T,
	selector: string,
	func: () => DeepPartialWithTypedListeners<ElementFrom<T>>
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
