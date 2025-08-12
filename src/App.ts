// type Effect = () => void; // Unused for now

// Approach 2: Builder pattern for type-safe state construction
export class Builder<T extends Record<string, unknown> = {}> {
	private globalState: T;

	constructor(initialState?: T) {
		this.globalState = (initialState || {}) as T;
	}

	static create<U extends Record<string, unknown> = {}>(
		initialState?: U
	): Builder<U> {
		return new Builder<U>(initialState);
	}

	// Add a property and return a new builder with updated type
	add<K extends string, V>(key: K, value: V): Builder<T & Record<K, V>> {
		const newState = { ...this.globalState, [key]: value } as T &
			Record<K, V>;
		return new Builder<T & Record<K, V>>(newState);
	}

	// Build the final App instance
	build(): State<T> {
		return new State<T>(this.globalState);
	}

	// Get current state
	getState(): T {
		return this.globalState;
	}
}

export class State<T extends Record<string, unknown> = {}> {
	state: T;
	constructor(state: T) {
		this.state = state;
	}
}

const app = Builder.create().add("count", 0).add("name", "MyApp").build();

console.log(app.state.count);
console.log(app.state.name);
// console.log(app.state.nonExistent); // Would be TypeScript error: Property 'nonExistent' does not exist
console.log(app);
