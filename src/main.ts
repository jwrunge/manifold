import { Effect, type EffectDependency } from "./Effect.ts";
import proxy from "./proxy.ts";
import RegEl from "./registry.ts";

export type StateConstraint = Record<string, unknown>;
export type FuncsConstraint = Record<string, (...args: never[]) => unknown>;

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

	register = (container?: HTMLElement | SVGElement | MathMLElement) => {
		if (container) {
			return RegEl.register(container, this.#scopedState);
		} else {
			// Register all elements with data-mf-register attribute
			document
				.querySelectorAll("[data-mf-register]")
				.forEach((element) => {
					RegEl.register(
						element as HTMLElement | SVGElement | MathMLElement,
						this.#scopedState
					);
				});
		}
	};

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

	derive<K extends string, T>(
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

	build() {
		const state = proxy(this.#scopedState) as TState;

		// ui flag retained for backward-compat API shape; no global state side-effects (currentState removed)

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
