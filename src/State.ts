import proxy from "./proxy.ts";

// type Effect = () => void; // Unused for now

export type StateConstraint = Record<string, unknown>;
export type FuncsConstraint = Record<string, (...args: never[]) => unknown>;
type LifeCycleHook = () => void;

export let globalState: State<StateConstraint, FuncsConstraint>;

/**
 * A fluent builder for creating type-safe state management instances
 * @template TState - The state object type
 * @template TFuncs - The functions object type
 */
export class Builder<
	TState extends StateConstraint,
	TFuncs extends FuncsConstraint
> {
	#scopedState = {} as TState;
	#scopedFuncs = {} as TFuncs;
	#startUp: LifeCycleHook[] = [];
	#updates: LifeCycleHook[] = [];

	constructor(initialState?: TState, initialFuncs?: TFuncs) {
		this.#scopedState = (initialState || {}) as TState;
		this.#scopedFuncs = (initialFuncs || {}) as TFuncs;
	}

	onStart(hook: LifeCycleHook) {
		this.#startUp.push(hook);
		return this;
	}

	onUpdate(hook: LifeCycleHook) {
		this.#updates.push(hook);
		return this;
	}

	#createNext<
		NewState extends StateConstraint,
		NewFuncs extends FuncsConstraint
	>(newState: NewState, newFuncs: NewFuncs): Builder<NewState, NewFuncs> {
		const next = new Builder<NewState, NewFuncs>(newState, newFuncs);
		next.#startUp = [...this.#startUp];
		next.#updates = [...this.#updates];
		return next;
	}

	/**
	 * Add a state property to the builder
	 * @param key - The property name
	 * @param value - The initial value
	 * @returns A new builder with the added state property
	 */
	addState<K extends string, V>(
		key: K,
		value: V
	): Builder<TState & Record<K, V>, TFuncs> {
		const newState = { ...this.#scopedState, [key]: value } as TState &
			Record<K, V>;
		return this.#createNext(newState, this.#scopedFuncs as TFuncs);
	}

	addSyncState<K extends string, V>(
		key: K,
		get: () => V | Promise<V>,
		set: (value: V) => void | Promise<void>
	): Builder<TState & Record<K, V>, TFuncs> {
		const res = get();
		const isPromise = !!(
			res && typeof (res as Promise<V>).then === "function"
		);
		const initial = isPromise ? (undefined as unknown as V) : (res as V);
		const next = this.addState(
			key,
			isPromise ? (undefined as unknown as V) : (res as V)
		);

		// TODO: Handle set

		let current = initial;
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
			next.onStart(() => {
				const ret = set(current);
				if (ret && typeof (ret as Promise<V>).then === "function")
					(ret as Promise<void>).catch(() => {});
			});
		}

		return next;
	}

	addFunc<K extends string, F extends (...args: never[]) => unknown>(
		key: K,
		func: F
	): Builder<TState, TFuncs & Record<K, F>> {
		const newFuncs = { ...this.#scopedFuncs, [key]: func } as TFuncs &
			Record<K, F>;
		return this.#createNext(this.#scopedState, newFuncs);
	}

	// Build the final App instance
	build(option?: "global") {
		const app = new State<TState, TFuncs>(
			this.#scopedState,
			this.#scopedFuncs,
			this.#startUp,
			this.#updates
		);
		if (option) globalState = app;
		return {
			store: proxy(app.store, app) as TState,
			fn: this.#scopedFuncs as TFuncs,
		};
	}
}

export class State<
	TState extends StateConstraint,
	TFuncs extends FuncsConstraint
> {
	store = {} as TState;
	funcs = {} as TFuncs;
	updates: LifeCycleHook[] = [];

	static create<S extends StateConstraint, F extends FuncsConstraint>(
		initialState?: S,
		initialFuncs?: F
	): Builder<S, F> {
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
