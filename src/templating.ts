import { ElementFrom, ElementKeys } from "./_types.elements";
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
		if (!template || element.tagName !== "MF-EACH") return;

		element.replaceChildren(template); // Clear existing children
		const [keyName, valName] = extractKeyValNames(element as HTMLElement);

		for (const [key, val] of Object.entries(fn())) {
			const clone = document.importNode(template.content, true);

			clone.textContent =
				clone.textContent?.replace(`{{${keyName}}}`, key) ?? "";
			clone.textContent =
				clone.textContent?.replace(`{{${valName}}}`, val as string) ??
				"";

			element.appendChild(clone);
		}

		console.log("KEYVAL NAMES", extractKeyValNames(element as HTMLElement));
	});
};
