import { ComponentStateBuilder } from "./dom/component.ts";
import { fetchWithMethodFactory } from "./dom/fetch.ts";
import RegEl from "./dom/registry.ts";
import { Effect } from "./reactivity/effect.ts";
import isEqual from "./reactivity/equality.ts";
import { proxy } from "./reactivity/proxy.ts";

export type IntermediateState = Record<string, unknown>;

export class State<TState extends IntermediateState> {
	#name?: string;
	#scopedState: TState;
	#derivations: Map<string, (store: IntermediateState) => unknown>;
	#built = false;

	static globalStores = new Map<string | undefined, IntermediateState>();
	static _current: State<IntermediateState> | null = null;

	constructor(
		name?: string,
		initialState?: TState,
		derivations?: Map<string, (store: IntermediateState) => unknown>,
	) {
		this.#name = name;
		this.#scopedState = (initialState || {}) as TState;
		this.#derivations = derivations || new Map();
	}

	static create<S extends IntermediateState>(
		name?: string,
		initial?: S,
	): State<S> {
		return new State<S>(name, initial);
	}

	add<K extends string, V>(obj: Record<K, V>): State<TState & Record<K, V>>;
	add<K extends string, V>(key: K, value: V): State<TState & Record<K, V>>;
	add<K extends string, V>(
		keyOrObj: K | Record<K, V>,
		value?: V,
	): State<TState & Record<K, V>> {
		// Handle object case
		if (typeof keyOrObj === "object" && keyOrObj !== null) {
			let intermediateState: State<IntermediateState> = this;
			for (const [key, val] of Object.entries(keyOrObj)) {
				intermediateState = intermediateState.add(key as K, val as V);
			}
			return intermediateState as State<TState & Record<K, V>>;
		}

		// Handle single key-value case
		return new State(
			this.#name,
			{ ...this.#scopedState, [keyOrObj]: value },
			new Map(this.#derivations),
		) as State<TState & Record<K, V>>;
	}

	derive<K extends string, T>(
		key: K,
		fn: (store: TState) => T,
	): State<TState & Record<K, T>> {
		return new State(
			this.#name,
			{ ...this.#scopedState },
			new Map(this.#derivations).set(
				key,
				fn as (store: IntermediateState) => unknown,
			),
		) as State<TState & Record<K, T>>;
	}

	build(): TState {
		if (this.#built) throw "Multiple state builds unsupported";

		// Set as current instance for registry access
		State._current = this;

		const state = proxy(this.#scopedState) as TState;
		for (const [key, deriveFn] of this.#derivations) {
			// Compute once and establish dependencies
			let hasRun = false,
				prevVal: unknown;

			Effect._acquire(() => {
				const nextVal = deriveFn(state);
				if (hasRun && isEqual(prevVal, nextVal)) return;
				prevVal = nextVal;
				hasRun = true;
				(state as Record<string, unknown>)[key] = nextVal;
			})._run();
		}
		this.#built = true;

		// Register store globally for incremental registration
		State.globalStores.set(this.#name, state);

		// Trigger registration for existing DOM elements when DOM APIs exist
		if (typeof document !== "undefined") {
			RegEl._handleExistingElements(this.#name);
		}

		return state as TState;
	}

	/**
	 * Create a component (HTML-first: pass selector, TS/JS-first: pass config)
	 */
	static component<S extends IntermediateState = Record<string, never>>(
		selector: string,
	): ComponentStateBuilder<S>;
	static component<S extends IntermediateState>(config: {
		name: string;
		template: string;
		styles?: string;
		state?: S;
	}): ComponentStateBuilder<S>;
	static component<S extends IntermediateState>(
		selectorOrConfig:
			| string
			| {
					name: string;
					template: string;
					styles?: string;
					state?: S;
			  },
	): ComponentStateBuilder<S> {
		if (typeof selectorOrConfig === "string") {
			// HTML-first approach: find template by selector
			if (typeof document === "undefined") {
				throw new Error("component() with selector requires DOM");
			}
			const template =
				document.querySelector<HTMLTemplateElement>(selectorOrConfig);
			if (!template || template.tagName !== "TEMPLATE") {
				throw new Error(
					`No <template> found with selector: ${selectorOrConfig}`,
				);
			}
			return new ComponentStateBuilder<S>(template);
		}

		// TS/JS-first approach: use config object
		const { name, template: templateStr, styles, state } = selectorOrConfig;
		const templateFn = () => templateStr;
		const builder = new ComponentStateBuilder<S>(templateFn, name);

		if (styles) {
			builder._setStyles(styles);
		}

		if (name) {
			builder._setTagName(name);
		}

		if (state) {
			return builder.add(state);
		}

		return builder;
	}
}

export {
	ComponentStateBuilder,
	css,
	html,
	useComponent
} from "./dom/component.ts";
export { effect } from "./reactivity/effect.ts";

export const [mfGet, mfPost, mfPut, mfDelete, mfPatch, mfHead, mfOptions] = (
	["GET", "POST", "PUT", "DELETE", "PATCH", "HEAD", "OPTIONS"] as const
).map((m) => fetchWithMethodFactory(m));
