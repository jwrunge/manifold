import { RegEl } from "./RegisteredElement";
import { evaluateExpression } from "./expression-parser.js";
import { stateRegistry, createReactiveContext } from "./state-registry";
import { State } from "./State";

/**
 * Auto-discovery system for Manifold elements
 * Scans DOM for data-condition, data-items, data-text, etc.
 */
class AutoDiscovery {
	private registered = new WeakSet<Element>();

	/**
	 * Scan the entire document for Manifold elements and register them
	 */
	discoverAndRegister(): void {
		this.registerConditionals();
		this.registerLoops();
		this.registerTextElements();
		this.registerBindElements();
	}
	/**
	 * Re-register elements in a specific container (for dynamic content)
	 */
	registerContainer(container: Element): void {
		this.registerConditionalsIn(container);
		this.registerLoopsIn(container);
		this.registerTextElementsIn(container);
		this.registerBindElementsIn(container);
	}

	private registerConditionals(): void {
		this.registerConditionalsIn(document);
	}

	private registerConditionalsIn(container: Element | Document): void {
		// Find all conditional elements
		const conditionals = container.querySelectorAll(
			"mf-if[data-condition], mf-if[data-state], mf-else-if[data-condition], mf-else-if[data-state], mf-else"
		);

		conditionals.forEach((element) => {
			if (this.registered.has(element)) return;
			this.registered.add(element);

			const condition = element.getAttribute("data-condition");
			const state = element.getAttribute("data-state");

			if (condition) {
				// Expression-based condition
				this.registerExpressionCondition(
					element as HTMLElement,
					condition
				);
			} else if (state) {
				// State-based condition
				this.registerStateCondition(element as HTMLElement, state);
			} else if (element.nodeName === "MF-ELSE") {
				// Handle mf-else elements
				RegEl.register(element as HTMLElement, {
					else: true,
				});
			}
		});
	}

	private registerExpressionCondition(
		element: HTMLElement,
		expression: string
	): void {
		// Ensure all variables in the expression are registered
		stateRegistry.ensureVariables(expression);

		// Create a reactive state that evaluates the expression
		const conditionState = new State<boolean>(() => {
			try {
				const context = createReactiveContext();
				return Boolean(evaluateExpression(expression, context));
			} catch (error) {
				return false;
			}
		});

		// Register with RegEl
		RegEl.register(element, {
			show: conditionState,
			else: element.nodeName === "MF-ELSE-IF",
		});
	}

	private registerStateCondition(
		element: HTMLElement,
		stateName: string
	): void {
		const state = stateRegistry.getState(stateName);
		if (!state) {
			return;
		}

		RegEl.register(element, {
			show: state,
			else: element.nodeName === "MF-ELSE-IF",
		});
	}

	private registerLoops(): void {
		this.registerLoopsIn(document);
	}

	private registerLoopsIn(container: Element | Document): void {
		const loops = container.querySelectorAll(
			"mf-each[data-items], mf-each[data-state]"
		);

		loops.forEach((element) => {
			if (this.registered.has(element)) return;
			this.registered.add(element);

			const items = element.getAttribute("data-items");
			const state = element.getAttribute("data-state");

			// Check if template exists
			element.querySelector("template");

			if (items) {
				this.registerExpressionLoop(element as HTMLElement, items);
			} else if (state) {
				this.registerStateLoop(element as HTMLElement, state);
			}
		});
	}

	private registerExpressionLoop(
		element: HTMLElement,
		expression: string
	): void {
		// Handle literal arrays or state references
		let arrayState: State<Array<unknown>>;

		if (expression.startsWith("[") && expression.endsWith("]")) {
			// Literal array like [1, 2, 3, 4]
			try {
				const context = createReactiveContext();
				const array = evaluateExpression(expression, context);
				arrayState = new State<Array<unknown>>(
					Array.isArray(array) ? array : []
				);
			} catch (error) {
				return;
			}
		} else {
			// State reference or complex expression
			stateRegistry.ensureVariables(expression);
			arrayState = new State<Array<unknown>>(() => {
				try {
					const context = createReactiveContext();
					const result = evaluateExpression(expression, context);
					return Array.isArray(result) ? result : [];
				} catch (error) {
					return [];
				}
			});
		}

		RegEl.register(element, {
			each: arrayState,
		});
	}

	private registerStateLoop(element: HTMLElement, stateName: string): void {
		const state = stateRegistry.getState(stateName);
		if (!state) {
			return;
		}

		RegEl.register(element, {
			each: state as State<Array<unknown>>,
		});
	}

	private registerTextElements(): void {
		this.registerTextElementsIn(document);
	}

	private registerTextElementsIn(container: Element | Document): void {
		// mf-text with data-template
		const templateElements = container.querySelectorAll(
			"mf-text[data-template]"
		);
		templateElements.forEach((element) => {
			if (this.registered.has(element)) return;
			this.registered.add(element);

			const template = element.getAttribute("data-template")!;
			this.registerTemplateElement(element as HTMLElement, template);
		});

		// mf-span with data-text
		const textElements = container.querySelectorAll("mf-span[data-text]");
		textElements.forEach((element) => {
			if (this.registered.has(element)) return;
			this.registered.add(element);

			const expression = element.getAttribute("data-text")!;
			this.registerTextElement(element as HTMLElement, expression);
		});

		// Any element with data-content
		const contentElements = container.querySelectorAll("[data-content]");
		contentElements.forEach((element) => {
			if (this.registered.has(element)) return;
			this.registered.add(element);

			const expression = element.getAttribute("data-content")!;
			this.registerContentElement(element as HTMLElement, expression);
		});
	}

	private registerTemplateElement(
		element: HTMLElement,
		template: string
	): void {
		// Create a document fragment with the template
		const templateElement = document.createElement("template");
		templateElement.innerHTML = template;

		stateRegistry.ensureVariables(template);

		RegEl.register(element, {
			templateContent: templateElement.content.cloneNode(
				true
			) as DocumentFragment,
		});
	}

	private registerTextElement(
		element: HTMLElement,
		expression: string
	): void {
		stateRegistry.ensureVariables(expression);

		const textState = new State<string>(() => {
			try {
				const context = createReactiveContext();
				return String(evaluateExpression(expression, context));
			} catch (error) {
				return "";
			}
		});

		// Use RegisteredElement to handle the reactive updates
		RegEl.register(element, {
			props: { text: textState },
		});

		// Set up the text content update
		textState.effect(() => {
			element.textContent = textState.value;
		});
	}

	private registerContentElement(
		element: HTMLElement,
		expression: string
	): void {
		stateRegistry.ensureVariables(expression);

		const contentState = new State<string>(() => {
			try {
				const context = createReactiveContext();
				return String(evaluateExpression(expression, context));
			} catch (error) {
				return "";
			}
		});

		// Use RegisteredElement to handle the reactive updates
		RegEl.register(element, {
			props: { content: contentState },
		});

		// Set up the content update
		contentState.effect(() => {
			element.textContent = contentState.value;
		});
	}

	private registerBindElements(): void {
		this.registerBindElementsIn(document);
	}

	private registerBindElementsIn(container: Element | Document): void {
		const bindElements = container.querySelectorAll("[data-bind]");

		bindElements.forEach((element) => {
			if (this.registered.has(element)) return;
			this.registered.add(element);

			element.getAttribute("data-bind");
			// Note: data-bind elements still need to be configured via JavaScript
			// This just marks them as discovered
		});
	}
}

// Global auto-discovery instance
const autoDiscovery = new AutoDiscovery();

/**
 * Initialize Manifold auto-discovery
 * Call this on DOMContentLoaded or manually
 */
export function initializeManifold(): void {
	autoDiscovery.discoverAndRegister();
}

/**
 * Re-register elements in a container (for dynamic content)
 */
export function registerContainer(container: Element): void {
	autoDiscovery.registerContainer(container);
}

// Auto-initialize when DOM is ready (commented out for manual control)
// if (typeof document !== 'undefined') {
//   if (document.readyState === 'loading') {
//     document.addEventListener('DOMContentLoaded', () => {
//       console.log('DOM loaded, auto-initializing Manifold...');
//       initializeManifold();
//     });
//   } else if (document.readyState === 'interactive' || document.readyState === 'complete') {
//     // DOM is already ready, but wait a tick to let the script finish loading
//     setTimeout(() => {
//       console.log('DOM already ready, auto-initializing Manifold...');
//       initializeManifold();
//     }, 0);
//   }
// }
