import { Effect, type EffectDependency } from "./Effect.ts";
import isEqual from "./equality.ts";
import proxy from "./proxy.ts";
import RegEl from "./registry.ts";

export type StateConstraint = Record<string, unknown>;
export type FuncsConstraint = Record<string, (...args: never[]) => unknown>;

const effect = (fn: EffectDependency) => {
	const e = Effect.acquire(fn, false);
	e.run();
	return e;
};

type AnyStateBuilder = StateBuilder<
	Record<string, unknown>,
	Record<string, (...args: never[]) => unknown>
>;
const namedStores = new Map<
	string,
	{ builder: AnyStateBuilder; built?: Record<string, unknown> }
>();

class StateBuilder<
	TState extends StateConstraint,
	TFuncs extends FuncsConstraint
> {
	#scopedState: TState;
	#scopedFuncs: TFuncs;
	#derivations: Map<string, (store: StateConstraint) => unknown>;
	#name?: string;
	#builtState?: TState;
	#built = false;

	constructor(
		initialState?: TState,
		initialFuncs?: TFuncs,
		derivations?: Map<string, (store: StateConstraint) => unknown>,
		name?: string
	) {
		this.#scopedState = (initialState || {}) as TState;
		this.#scopedFuncs = (initialFuncs || {}) as TFuncs;
		this.#derivations = derivations || new Map();
		this.#name = name;
		if (name)
			namedStores.set(name, {
				builder: this as unknown as AnyStateBuilder,
			});
	}

	static create<S extends StateConstraint, F extends FuncsConstraint>(
		nameOrInitial?: string | S,
		initialStateOrFuncs?: S | F,
		maybeFuncs?: F
	): StateBuilder<S, F> {
		let name: string | undefined;
		let initialState: S | undefined;
		let funcs: F | undefined;
		if (typeof nameOrInitial === "string") {
			name = nameOrInitial;
			if (initialStateOrFuncs === undefined && maybeFuncs === undefined) {
				const existing = namedStores.get(name);
				if (existing)
					return existing.builder as unknown as StateBuilder<S, F>;
			}
			initialState = initialStateOrFuncs as S | undefined;
			funcs = maybeFuncs;
		} else {
			initialState = nameOrInitial as S | undefined;
			funcs = initialStateOrFuncs as F | undefined;
		}
		return new StateBuilder<S, F>(initialState, funcs, undefined, name);
	}

	static effect(fn: EffectDependency) {
		return effect(fn);
	}

	expose(_name?: string) {
		return this;
	}

	register = (container?: HTMLElement | SVGElement | MathMLElement) => {
		const ensureBuilt = () => {
			if (!this.#built) this.build();
			return this.#builtState as TState;
		};
		const ensureTopLevel = (el: Element) => {
			let cur: Element | null = el.parentElement;
			while (cur) {
				if (cur.hasAttribute("data-mf-ignore")) break;
				if (RegEl.isRegistered(cur)) {
					throw new Error(
						"Cannot register element: ancestor already registered. Use data-mf-ignore on an intermediate element to create a new boundary."
					);
				}
				cur = cur.parentElement;
			}
		};
		const bind = (el: Element, stateRef: Record<string, unknown>) => {
			ensureTopLevel(el);
			RegEl.register(
				el as HTMLElement | SVGElement | MathMLElement,
				stateRef
			);
		};
		if (container) {
			bind(container, ensureBuilt());
			return;
		}
		document.querySelectorAll("[data-mf-register]").forEach((el) => {
			const attr = el.getAttribute("data-mf-register") || "";
			let stateToUse: Record<string, unknown> | undefined;
			if (attr) {
				const named = namedStores.get(attr);
				if (!named)
					throw new Error(
						`No named state '${attr}' found for registration`
					);
				if (!named.built) {
					const { state } = named.builder.build();
					named.built = state;
				}
				stateToUse = named.built as Record<string, unknown>;
			} else {
				stateToUse = ensureBuilt();
			}
			if (!stateToUse) return;
			bind(el, stateToUse);
		});
	};

	add<K extends string, V>(
		key: K,
		value: V,
		sync?: () => void
	): StateBuilder<TState & Record<K, V>, TFuncs> {
		if (this.#built)
			throw new Error(
				"StateBuilder: add() cannot be called after build(); create a new builder or fork()"
			);
		const newState = { ...this.#scopedState, [key]: value } as TState &
			Record<K, V>;
		if (sync) sync();
		const next = new StateBuilder(
			newState,
			this.#scopedFuncs as TFuncs,
			this.#derivations,
			this.#name
		) as StateBuilder<TState & Record<K, V>, TFuncs>;
		if (this.#name)
			namedStores.set(this.#name, { builder: next as AnyStateBuilder });
		return next;
	}

	derive<K extends string, T>(
		key: K,
		fn: (store: TState) => T
	): StateBuilder<TState & Record<K, T>, TFuncs> {
		if (this.#built)
			throw new Error(
				"StateBuilder: derive() cannot be called after build(); create a new builder or fork()"
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
			newDerivations,
			this.#name
		) as StateBuilder<TState & Record<K, T>, TFuncs>;
		if (this.#name)
			namedStores.set(this.#name, { builder: next as AnyStateBuilder });
		return next;
	}

	fork<NS extends string>(newName?: NS) {
		if (!newName)
			throw new Error(
				"StateBuilder: fork(name) requires a non-empty name"
			);
		const base: Record<string, unknown> = {};
		const source = this.#built
			? (this.#builtState as Record<string, unknown>)
			: (this.#scopedState as Record<string, unknown>);
		for (const k of Object.keys(source)) {
			if (k === "__mfId") continue;
			base[k] = source[k];
		}
		return new StateBuilder(
			base as TState,
			this.#scopedFuncs,
			new Map(this.#derivations),
			newName as string
		);
	}

	build() {
		if (this.#built) {
			return {
				state: this.#builtState as TState,
				fork: (name: string) => this.fork(name),
			};
		}
		const state = proxy(this.#scopedState) as TState;
		for (const [key, deriveFn] of this.#derivations) {
			let prevVal = (deriveFn as (s: TState) => unknown)(state);
			(state as Record<string, unknown>)[key] = prevVal;
			effect(() => {
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
			});
		}
		if (this.#name) {
			const named = namedStores.get(this.#name);
			if (named) named.built = state;
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
		return { state, fork: (name: string) => this.fork(name) };
	}
}

export default StateBuilder;
