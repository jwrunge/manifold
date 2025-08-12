import proxy from "./proxy.ts";
// type Effect = () => void; // Unused for now

type StateConstraint = Record<string, unknown>;
type FuncsConstraint = Record<string, Function>;
type LifeCycleHook = () => void;

export let globalState: State<any, any>;

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

	onStart(hook: LifeCycleHook) {
		this.#startUp.push(hook);
	}

	onUpdate(hook: LifeCycleHook) {
		this.#updates.push(hook);
	}

	// Add a property and return a new builder with updated type
	addState<K extends string, V>(
		key: K,
		value: V
	): Builder<TState & Record<K, V>> {
		const newState = { ...this.#globalState, [key]: value } as TState &
			Record<K, V>;
		const next = new Builder<TState & Record<K, V>>(
			newState,
			this.#globalFuncs as unknown as TFuncs
		);
		// Preserve lifecycle hooks when chaining
		next.#startUp = [...this.#startUp];
		next.#updates = [...this.#updates];
		return next;
	}

	addSyncState<K extends string, V>(
		key: K,
		get: () => V | Promise<V>,
		set: (value: V) => void | Promise<void>
	): Builder<TState & Record<K, V>> {
		const res = get();
		const isPromise = !!(res && typeof (res as any).then === "function");
		const initial = isPromise ? (undefined as unknown as V) : (res as V);

		// First, add the key with an initial value to maintain the type chain
		const next = this.addState(key, initial);

		// Define an accessor on the underlying state to call `set` when mutated
		let current = initial;
		Object.defineProperty((next as any).#globalState, key, {
			configurable: true,
			enumerable: true,
			get() {
				return current;
			},
			set(v: V) {
				if (current === v) return;
				current = v;
				const ret = set(v);
				if (ret && typeof (ret as any).then === "function")
					(ret as Promise<void>).catch(() => {});
			},
		});

		// If the getter was async, populate the value on startup
		if (isPromise) {
			next.onStart(async () => {
				try {
					const v = await Promise.resolve(get());
					current = v as V;
				} catch {
					/* swallow */
				}
			});
		} else {
			// Optionally sync the initial value outward on startup
			next.onStart(() => {
				const ret = set(current);
				if (ret && typeof (ret as any).then === "function")
					(ret as Promise<void>).catch(() => {});
			});
		}

		return next;
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
	build(option?: "global") {
		// Create a new State instance with the current global state
		const app = new State<TState>(
			this.#globalState,
			this.#globalFuncs,
			this.#startUp,
			this.#updates
		);
		if (option) globalState = app;
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
	updates: LifeCycleHook[] = [];

	static create<
		S extends StateConstraint = {},
		F extends FuncsConstraint = {}
	>(initialState?: S, initialFuncs?: F): Builder<S, F> {
		return new Builder<S, F>(initialState, initialFuncs);
	}

	constructor(
		state: TState,
		funcs: TFuncs,
		startup: LifeCycleHook[],
		updates: LifeCycleHook[]
	) {
		this.store = state;
		this.funcs = funcs ?? ({} as TFuncs);
		this.updates = updates;

		for (const hook of startup) hook();
	}
}
