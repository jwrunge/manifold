import {
	DeepPartialWithTypedListeners,
	ElementFrom,
	ElementKeys,
} from "./_types.elements";
import { templ } from "./templating";

const applyProperty = (
	element: ElementFrom<ElementKeys>,
	key: keyof ElementFrom<ElementKeys>,
	value: unknown
) => {
	if (key === "style") Object.assign(element.style, value);
	else if (key === "class") {
		const classMap = new Set(
			element.dataset["mf_classes"]?.split(" ") ?? []
		);
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
		element.dataset["mf_classes"] = [...classMap].join(" ");
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
): Promise<ElementFrom<T> | null> =>
	templ(selector, (element: Element) => {
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
