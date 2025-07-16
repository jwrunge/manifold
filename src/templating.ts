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

export const templEach = (
	selector: string,
	arr: (() => State<unknown[]>) | (() => unknown[])
) => {
	const register = () => {
		const element = document.querySelector(selector) as
			| HTMLElement
			| SVGElement
			| null;
		if (element?.tagName !== "MF-EACH") return;

		const template = element.querySelector("template");
		if (!template) return;

		const [valName, keyName] = extractKeyValNames(
			element as HTMLElement | SVGElement
		);

		// Create a derived state for the array to ensure consistent reactivity
		const arrayState = new State(() => {
			const arrResult = arr();
			const result =
				arrResult instanceof State ? arrResult.value : arrResult;
			return result;
		});

		// Store created elements to avoid recreating them
		const createdElements = new Map<
			string,
			{
				comment: Comment;
				wrapper: HTMLElement;
				regel: _RegEl;
				cleanup?: () => void;
			}
		>();

		// Main effect that handles array structure changes
		arrayState.effect(() => {
			const it_over = arrayState.value;

			// Check if it_over is null, undefined, or not an object/array
			if (
				!it_over ||
				(typeof it_over !== "object" && !Array.isArray(it_over))
			) {
				// Clear all created elements
				createdElements.forEach((elementData) => {
					if (elementData.cleanup) {
						elementData.cleanup();
					}
					// Remove DOM elements
					elementData.wrapper.remove();
				});
				createdElements.clear();
				element.replaceChildren(template);
				return;
			}

			const currentKeys = Object.keys(it_over);
			const existingKeys = Array.from(createdElements.keys());

			// Remove elements that no longer exist in the array
			existingKeys.forEach((key) => {
				if (!currentKeys.includes(key)) {
					const elementData = createdElements.get(key);
					if (elementData) {
						// Clean up reactive effects first
						if (elementData.cleanup) {
							elementData.cleanup();
						}
						// Remove the wrapper
						elementData.wrapper.remove();
						createdElements.delete(key);
					}
				}
			});

			// Add new elements
			currentKeys.forEach((key) => {
				if (!createdElements.has(key)) {
					// Create new element
					const clone = document.importNode(template.content, true);
					const regel = _registerElement(clone);

					// Create derived states for key and value
					const keyState = new State(() => key);

					const numKey = parseInt(key);
					const valueState = new State(() => {
						const currentArray = arrayState.value;
						if (
							Array.isArray(currentArray) &&
							numKey < currentArray.length
						) {
							return currentArray[numKey];
						}
						// For object keys or out-of-bounds array access
						if (currentArray && typeof currentArray === "object") {
							return currentArray[
								key as keyof typeof currentArray
							];
						}
						return "";
					});

					// Update with State objects
					regel.update({
						[keyName as string]: keyState,
						[valName as string]: valueState,
					});

					// Create a wrapper div to contain both comment and clone
					const wrapper = document.createElement("div");
					wrapper.style.display = "contents"; // Make wrapper invisible
					const comment = document.createComment(`MF_EACH_${key}`);
					wrapper.appendChild(comment);
					wrapper.appendChild(clone);
					element.appendChild(wrapper);

					// Store the wrapper and no separate cleanup needed since
					// our derived states will automatically track dependencies
					createdElements.set(key, {
						comment,
						wrapper,
						regel,
					});
				}
			});
		});
	};

	if (document.readyState === "loading") {
		document.addEventListener("DOMContentLoaded", register);
	} else {
		register();
	}
};

export const templIf = (selector: string) => {};
