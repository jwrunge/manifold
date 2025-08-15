import { Effect, type EffectDependency } from "./Effect.ts";
import isEqual from "./equality.ts";
import proxy from "./proxy.ts";
import RegEl from "./registry.ts";

export type StateConstraint = Record<string, unknown>;
export type FuncsConstraint = Record<string, (...args: never[]) => unknown>;

// Single-state enforcement
let __builderCreated = false;
// Track first built state globally for auto-registration convenience
let __globalState: Record<string, unknown> | undefined;

class StateBuilder<
	TState extends StateConstraint,
	TFuncs extends FuncsConstraint
> {
	#scopedState: TState;
	#scopedFuncs: TFuncs;
	#derivations: Map<string, (store: StateConstraint) => unknown>;
	#builtState?: TState;
	#built = false;

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
		initial?: S,
		funcs?: F
	): StateBuilder<S, F> {
		// Enforce single-state except in test environment to keep unit tests isolated
		const penv = (
			globalThis as unknown as {
				process?: { env?: { NODE_ENV?: string } };
			}
		).process?.env;
		const env = penv?.NODE_ENV;
		if (__builderCreated && env !== "test")
			throw new Error("Only one state can be created");
		__builderCreated = true;
		return new StateBuilder<S, F>(initial, funcs);
	}

	static effect(fn: EffectDependency) {
		const e = Effect.acquire(fn, false);
		e.run();
		return e;
	}

	expose(_name?: string) {
		return this;
	}

	register = (container?: HTMLElement | SVGElement | MathMLElement) => {
		const ensureBuilt = () => {
			if (!this.#built) this.build();
			return this.#builtState as TState;
		};
		const bind = (el: Element, stateRef: Record<string, unknown>) => {
			RegEl.register(
				el as HTMLElement | SVGElement | MathMLElement,
				stateRef
			);
		};
		if (container) {
			// Explicit container binding uses this builder's state (build if needed)
			bind(container, ensureBuilt());
			return;
		}
		// Auto-registration: prefer the first built global state if available
		const stateToUse =
			(__globalState as Record<string, unknown>) || ensureBuilt();
		document
			.querySelectorAll("[data-mf-register]")
			.forEach((el) => bind(el, stateToUse));
	};

	add<K extends string, V>(
		key: K,
		value: V,
		sync?: () => void
	): StateBuilder<TState & Record<K, V>, TFuncs> {
		if (this.#built)
			throw new Error(
				"StateBuilder: add() cannot be called after build(); create a new builder"
			);
		const newState = { ...this.#scopedState, [key]: value } as TState &
			Record<K, V>;
		if (sync) sync();
		const next = new StateBuilder(
			newState,
			this.#scopedFuncs as TFuncs,
			this.#derivations
		) as StateBuilder<TState & Record<K, V>, TFuncs>;
		return next;
	}

	derive<K extends string, T>(
		key: K,
		fn: (store: TState) => T
	): StateBuilder<TState & Record<K, T>, TFuncs> {
		if (this.#built)
			throw new Error(
				"StateBuilder: derive() cannot be called after build(); create a new builder"
			);
		const newState = {
			...this.#scopedState,
			[key]: undefined as T,
		} as TState & Record<K, T>;
		const newDerivations = new Map(this.#derivations);
		newDerivations.set(key, fn as (store: StateConstraint) => unknown);
		const next = new StateBuilder(
			newState,
			this.#scopedFuncs,
			newDerivations
		) as StateBuilder<TState & Record<K, T>, TFuncs>;
		return next;
	}

	build() {
		if (this.#built) {
			return {
				state: this.#builtState as TState,
			};
		}
		const state = proxy(this.#scopedState) as TState;
		for (const [key, deriveFn] of this.#derivations) {
			let prevVal = (deriveFn as (s: TState) => unknown)(state);
			(state as Record<string, unknown>)[key] = prevVal;
			const e = Effect.acquire(() => {
				const nextVal = (deriveFn as (s: TState) => unknown)(state);
				if (nextVal === prevVal) return;
				const bothObjects =
					prevVal &&
					nextVal &&
					typeof prevVal === "object" &&
					typeof nextVal === "object";
				if (bothObjects && isEqual(prevVal, nextVal)) return;
				prevVal = nextVal;
				(state as Record<string, unknown>)[key] = nextVal;
			}, false);
			e.run();
		}
		for (const [key, fn] of Object.entries(this.#scopedFuncs)) {
			(state as Record<string, unknown>)[key] = ((...args: unknown[]) =>
				(fn as (...a: unknown[]) => unknown).apply(
					state,
					args
				)) as unknown as TState[Extract<keyof TState, string>];
		}
		this.#builtState = state;
		this.#built = true;
		// Preserve/refresh the global app state pointer:
		// - In normal envs, set once (single-state model)
		// - In test env, always refresh so tests can build isolated states
		const penv = (
			globalThis as unknown as {
				process?: { env?: { NODE_ENV?: string } };
			}
		).process?.env;
		const env = penv?.NODE_ENV;
		if (env === "test") {
			__globalState = state as unknown as Record<string, unknown>;
		} else if (!__globalState) {
			__globalState = state as unknown as Record<string, unknown>;
		}
		return { state } as { state: TState };
	}
}

export default StateBuilder;
