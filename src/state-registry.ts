import { State } from "./State";
import { extractVariableNames } from "./expression-parser.js";

/**
 * Global state registry for automatic variable resolution
 * Maps variable names to their State instances
 */
class StateRegistry {
	private states = new Map<string, State<any>>();
	private watchers = new Set<() => void>();

	/**
	 * Register a state with an inferred name
	 * Uses the variable name from the calling context
	 */
	registerState<T>(state: State<T>, name?: string): void {
		if (!name) {
			// Try to infer the name from the call stack or use a generated name
			name = this.inferVariableName() || `state_${this.states.size}`;
		}

		this.states.set(name, state);
		this.notifyWatchers();
	}

	/**
	 * Convenience method to create and register a state in one call
	 */
	register<T>(name: string, initialValue: T | (() => T)): State<T> {
		const state = new State(initialValue);
		this.registerState(state, name);
		return state;
	}

	/**
	 * Get a state by name
	 */
	getState(name: string): State<any> | undefined {
		return this.states.get(name);
	}

	/**
	 * Get all registered state names
	 */
	getStateNames(): string[] {
		return Array.from(this.states.keys());
	}

	/**
	 * Build a context object for expression evaluation
	 */
	buildContext(): Record<string, any> {
		const context: Record<string, any> = {};

		for (const [name, state] of this.states) {
			// Create a reactive wrapper that updates when the state changes
			Object.defineProperty(context, name, {
				get: () => state.value,
				enumerable: true,
				configurable: true,
			});
		}

		// Add safe built-ins
		context["Math"] = Math;
		context["Date"] = Date;
		context["Number"] = Number;
		context["String"] = String;
		context["Boolean"] = Boolean;

		return context;
	}

	/**
	 * Register variables found in an expression
	 * This is called when parsing expressions to ensure all referenced variables are available
	 */
	ensureVariables(expression: string): void {
		const variables = extractVariableNames(expression);

		for (const varName of variables) {
			if (!this.states.has(varName)) {
				// Try to find the variable in global scope and auto-register it
				this.tryAutoRegister(varName);
			}
		}
	}

	/**
	 * Add a watcher that gets called when the registry changes
	 */
	addWatcher(callback: () => void): void {
		this.watchers.add(callback);
	}

	/**
	 * Remove a watcher
	 */
	removeWatcher(callback: () => void): void {
		this.watchers.delete(callback);
	}

	private notifyWatchers(): void {
		this.watchers.forEach((callback) => callback());
	}

	private inferVariableName(): string | null {
		// This is a simplified approach - in a real implementation we might use
		// source map analysis or require explicit naming
		return null;
	}

	private tryAutoRegister(varName: string): void {
		// Try to find the variable in the global window object
		// This is a fallback for cases where we can't infer the variable
		if (typeof window !== "undefined" && varName in window) {
			const value = (window as any)[varName];
			if (value instanceof State) {
				this.registerState(value, varName);
			}
		}
	}
}

// Global registry instance
export const stateRegistry = new StateRegistry();

/**
 * Enhanced State class that auto-registers itself
 */
export class EnhancedState<T> extends State<T> {
	constructor(value: T | (() => T), name?: string) {
		super(value);

		// Auto-register this state
		stateRegistry.registerState(this, name);
	}
}

/**
 * Create a reactive state that auto-registers itself for expression use
 */
export function createState<T>(value: T | (() => T), name?: string): State<T> {
	return new EnhancedState(value, name);
}

/**
 * Manually register an existing state
 */
export function registerState<T>(state: State<T>, name: string): void {
	stateRegistry.registerState(state, name);
}

/**
 * Create a reactive context from registered states
 * This is used by expression evaluators to access current state values
 */
export function createReactiveContext(): Record<string, any> {
	return stateRegistry.buildContext();
}
