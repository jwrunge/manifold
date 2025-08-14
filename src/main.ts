import { Effect, type EffectDependency } from "./Effect.ts";
import proxy from "./proxy.ts";

export type StateConstraint = Record<string, unknown>;
export type FuncsConstraint = Record<string, (...args: never[]) => unknown>;

export let globalState: StateBuilder<StateConstraint, FuncsConstraint>;
// Expose the currently built (reactive proxied) global state object for helpers like the expression parser
export let currentState: StateConstraint | undefined;

const effect = (fn: EffectDependency) => {
	const newEffect = new Effect(fn);
	newEffect.run();
	return newEffect;
};

class StateBuilder<
	TState extends StateConstraint,
	TFuncs extends FuncsConstraint
> {
	#scopedState = {} as TState;
	#scopedFuncs = {} as TFuncs;
	#derivations = new Map<string, (store: StateConstraint) => unknown>();

	static _globalState:
		| StateBuilder<StateConstraint, FuncsConstraint>
		| undefined;
	static _currentState: StateConstraint | undefined;

	constructor(
		initialState?: TState,
		initialFuncs?: TFuncs,
		derivations?: Map<string, (store: StateConstraint) => unknown>
	) {
		this.#scopedState = (initialState || {}) as TState;
		this.#scopedFuncs = (initialFuncs || {}) as TFuncs;
		this.#derivations = derivations || new Map();
	}

	static create<S extends StateConstraint, F extends FuncsConstraint>(
		initialState?: S,
		initialFuncs?: F
	): StateBuilder<S, F> {
		return new StateBuilder<S, F>(initialState, initialFuncs);
	}

	static effect(fn: EffectDependency) {
		return effect(fn);
	}

	add<K extends string, V>(
		key: K,
		value: V,
		sync?: () => void
	): StateBuilder<TState & Record<K, V>, TFuncs> {
		const newState = { ...this.#scopedState, [key]: value } as TState &
			Record<K, V>;
		if (sync) sync(); // placeholder for future reactive sync hook
		return new StateBuilder(
			newState,
			this.#scopedFuncs as TFuncs,
			this.#derivations
		) as StateBuilder<TState & Record<K, V>, TFuncs>;
	}

	addDerived<K extends string, T>(
		key: K,
		fn: (store: TState) => T
	): StateBuilder<TState & Record<K, T>, TFuncs> {
		// Placeholder derived value to extend type
		const newState = {
			...this.#scopedState,
			[key]: undefined as T,
		} as TState & Record<K, T>;
		const newDerivations = new Map(this.#derivations);
		newDerivations.set(key, fn as (store: StateConstraint) => unknown);
		return new StateBuilder(
			newState,
			this.#scopedFuncs,
			newDerivations
		) as StateBuilder<TState & Record<K, T>, TFuncs>;
	}

	build(local?: boolean) {
		if (!local) {
			if (globalState) throw "Global state redefined";
			globalState = this;
		}

		const state = proxy(this.#scopedState) as TState;
		currentState = state; // store globally for expression parsing

		// Initialize & effect-sync derived values
		for (const [key, deriveFn] of this.#derivations) {
			(state as Record<string, unknown>)[key] = (
				deriveFn as (store: TState) => unknown
			)(state);
			effect(() => {
				const newValue = (deriveFn as (store: TState) => unknown)(
					state
				);
				(state as Record<string, unknown>)[key] = newValue;
			});
		}

		return { state, fn: this.#scopedFuncs as TFuncs };
	}
}

export default StateBuilder;
