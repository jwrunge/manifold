import { ElementFrom, ElementKeys } from "./_types.elements";
import { State } from "./reactivity";
import { type _RegEl, _registerElement } from "./registry";

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

// export const templ = (
// 	selector: string,
// 	func: (element?: _RegEl) => void
// ): Promise<_RegEl | undefined> =>
// 	new Promise((resolve) => {
// 		const register = () => {
// 			const element = document.querySelector(selector) as
// 				| HTMLElement
// 				| SVGElement
// 				| null;
// 			if (!element) return null;
// 			const regEl = _registerElement(element);
// 			State.prototype.effect(() => func(regEl));
// 			resolve(regEl);
// 		};

// 		if (document.readyState === "loading") {
// 			document.addEventListener("DOMContentLoaded", register);
// 		} else {
// 			register();
// 		}
// 	});

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

export const templEach = (selector: string, arr: () => unknown[]) => {
	const onEffect = (element: HTMLElement | SVGElement) => {
		const template = element.querySelector("template");
		if (!template) return;

		const [valName, keyName] = extractKeyValNames(
			element as HTMLElement | SVGElement
		);

		const it_over = Object.entries(arr());
		let current: Node | null | undefined;

		if (it_over.length === 0) {
			element.replaceChildren(template);
			return;
		}
		for (const [key, val] of it_over) {
			current = findCommentNode(current ?? template, `MF_EACH_${key}`);

			if (!current) {
				const clone = document.importNode(template.content, true);
				const regel = _registerElement(clone);
				regel.update({
					[keyName as string]: new State(key),
					[valName as string]: new State(val),
				});

				const comment = document.createComment(`MF_EACH_${key}`);
				element.appendChild(comment);
				element.appendChild(clone);
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

		State.prototype.effect(() => {
			onEffect(element);
		});
	};

	if (document.readyState === "loading") {
		document.addEventListener("DOMContentLoaded", register);
	} else {
		register();
	}
};
