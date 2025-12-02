export type InsertContentMethod = "append" | "prepend" | "replace";

/**
 * Options for fetching and inserting DOM content
 * @param from Optional CSS selector to extract content from within the fetched document
 * @param to CSS selector of the target element where the content will be inserted
 * @param method The method of inserting content: "append", "prepend", or "replace"
 * @param insertScripts Whether to insert <script> tags from the fetched content; can be true, false, or an array of specific script src URLs to include
 * @param insertStyles Whether to insert <link rel="stylesheet"> and <style> tags from the fetched content; can be true, false, or an array of specific stylesheet href URLs to include
 * @param addTransitionClass Optional CSS class name to add to the inserted content for transition effects
 */
export interface FetchDOMOptions {
	from?: string;
	to: string;
	method: InsertContentMethod;
	insertScripts?: boolean | string[];
	insertStyles?: boolean | string[];
	addTransitionClass?: string;
}

/**
 * Options for merging fetched content into the DOM
 * @param from Optional CSS selector to extract content from within the fetched document
 * @param insertScripts Whether to insert <script> tags from the fetched content; can be true, false, or an array of specific script src URLs to include
 * @param insertStyles Whether to insert <link rel="stylesheet"> and <style> tags from the fetched content; can be true, false, or an array of specific stylesheet href URLs to include
 * @param addTransitionClass Optional CSS class name to add to the inserted content for transition effects
 * @example
 * const mergeOptions: FetchMergeOptions = {
 *   from: "#payload",
 *   insertScripts: true,
 *   addTransitionClass: "fade-in",
 * };
 *
 * // Used with FetchedContent methods:
 * const fetched = new FetchedContent("/api/snippet.html");
 * await fetched.append("#content", mergeOptions);
 */
export type FetchMergeOptions = Omit<FetchDOMOptions, "to" | "method">;

/**
 * Represents content fetched from a URL, with methods to optionally insert it into the DOM.
 * @example
 * // Fetch content and append it to a target element
 * const fetched = new FetchedContent("/api/snippet.html");
 * await fetched.append("#content", { from: "#payload" });
 */
export declare class FetchedContent {
	constructor(
		url: string | URL,
		fetchOps?: RequestInit,
		defaultOps?: FetchMergeOptions,
	);
	replace(to: string, ops?: FetchMergeOptions): Promise<void>;
	append(to: string, ops?: FetchMergeOptions): Promise<void>;
	prepend(to: string, ops?: FetchMergeOptions): Promise<void>;
}

export type IntermediateState = Record<string, unknown>;

/**
 * Create and manage reactive Manifold state via the fluent builder API.
 * @example
 * ```ts
 * import { State } from "@jwrunge/manifold";
 *
 * const $ = State.create("dashboard", { count: 2 })
 * 	.add("increment", () => ++state.count)
 * 	.add("reset", () => (state.count = 0))
 * 	.derive("doubleCount", (store) => store.count * 2);
 *
 * const state = $.build();
 *
 * console.log(state.count); // 2
 * console.log(state.doubleCount); // 4
 * state.increment();
 * console.log(state.count); // 3
 * ```
 *
 * ```html
 * <div data-mf-register>
 * 	<p>Count: &dollar;{count}</p>
 * 	<p>Double: &dollar;{doubleCount}</p>
 * 	<button :onclick="increment()">Increment</button>
 * 	<button :onclick="reset()">Reset</button>
 * </div>
 * ```
 */
export declare class State<
	TState extends IntermediateState = IntermediateState,
> {
	/**
	 * Create a new intermediate state (finish with .build()).
	 * @param name Optional scope name for registry; unnamed states use "default".
	 * @param initial Optional initial state object; defaults to {}.
	 */
	static create<S extends IntermediateState>(
		name?: string,
		initial?: S,
	): State<S>;

	/**
	 * Add new state variables to the intermediate state, either one key at a time
	 * or via an object literal containing multiple entries.
	 * @example
	 * ```ts
	 * const myFn = () => "Hello, World!";
	 *
	 * const state = State.create()
	 * 	.add("count", 0)
	 * 	.add({
	 * 		name: "Manifold",
	 * 		enabled: true,
	 * 	})
	 * 	.add("extra", { users: 1_000_000 })
	 * 	.add({ myFn })
	 * 	.build();
	 *
	 * console.log(state.count); // 0
	 * console.log(state.name); // "Manifold"
	 * console.log(state.enabled); // true
	 * console.log(state.extra.users); // 1000000
	 * console.log(state.myFn()); // "Hello, World!"
	 * ```
	 */
	add<TAdd extends IntermediateState>(obj: TAdd): State<TState & TAdd>;
	add<K extends string, V>(key: K, value: V): State<TState & Record<K, V>>;

	/**
	 * Derive read-only reactive state variables from existing state.
	 * @example
	 * ```ts
	 * const $ = State.create("cart", { subtotal: 42 })
	 * 	.derive("tax", (store) => store.subtotal * 0.08)
	 * 	.derive("total", (store) => store.subtotal + store.tax);
	 * const state = $.build();
	 * console.log(state.total); // 45.36
	 * ```
	 */
	derive<K extends string, TValue>(
		key: K,
		fn: (store: TState) => TValue,
	): State<TState & Record<K, TValue>>;

	/**
	 * Finalize and build the intermediate state into a fully-typed object.
	 * This triggers DOM registration for any matching `data-mf-register` elements.
	 */
	build(): TState;
}

/**
 * Run a side-effect function that automatically tracks and reacts to state changes.
 * @param fn ()=> void
 */
export declare function effect(fn: () => void): void;

/**
 * Fetch a URL with GET and optionally insert the fetched markup.
 * @example
 * ```ts
 * import { State, get } from "@jwrunge/manifold";
 *
 * const state = State.create()
 * 	.add("loadSnippet", () =>
 * 		get("/snippets/header.html").replace("#content", {
 * 			from: "#payload",
 * 			addTransitionClass: "fade",
 * 		}),
 * 	)
 * 	.build();
 * ```
 *
 * ```html
 * <div id="content"></div>
 * <button :onclick="loadSnippet()">Load Content</button>
 * ```
 */
export declare function get(
	url: string | URL,
	fetchOps?: RequestInit,
	defaultOps?: FetchMergeOptions,
): FetchedContent;

/**
 * Fetch a URL with POST and optionally merge the response into the DOM.
 * @example
 * ```ts
 * import { State, post } from "@jwrunge/manifold";
 *
 * const state = State.create()
 * 	.add("submitForm", (payload: unknown) =>
 * 		post("/api/preview", { body: JSON.stringify(payload) }).append(
 * 			"#preview",
 * 			{ from: "#payload" },
 * 		),
 * 	)
 * 	.build();
 * ```
 */
export declare function post(
	url: string | URL,
	fetchOps?: RequestInit,
	defaultOps?: FetchMergeOptions,
): FetchedContent;

/**
 * Low-level helper to fetch with arbitrary methods using DOM merge options directly.
 * @example
 * ```ts
 * import { fetch } from "@jwrunge/manifold";
 *
 * await fetch("/snippets/header.html", { to: "#main", method: "append" }, {
 * 	method: "PUT",
 * 	headers: { "x-preview": "true" },
 * });
 * ```
 */
export declare function fetch(
	url: string | URL,
	ops: FetchDOMOptions,
	fetchOps?: RequestInit,
): Promise<void>;
