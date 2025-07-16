import { ElementFrom, ElementKeys } from "./_types.elements";
import { State } from "./reactivity";
import { RegEl } from "./registry";

const extractKeyValNames = (element: HTMLElement | SVGElement): string[] => {
	return element.dataset?.["as"]?.split(/\s*,\s*/) ?? ["value", "key"];
};

const findCommentNode = (
	element: Node,
	txt?: string | number
): Node | null | undefined => {
	if (!txt) return null;

	let current = element.nextSibling;
	while (current) {
		if (
			current.nodeType === Node.COMMENT_NODE &&
			current.textContent?.startsWith(`${txt}`)
		)
			return current;
		current = current.nextSibling;
	}
};

export const templ = <T extends ElementKeys>(
	selector: string,
	func: (element: HTMLElement | SVGElement) => void
): Promise<ElementFrom<T> | null> =>
	new Promise((resolve) => {
		const register = () => {
			const element = document.querySelector(selector) as
				| HTMLElement
				| SVGElement
				| null;
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

export const templEach = (selector: string, arr: State<Array<unknown>>) => {
	console.log("INIT VALUE", arr.value);

	const onEffect = (element: HTMLElement | SVGElement) => {
		const template = element.querySelector("template");
		if (!template) return;

		const [valName, keyName] = extractKeyValNames(
			element as HTMLElement | SVGElement
		);

		let current: Node | null | undefined;

		if (arr.value.length === 0) {
			element.replaceChildren(template);
			return;
		}
		for (const key in arr.value) {
			current = findCommentNode(current ?? template, `MF_EACH_${key}`);

			if (!current) {
				const clone = document.importNode(template.content, true);

				const comment = document.createComment(`MF_EACH_${key}`);
				element.appendChild(comment);

				// Remember how many children the element had before appending
				const childCountBefore = element.childNodes.length;

				// Append the clone - this moves its content to the DOM
				element.appendChild(clone);

				// Find the newly added DOM elements
				const newNodes = Array.from(element.childNodes).slice(
					childCountBefore
				);
				const targetElement = newNodes.find(
					(node) => node.nodeType === Node.ELEMENT_NODE
				) as HTMLElement;

				if (targetElement) {
					// Create RegEl with the actual DOM element, not the DocumentFragment
					new RegEl(targetElement, template, {
						[keyName as string]: new State(() => key),
						[valName as string]: new State(() => arr.value[key]),
					});
				}
			}
		}
		if (current) {
			const next = findCommentNode(current ?? template, "MF_EACH_");
			while ((next as ChildNode | null)?.nextSibling) {
				next!.nextSibling!.remove();
			}

			(next as HTMLElement | SVGElement | null)?.remove();
		}
	};

	const register = () => {
		const element = document.querySelector(selector) as
			| HTMLElement
			| SVGElement
			| null;
		if (element?.tagName !== "MF-EACH") return;

		arr.effect(() => {
			console.log("EFFECT RUN", arr.value);
			onEffect(element);
		});
	};

	if (document.readyState === "loading") {
		document.addEventListener("DOMContentLoaded", register);
	} else {
		register();
	}
};

export const templIf = (_selector: string) => {};
