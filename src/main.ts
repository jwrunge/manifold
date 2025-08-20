import { Effect, type EffectFn } from "./Effect.ts";
import isEqual from "./equality.ts";
import proxy from "./proxy.ts";
import RegEl from "./registry.ts";

export type StateConstraint = Record<string, unknown>;

class StateBuilder<TState extends StateConstraint> {
	#scopedState: TState;
	#derivations: Map<string, (store: StateConstraint) => unknown>;
	#built = false;

	constructor(
		initialState?: TState,
		derivations?: Map<string, (store: StateConstraint) => unknown>
	) {
		this.#scopedState = (initialState || {}) as TState;
		this.#derivations = derivations || new Map();
	}

	static create<S extends StateConstraint>(initial?: S): StateBuilder<S> {
		return new StateBuilder<S>(initial);
	}

	static effect(fn: EffectFn) {
		const e = Effect.acquire(fn);
		e.run();
		return e;
	}

	add<K extends string, V>(
		key: K,
		value: V
	): StateBuilder<TState & Record<K, V>> {
		return new StateBuilder(
			{ ...this.#scopedState, [key]: value },
			new Map(this.#derivations)
		) as StateBuilder<TState & Record<K, V>>;
	}

	derive<K extends string, T>(
		key: K,
		fn: (store: TState) => T
	): StateBuilder<TState & Record<K, T>> {
		return new StateBuilder(
			{ ...this.#scopedState },
			new Map(this.#derivations).set(
				key,
				fn as (store: StateConstraint) => unknown
			)
		) as StateBuilder<TState & Record<K, T>>;
	}

	build() {
		if (this.#built) throw "Multiple state builds unsupported";

		const state = proxy(this.#scopedState) as TState;
		for (const [key, deriveFn] of this.#derivations) {
			// Seed inside effect to compute once and establish dependencies
			let hasRun = false,
				prevVal: unknown;

			Effect.acquire(() => {
				const nextVal = deriveFn(state);
				if (hasRun && isEqual(prevVal, nextVal)) return;
				prevVal = nextVal;
				hasRun = true;
				(state as Record<string, unknown>)[key] = nextVal;
			}).run();
		}
		this.#built = true;

		// Auto-register on build: bind all [data-mf-register] regions to the global state
		for (const el of document?.querySelectorAll("[data-mf-register]") ?? [])
			RegEl.register(
				el as HTMLElement | SVGElement | MathMLElement,
				this.#scopedState
			);

		return state as TState;
	}
}

export default StateBuilder;
