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
// Pending component roots to register once a state exists (keeps local overlay state)
const __pendingComponentRoots = new Map<
	Element | ShadowRoot,
	{ base: Record<string, unknown>; local: Record<string, unknown> }
>();

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

	// Minimal custom element factory with typed props and runtime attr->prop mapping
	static defineComponent<Props extends StateConstraint = StateConstraint>(
		name: string,
		ops?: {
			shadow?: "open" | "closed" | false;
			selector?: string;
			// Map HTML attribute name -> prop name. Defaults to kebab-case -> camelCase
			attrMap?: Record<string, string>;
			// Optional coercion from attribute string to prop value
			toProp?: (attr: string, value: string | null) => unknown;
			// Optional list of element property names to expose as accessors on the host
			props?: Array<keyof Props & string>;
		}
	): CustomElementConstructor & { new (): HTMLElement & Props } {
		if (customElements.get(name))
			return customElements.get(
				name
			) as unknown as CustomElementConstructor & {
				new (): HTMLElement & Props;
			};

		const toCamel = (s: string) =>
			s.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase());
		const coerce = (attr: string, v: string | null): unknown => {
			if (ops?.toProp) return ops.toProp(attr, v);
			if (v == null) return null;
			if (v === "") return true;
			if (v === "true") return true;
			if (v === "false") return false;
			// number-like
			if (/^[+-]?\d+(?:\.\d+)?$/.test(v)) return Number(v);
			// simple JSON-like
			if (
				(v.startsWith("{") && v.endsWith("}")) ||
				(v.startsWith("[") && v.endsWith("]"))
			) {
				try {
					return JSON.parse(v);
				} catch {
					return v;
				}
			}
			return v;
		};

		class MFComponent extends HTMLElement {
			#tpl: HTMLTemplateElement | null = null;
			#shadow: ShadowRoot | null = null;
			#base: Record<string, unknown> | null = null;
			#state: Record<string, unknown> | null = null;
			#mo: MutationObserver | null = null;

			connectedCallback() {
				// Resolve template lazily so parser-added children exist
				if (!this.#tpl) {
					const fromSel = ops?.selector
						? (document.querySelector(
								ops.selector
						  ) as HTMLTemplateElement | null)
						: null;
					const childTpl = this.querySelector(
						"template"
					) as HTMLTemplateElement | null;
					if (fromSel) this.#tpl = fromSel;
					else if (childTpl) this.#tpl = childTpl;
					else {
						const t = document.createElement("template");
						t.innerHTML = this.innerHTML;
						this.innerHTML = "";
						this.#tpl = t;
					}
				}
				if (ops?.shadow)
					this.#shadow = this.attachShadow({ mode: ops.shadow });
				const root =
					(this.#shadow as ShadowRoot | null) ||
					(this as unknown as Element);
				if (this.#tpl)
					root.appendChild(this.#tpl.content.cloneNode(true));

				// Build a local reactive overlay that prototypes the global state
				const parent =
					(__globalState as Record<string, unknown>) || null;
				this.#base = Object.create(parent) as Record<string, unknown>;
				this.#state = proxy(this.#base) as Record<string, unknown>;

				// Define accessors for declared props to interop with imperative usage
				if (ops?.props) {
					for (const key of ops.props) {
						if (!(key in this)) {
							Object.defineProperty(this, key, {
								get: () =>
									(this.#state as Record<string, unknown>)[
										key as string
									],
								set: (v: unknown) => {
									if (this.#state)
										(
											this.#state as Record<
												string,
												unknown
											>
										)[key as string] = v as unknown;
								},
								configurable: true,
								enumerable: true,
							});
						}
					}
				}

				// Initialize props from current attributes
				const attrs = this.attributes;
				for (let i = 0; i < attrs.length; i++) {
					const a = attrs[i];
					const prop = (ops?.attrMap?.[a.name] ||
						toCamel(a.name)) as string;
					(this.#state as Record<string, unknown>)[prop] = coerce(
						a.name,
						a.value
					);
				}

				// Mark host for auto-registration
				this.setAttribute("data-mf-register", "");

				// Keep overlay for later global state availability or rebinding
				__pendingComponentRoots.set(root, {
					base: this.#base as Record<string, unknown>,
					local: this.#state as Record<string, unknown>,
				});

				// If a state exists now, register immediately with the overlay
				if (__globalState)
					__registerSubtree(
						root,
						this.#state as Record<string, unknown>
					);

				// Watch attribute changes at runtime and update props reactively
				this.#mo = new MutationObserver((ml) => {
					for (const m of ml) {
						if (m.type !== "attributes" || !m.attributeName)
							continue;
						const n = m.attributeName;
						const prop = (ops?.attrMap?.[n] ||
							toCamel(n)) as string;
						(this.#state as Record<string, unknown>)[prop] = coerce(
							n,
							this.getAttribute(n)
						);
					}
				});
				this.#mo.observe(this, { attributes: true });
			}

			disconnectedCallback() {
				this.#mo?.disconnect();
				this.#mo = null;
				// Remove from pending map to avoid stale rebinds
				const root =
					(this.#shadow as ShadowRoot | null) ||
					(this as unknown as Element);
				__pendingComponentRoots.delete(root);
				// Dispose any existing registration bound to this host
				// biome-ignore lint/suspicious/noExplicitAny: internal registry access for cleanup
				const inst: any = (RegEl as any)._registry?.get?.(root);
				inst?.dispose?.();
			}
		}
		customElements.define(name, MFComponent);
		return MFComponent as unknown as CustomElementConstructor & {
			new (): HTMLElement & Props;
		};
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
			// Register any component roots (with overlays) that connected before or need rebinding
			if (__pendingComponentRoots.size) {
				for (const [root, pair] of __pendingComponentRoots) {
					Object.setPrototypeOf(pair.base, stateToUse);
					__registerSubtree(root, pair.local);
				}
				__pendingComponentRoots.clear();
			}
		}
		// Return the state directly
		return state as TState;
	}
}

export default StateBuilder;
