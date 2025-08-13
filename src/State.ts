import proxy from "./proxy.ts";

// type Effect = () => void; // Unused for now

export type StateConstraint = Record<string, unknown>;
export type FuncsConstraint = Record<string, (...args: never[]) => unknown>;

export let globalState: State<StateConstraint, FuncsConstraint>;

export class Builder<
	TState extends StateConstraint,
	TFuncs extends FuncsConstraint
> {
	#scopedState = {} as TState;
	#scopedFuncs = {} as TFuncs;

	constructor(initialState?: TState, initialFuncs?: TFuncs) {
		this.#scopedState = (initialState || {}) as TState;
		this.#scopedFuncs = (initialFuncs || {}) as TFuncs;
	}

	addState<K extends string, V>(
		key: K,
		value: V,
		sync?: () => void
	): Builder<TState & Record<K, V>, TFuncs> {
		const newState = { ...this.#scopedState, [key]: value } as TState &
			Record<K, V>;
		if (sync) sync(); // TODO: this should be an effect that runs on state change -- account for deep props, too
		return new Builder(newState, this.#scopedFuncs as TFuncs) as Builder<
			TState & Record<K, V>,
			TFuncs
		>;
	}

	addFunc<K extends string, F extends (...args: never[]) => unknown>(
		key: K,
		func: F
	): Builder<TState, TFuncs & Record<K, F>> {
		const newFuncs = { ...this.#scopedFuncs, [key]: func } as TFuncs &
			Record<K, F>;
		return new Builder(this.#scopedState, newFuncs) as Builder<
			TState,
			TFuncs & Record<K, F>
		>;
	}

	build(local?: boolean) {
		const app = new State<TState, TFuncs>(
			this.#scopedState,
			this.#scopedFuncs
		);

		if (!local) {
			if (globalState) throw "Global state redefined";
			globalState = app;
		}

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

	static create<S extends StateConstraint, F extends FuncsConstraint>(
		initialState?: S,
		initialFuncs?: F
	): Builder<S, F> {
		return new Builder<S, F>(initialState, initialFuncs);
	}

	constructor(state: TState, funcs: TFuncs) {
		this.store = state;
		this.funcs = funcs ?? ({} as TFuncs);
	}
}
