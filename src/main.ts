import { Effect } from "./Effect.ts";
import isEqual from "./equality.ts";
import serverPage from "./fetch.ts";

export type {
	FetchDOMOptions,
	FetchedContent,
	InsertContentMethod,
} from "./fetch.ts";

import { globalStores } from "./globalstores.ts";
import { proxy } from "./proxy.ts";
import RegEl from "./registry.ts";

export type IntermediateState = Record<string, unknown>;

export default class Manifold<TState extends IntermediateState> {
	#name?: string;
	#scopedState: TState;
	#derivations: Map<string, (store: IntermediateState) => unknown>;
	#built = false;
	static _current: Manifold<IntermediateState> | null = null;

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
	): Manifold<S> {
		return new Manifold<S>(name, initial);
	}

	// Static helpers to use as $.get/$.post/$.fetch without early initialization
	static get(
		url: string | URL,
		fetchOps?: RequestInit,
		defaultOps?: Omit<import("./fetch.ts").FetchDOMOptions, "to" | "method">,
	): import("./fetch.ts").FetchedContent {
		return serverPage.get(url, fetchOps, defaultOps);
	}

	static post(
		url: string | URL,
		fetchOps?: RequestInit,
		defaultOps?: Omit<import("./fetch.ts").FetchDOMOptions, "to" | "method">,
	): import("./fetch.ts").FetchedContent {
		return serverPage.post(url, fetchOps, defaultOps);
	}

	static fetch(
		url: string | URL,
		ops: import("./fetch.ts").FetchDOMOptions,
		fetchOps?: RequestInit,
	): Promise<void> {
		return serverPage.fetch(url, ops, fetchOps);
	}

	add<K extends string, V>(obj: Record<K, V>): Manifold<TState & Record<K, V>>;
	add<K extends string, V>(key: K, value: V): Manifold<TState & Record<K, V>>;
	add<K extends string, V>(
		keyOrObj: K | Record<K, V>,
		value?: V,
	): Manifold<TState & Record<K, V>> {
		// Handle object case
		if (typeof keyOrObj === "object" && keyOrObj !== null) {
			let intermediateState: Manifold<IntermediateState> = this;
			for (const [key, val] of Object.entries(keyOrObj)) {
				intermediateState = intermediateState.add(key as K, val as V);
			}
			return intermediateState as Manifold<TState & Record<K, V>>;
		}

		// Handle single key-value case
		return new Manifold(
			this.#name,
			{ ...this.#scopedState, [keyOrObj]: value },
			new Map(this.#derivations),
		) as Manifold<TState & Record<K, V>>;
	}

	derive<K extends string, T>(
		key: K,
		fn: (store: TState) => T,
	): Manifold<TState & Record<K, T>> {
		return new Manifold(
			this.#name,
			{ ...this.#scopedState },
			new Map(this.#derivations).set(
				key,
				fn as (store: IntermediateState) => unknown,
			),
		) as Manifold<TState & Record<K, T>>;
	}

	build(): TState {
		if (this.#built) throw "Multiple state builds unsupported";

		// Set as current instance for registry access
		Manifold._current = this;

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
		globalStores.set(this.#name, state);

		// Trigger registration for existing DOM elements by treating the entire document as "newly added"
		RegEl._handleExistingElements(this.#name);

		return state as TState;
	}
}
