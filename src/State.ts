import proxy from "./proxy.ts";
// type Effect = () => void; // Unused for now

type StateConstraint = Record<string, unknown>;
type FuncsConstraint = Record<string, Function>;
type LifeCycleHook = () => void;

export class Builder<
	TState extends StateConstraint,
	TFuncs extends FuncsConstraint = {}
> {
	#globalState = {} as TState;
	#globalFuncs = {} as TFuncs;
	#startUp: LifeCycleHook[] = [];
	#updates: LifeCycleHook[] = [];

	constructor(initialState?: TState, initialFuncs?: TFuncs) {
		this.#globalState = (initialState || {}) as TState;
		this.#globalFuncs = (initialFuncs || {}) as TFuncs;
	}

	static create<
		S extends StateConstraint = {},
		F extends FuncsConstraint = {}
	>(initialState?: S, initialFuncs?: F): Builder<S, F> {
		return new Builder<S, F>(initialState, initialFuncs);
	}

	onStart() {}

	onUpdate() {}

	// Add a property and return a new builder with updated type
	addState<K extends string, V>(
		key: K,
		value: V
	): Builder<TState & Record<K, V>> {
		const newState = { ...this.#globalState, [key]: value } as TState &
			Record<K, V>;
		return new Builder<TState & Record<K, V>>(newState);
	}

	addFunc<K extends string, F extends Function>(
		key: K,
		func: F
	): Builder<TState, TFuncs & Record<K, F>> {
		const newFuncs = { ...this.#globalFuncs, [key]: func } as TFuncs &
			Record<K, F>;
		return new Builder<TState, TFuncs & Record<K, F>>(
			this.#globalState,
			newFuncs
		);
	}

	// Build the final App instance
	build() {
		// Create a new State instance with the current global state
		const app = new State<TState>(this.#globalState, this.#globalFuncs);
		return {
			store: proxy(app.store) as TState,
			fn: this.#globalFuncs as TFuncs,
		};
	}
}

export class State<
	TState extends StateConstraint,
	TFuncs extends FuncsConstraint = {}
> {
	store = {} as TState;
	funcs = {} as TFuncs;

	constructor(state: TState, funcs?: TFuncs) {
		this.store = state;
		this.funcs = funcs ?? ({} as TFuncs);
	}
}

const { store, fn } = Builder.create()
	.addState("count", 0)
	.addState("name", "MyApp")
	.addFunc("increment", () => {
		store.count++;
	})
	.build();

console.log(store.count);
console.log(store.name);
console.log(store.undefined);
store.count++;
fn.increment();
console.log(store.count);
console.log(store);
