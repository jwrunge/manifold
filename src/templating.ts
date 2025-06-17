import { ElementFrom, ElementKeys } from "./elementTypes";
import { State } from "./reactivity";

const extractKeyValNames = (element: HTMLElement): string[] => {
	return element.dataset?.["as"]?.split(/\s*,\s*/) ?? ["value", "key"];
};

export const templ = <T extends ElementKeys>(
	selector: string,
	func: (element: Element) => void
): Promise<ElementFrom<T> | null> =>
	new Promise((resolve) => {
		const register = () => {
			const element = document.querySelector(selector);
			if (!element) return resolve(null);
			State.prototype.effect(() => func(element));
			resolve(element as ElementFrom<T> | null);
		};

		if (document.readyState === "loading") {
			document.addEventListener("DOMContentLoaded", register);
		} else {
			register();
		}
	});

export const templEach = (selector: string, fn: () => unknown[]) => {
	return templ(selector, (element: Element) => {
		const template = element.querySelector("template");
		if (!template) return;

		element.replaceChildren(template); // Clear existing children
		const [keyName, valName] = extractKeyValNames(element as HTMLElement);

		console.log(fn, fn());
		for (const [key, val] of Object.entries(fn())) {
			const clone = template.content.cloneNode(true);
			clone.innerHTML = clone.innerHTML.replace(`{{${keyName}}}`, key);
			clone.innerHTML = clone.innerHTML.replace(`{{${valName}}}`, val);
			element.appendChild(clone);
		}

		if (element.tagName === "MF-EACH")
			console.log("MF-EACH element found", element);
		else console.log("BAD", element);

		console.log("KEYVAL NAMES", extractKeyValNames(element as HTMLElement));
	});
};
