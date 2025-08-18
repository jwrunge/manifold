import { Effect, type EffectFn } from "./Effect.ts";
import isEqual from "./equality.ts";
import proxy from "./proxy.ts";
import RegEl from "./registry.ts";

export type StateConstraint = Record<string, unknown>;
export type FuncsConstraint = Record<string, (...args: never[]) => unknown>;

// Single-state enforcement
let __builderCreated = false;
// Track first built state globally for auto-registration convenience
let __globalState: Record<string, unknown> | undefined;
// Pending component roots to register once a state exists
const __pendingComponentRoots: Array<Element | ShadowRoot> = [];

// Helper: determine if an element needs registration (has :* or sync:*)
const __needsRegister = (el: Element): boolean => {
	const attrs = el.attributes;
	for (let i = 0; i < attrs.length; i++) {
		const n = attrs[i].name;
		if (n[0] === ":" || n.startsWith("sync:")) return true;
	}
	return false;
};
// Helper: register all elements under a root that need it; also register the
// root container(s) so text interpolation without directives still works.
const __registerSubtree = (
	root: Element | ShadowRoot,
	state: Record<string, unknown>
) => {
	if ((root as ShadowRoot).host !== undefined) {
		// ShadowRoot: register top-level element children so text is processed
		const sr = root as ShadowRoot;
		for (let i = 0; i < sr.children.length; i++) {
			RegEl.register(sr.children[i] as HTMLElement, state);
		}
	} else {
		// Element root: register it directly
		RegEl.register(root as HTMLElement, state);
	}
	const w = document.createTreeWalker(
		root,
		NodeFilter.SHOW_ELEMENT,
		undefined
	);
	while (w.nextNode()) {
		const cur = w.currentNode as Element;
		if (__needsRegister(cur)) RegEl.register(cur as HTMLElement, state);
	}
};

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

	static effect(fn: EffectFn) {
		const e = Effect.acquire(fn, false);
		e.run();
		return e;
	}

	// Minimal custom element factory
	static defineComponent(
		name: string,
		ops?: { shadow?: "open" | "closed" | false; selector?: string }
	): void {
		if (customElements.get(name)) return;
		class MFComponent extends HTMLElement {
			private _tpl: HTMLTemplateElement | null = null;
			private _shadow: ShadowRoot | null = null;
			constructor() {
				super();
			}
			connectedCallback() {
				// Resolve template lazily so parser-added children exist
				if (!this._tpl) {
					const fromSel = ops?.selector
						? (document.querySelector(
								ops.selector
						  ) as HTMLTemplateElement | null)
						: null;
					const childTpl = this.querySelector(
						"template"
					) as HTMLTemplateElement | null;
					if (fromSel) this._tpl = fromSel;
					else if (childTpl) this._tpl = childTpl;
					else {
						const t = document.createElement("template");
						t.innerHTML = this.innerHTML;
						this.innerHTML = "";
						this._tpl = t;
					}
				}
				if (ops?.shadow)
					this._shadow = this.attachShadow({ mode: ops.shadow });
				const root =
					(this._shadow as ShadowRoot | null) ||
					(this as unknown as Element);
				if (this._tpl)
					root.appendChild(this._tpl.content.cloneNode(true));
				// Mark host for auto-registration; build() will pick this up even if no state yet
				this.setAttribute("data-mf-register", "");
				const st = __globalState;
				if (st) __registerSubtree(root, st);
				else __pendingComponentRoots.push(root);
			}
		}
		customElements.define(name, MFComponent);
	}

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
		let state: TState;
		if (!this.#built) {
			state = proxy(this.#scopedState) as TState;
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
				(state as Record<string, unknown>)[key] = ((
					...args: unknown[]
				) =>
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
				// In tests, keep the first non-empty state as global unless none exists yet
				const isEmpty =
					!state ||
					Object.keys(state as Record<string, unknown>).length === 0;
				if (!__globalState || !isEmpty) {
					__globalState = state as unknown as Record<string, unknown>;
				}
			} else if (!__globalState) {
				__globalState = state as unknown as Record<string, unknown>;
			}
		} else {
			state = this.#builtState as TState;
		}
		// Auto-register on build: bind all [data-mf-register] regions to the first global state (or this one)
		const stateToUse =
			(__globalState as Record<string, unknown>) ||
			(state as unknown as Record<string, unknown>);
		if (typeof document !== "undefined") {
			// Restore correct selector so tests and runtime auto-registration work
			const nodes = document.querySelectorAll("[data-mf-register]");
			nodes.forEach((el) => {
				// If element was registered earlier with a different state (e.g., previous test),
				// dispose and re-register to bind to the latest state.
				// biome-ignore lint/suspicious/noExplicitAny: runtime check against internal registry
				const inst: any = (RegEl as any)._registry?.get?.(el);
				if (inst && inst._state !== stateToUse) inst.dispose?.();
				RegEl.register(
					el as HTMLElement | SVGElement | MathMLElement,
					stateToUse
				);
			});
			// Register any component roots that connected before a state existed
			if (__pendingComponentRoots.length) {
				for (const root of __pendingComponentRoots)
					__registerSubtree(root, stateToUse);
				__pendingComponentRoots.length = 0;
			}
		}
		// Return the state directly
		return state as TState;
	}
}

export default StateBuilder;
