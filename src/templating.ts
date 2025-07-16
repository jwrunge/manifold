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

		// Store created elements to avoid recreating them
		const createdElements = new Map<
			string,
			{
				comment: Comment;
				clone: Node;
				regel: _RegEl;
				keyState?: State<string>;
				valueState?: State<unknown>;
				cleanup?: () => void;
			}
		>();

		const onEffect = () => {
			// Handle both State and direct value returns
			const arrResult = arr();
			const it_over =
				arrResult instanceof State ? arrResult.value : arrResult;

			// Check if it_over is null, undefined, or not an object/array
			if (
				!it_over ||
				(typeof it_over !== "object" && !Array.isArray(it_over))
			) {
				// Clear all created elements
				createdElements.forEach((elementData, key) => {
					if (elementData.cleanup) {
						elementData.cleanup();
					}
					// Remove DOM elements
					elementData.comment.remove();
					if (elementData.clone.parentNode) {
						elementData.clone.parentNode.removeChild(
							elementData.clone
						);
					}
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

						// Remove the wrapper (which contains both comment and clone)
						if (elementData.clone.parentNode) {
							elementData.clone.parentNode.removeChild(
								elementData.clone
							);
						}
						createdElements.delete(key);
					}
				}
			});

			// Add or update elements
			currentKeys.forEach((key) => {
				if (!createdElements.has(key)) {
					// Create new element
					const clone = document.importNode(template.content, true);
					const regel = _registerElement(clone);

					if (arrResult instanceof State) {
						// Create reactive State objects for the properties
						const arrayState = arrResult;
						const keyState = new State(key);

						// Create a derived state that specifically tracks this array index
						const numKey = parseInt(key);
						const valueState = new State(() => {
							// Access the array element directly to ensure granular tracking
							const currentArray = arrayState.value;
							if (
								Array.isArray(currentArray) &&
								numKey < currentArray.length
							) {
								const result = currentArray[numKey];
								return result;
							}
							// For object keys or out-of-bounds array access
							if (
								currentArray &&
								typeof currentArray === "object"
							) {
								const result =
									currentArray[
										key as keyof typeof currentArray
									];
								return result;
							}
							return "";
						});

						// Update with State objects initially, then enhance with our own effect
						regel.update({
							[keyName as string]: keyState,
							[valName as string]: valueState,
						});

						// Create our own effect for the value and store cleanup function
						const valueCleanup = valueState.effect(() => {
							String(valueState.value);
						});

						// Create a wrapper div to contain both comment and clone
						const wrapper = document.createElement("div");
						wrapper.style.display = "contents"; // Make wrapper invisible
						const comment = document.createComment(
							`MF_EACH_${key}`
						);
						wrapper.appendChild(comment);
						wrapper.appendChild(clone);
						element.appendChild(wrapper);

						createdElements.set(key, {
							comment,
							clone: wrapper, // Store the wrapper instead
							regel,
							keyState,
							valueState,
							cleanup: valueCleanup,
						});
					} else {
						// Non-reactive case - just use the values directly
						regel.update({
							[keyName as string]: key,
							[valName as string]:
								it_over[key as keyof typeof it_over],
						});

						// Create a wrapper div to contain both comment and clone
						const wrapper = document.createElement("div");
						wrapper.style.display = "contents"; // Make wrapper invisible
						const comment = document.createComment(
							`MF_EACH_${key}`
						);
						wrapper.appendChild(comment);
						wrapper.appendChild(clone);
						element.appendChild(wrapper);

						createdElements.set(key, {
							comment,
							clone: wrapper,
							regel,
						});
					}
				}
			});
		};

		// Only create one effect for structural changes (add/remove elements)
		if (arr() instanceof State) {
			let lastKeys: string[] = [];
			(arr() as State<unknown[]>).effect(() => {
				const arrResult = arr();
				const it_over =
					arrResult instanceof State ? arrResult.value : arrResult;

				if (
					!it_over ||
					(typeof it_over !== "object" && !Array.isArray(it_over))
				) {
					lastKeys = [];
					onEffect();
					return;
				}

				const currentKeys = Object.keys(it_over);

				// Only re-run onEffect if the array structure changed (keys added/removed)
				const keysChanged =
					currentKeys.length !== lastKeys.length ||
					currentKeys.some((key) => !lastKeys.includes(key)) ||
					lastKeys.some((key) => !currentKeys.includes(key));

				if (keysChanged) {
					lastKeys = [...currentKeys];
					onEffect();
				}
			});
		} else {
			onEffect(); // For non-reactive arrays, just run once
		}
	};

	if (document.readyState === "loading") {
		document.addEventListener("DOMContentLoaded", register);
	} else {
		register();
	}
};

export const templIf = (selector: string) => {};
