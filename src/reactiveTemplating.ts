import { State } from "./reactivity";
import { initTemplating } from "./templating";

// Re-export for convenience
export { State } from "./reactivity";
export { initTemplating } from "./templating";

// Reactive templating system that integrates with your State system
export class ReactiveTemplating {
	private templatingSystem: ReturnType<typeof initTemplating>;
	private states: Map<string, State<any>> = new Map();
	private globalContext: Record<string, any> = {};

	constructor() {
		// Pass a getter function so templating always has access to current context
		this.templatingSystem = initTemplating(() => this.globalContext);
		this.init();
	}

	// Register an existing state variable that templates can access
	registerState<T>(name: string, state: State<T>): State<T> {
		this.states.set(name, state);

		// Update global context whenever state changes using the State's effect method
		state.effect(() => {
			this.updateGlobalContext();
			this.templatingSystem.processAllTemplates();
		});

		this.updateGlobalContext();
		return state;
	}

	// Register a non-reactive variable
	registerVariable(name: string, value: any): void {
		this.globalContext[name] = value;
	}

	// Update the global context with current state values
	private updateGlobalContext(): void {
		// Add state values to context with $st prefix (matching your HTML examples)
		const stateContext: Record<string, any> = {};
		for (const [name, state] of this.states) {
			stateContext[name] = state.value;
		}
		this.globalContext["$st"] = stateContext;

		// Also add individual states for easier access
		for (const [name, state] of this.states) {
			this.globalContext[`$${name}`] = state.value;
		}
	}

	// Process all templates manually (useful for initial render or manual updates)
	processTemplates(): void {
		this.templatingSystem.processAllTemplates();
	}

	// Initialize the system by setting up mutation observer for dynamic content
	private init(): void {
		// Only initialize if we're in a browser environment
		if (typeof document === "undefined") {
			return;
		}

		// Process templates on DOM ready
		if (document.readyState === "loading") {
			document.addEventListener("DOMContentLoaded", () => {
				this.processTemplates();
			});
		} else {
			this.processTemplates();
		}

		// Watch for new mf-templ elements being added to the DOM
		const observer = new MutationObserver((mutations) => {
			let shouldProcess = false;
			mutations.forEach((mutation) => {
				mutation.addedNodes.forEach((node) => {
					if (node.nodeType === Node.ELEMENT_NODE) {
						const element = node as Element;
						if (
							element.tagName === "MF-TEMPL" ||
							element.querySelector("mf-templ")
						) {
							shouldProcess = true;
						}
					}
				});
			});

			if (shouldProcess) {
				// Small delay to ensure DOM is stable
				setTimeout(() => this.processTemplates(), 0);
			}
		});

		observer.observe(document.body, {
			childList: true,
			subtree: true,
		});
	}

	// Get a state by name
	getState<T>(name: string): State<T> | undefined {
		return this.states.get(name) as State<T>;
	}

	// Helper to create computed states using your existing State system
	createComputed<T>(name: string, computeFn: () => T): State<T> {
		const state = new State(computeFn);
		return this.registerState(name, state);
	}
}

// Lazy singleton instance for easy use
let _reactiveTemplating: ReactiveTemplating | null = null;

const getReactiveTemplating = (): ReactiveTemplating => {
	if (!_reactiveTemplating) {
		_reactiveTemplating = new ReactiveTemplating();
	}
	return _reactiveTemplating;
};

// Convenience functions
export const useState = <T>(
	name: string,
	initialValue: T | (() => T)
): State<T> => {
	const state = new State(initialValue);
	return getReactiveTemplating().registerState(name, state);
};

export const useVariable = (name: string, value: any): void => {
	getReactiveTemplating().registerVariable(name, value);
};

export const useComputed = <T>(name: string, computeFn: () => T): State<T> => {
	return getReactiveTemplating().createComputed(name, computeFn);
};
