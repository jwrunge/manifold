import { ElementFrom, ElementKeys } from "./_types.elements";
import { State } from "./reactivity";

const extractKeyValNames = (element: HTMLElement): string[] => {
	return element.dataset?.["as"]?.split(/\s*,\s*/) ?? ["value", "key"];
};

// Helper to evaluate expressions in the context of state and variables
const evaluateExpression = (
	expression: string,
	context: Record<string, any> = {}
): any => {
	try {
		const enhancedContext = { ...context };
		for (const [key, value] of Object.entries(context)) {
			if (!key.startsWith("$")) {
				enhancedContext[`$${key}`] = value;
			}
		}

		// Create a function that has access to the context variables
		const contextKeys = Object.keys(enhancedContext);
		const contextValues = Object.values(enhancedContext);
		const func = new Function(...contextKeys, `return ${expression}`);
		return func(...contextValues);
	} catch (error) {
		console.warn(`Failed to evaluate expression: ${expression}`, error);
		return false;
	}
};

// Helper to parse template expressions like {$key}, {$val}, etc.
const parseTemplateString = (
	template: string,
	context: Record<string, any>
): string => {
	return template.replace(/\{([^}]+)\}/g, (match, expression) => {
		try {
			// Handle both $variable and variable syntax
			let cleanExpression = expression.trim();

			// Check if this is a simple variable reference (no operators, function calls, etc.)
			const isSimpleVariable = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(
				cleanExpression
			);

			// If expression starts with $ and is a simple variable, try to find the variable without $
			if (cleanExpression.startsWith("$") && cleanExpression.length > 1) {
				const varName = cleanExpression.substring(1);

				// Only use direct variable lookup for simple variable references
				if (isSimpleVariable && context.hasOwnProperty(varName)) {
					return String(context[varName] ?? "");
				}
			}

			// For all other cases (complex expressions or simple variables without $), evaluate the full expression
			const value = evaluateExpression(cleanExpression, context);
			return String(value ?? "");
		} catch {
			return match; // Return original if evaluation fails
		}
	});
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

// Enhanced templating system that handles if/else if/else/each
export const initTemplating = (getStateContext: () => Record<string, any>) => {
	const processTemplate = (
		element: HTMLElement,
		context: Record<string, any>
	) => {
		// Handle if/else if/else logic
		if (
			element.hasAttribute("if") ||
			element.hasAttribute("elseif") ||
			element.hasAttribute("else")
		) {
			handleConditionals(element, context);
		}

		// Handle each loops
		if (element.hasAttribute("each")) {
			handleEach(element, context);
		}

		// Handle template content parsing
		if (element.textContent) {
			element.textContent = parseTemplateString(
				element.textContent,
				context
			);
		}
	};

	const handleConditionals = (
		element: HTMLElement,
		context: Record<string, any>
	) => {
		const ifAttr = element.getAttribute("if");
		const elseifAttr = element.getAttribute("elseif");
		const elseAttr = element.getAttribute("else");

		let shouldShow = false;

		if (ifAttr !== null) {
			// This is an if statement
			shouldShow = evaluateExpression(ifAttr, context);
		} else if (elseifAttr !== null) {
			// This is an else if - check if previous if/elseif was false
			const previousSibling = getPreviousConditionalSibling(element);
			const previousWasTrue =
				previousSibling?.dataset["conditionalResult"] === "true";
			if (!previousWasTrue) {
				shouldShow = evaluateExpression(elseifAttr, context);
			}
		} else if (elseAttr !== null) {
			// This is an else - show only if all previous conditions were false
			const previousSibling = getPreviousConditionalSibling(element);
			shouldShow =
				previousSibling?.dataset["conditionalResult"] !== "true";
		}

		// Store the result for next elseif/else to check
		element.dataset["conditionalResult"] = String(shouldShow);

		// Show/hide the element
		if (shouldShow) {
			element.style.display = "";
			element.hidden = false;
		} else {
			element.style.display = "none";
			element.hidden = true;
		}
	};

	const getPreviousConditionalSibling = (
		element: HTMLElement
	): HTMLElement | null => {
		let prev = element.previousElementSibling as HTMLElement;
		while (prev) {
			if (prev.hasAttribute("if") || prev.hasAttribute("elseif")) {
				return prev;
			}
			prev = prev.previousElementSibling as HTMLElement;
		}
		return null;
	};

	const handleEach = (element: HTMLElement, context: Record<string, any>) => {
		const eachAttr = element.getAttribute("each");
		if (!eachAttr) return;

		// Parse "collection as item, index" syntax
		const match = eachAttr.match(
			/^(.+?)\s+as\s+([^,]+)(?:\s*,\s*([^,]+))?$/
		);
		if (!match) {
			console.warn(`Invalid each syntax: ${eachAttr}`);
			return;
		}

		const [, collectionExpr, itemName, indexName = "index"] = match;
		const collection = evaluateExpression(collectionExpr || "", context);

		if (!collection) return;

		// Store original template content
		if (!element.dataset["originalContent"]) {
			element.dataset["originalContent"] = element.innerHTML;
		}

		const originalContent = element.dataset["originalContent"] || "";
		element.innerHTML = ""; // Clear current content

		// Handle arrays
		if (Array.isArray(collection)) {
			collection.forEach((item, index) => {
				const itemContext = {
					...context,
					[itemName as string]: item,
					[indexName as string]: index,
					// Also add $ prefixed versions for compatibility
					[`$${itemName as string}`]: item,
					[`$${indexName as string}`]: index,
				};

				const itemElement = document.createElement("div");
				itemElement.innerHTML = parseTemplateString(
					originalContent,
					itemContext
				);
				element.appendChild(itemElement);
			});
		}
		// Handle objects
		else if (typeof collection === "object") {
			Object.entries(collection).forEach(([key, value]) => {
				const itemContext = {
					...context,
					[itemName as string]: value,
					[indexName as string]: key,
					// Also add $ prefixed versions for compatibility
					[`$${itemName as string}`]: value,
					[`$${indexName as string}`]: key,
					key,
					value,
					$key: key,
					$value: value,
				};

				const itemElement = document.createElement("div");
				itemElement.innerHTML = parseTemplateString(
					originalContent,
					itemContext
				);
				element.appendChild(itemElement);
			});
		}
	};

	// Main templating function that processes all mf-templ elements
	const processAllTemplates = () => {
		const currentContext = getStateContext();
		const templates = document.querySelectorAll("mf-templ");
		templates.forEach((template) => {
			processTemplate(template as HTMLElement, currentContext);
		});
	};

	return {
		processAllTemplates,
		processTemplate,
	};
};

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
