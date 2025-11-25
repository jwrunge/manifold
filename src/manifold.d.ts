export type InsertContentMethod = "append" | "prepend" | "replace";

export interface FetchDOMOptions {
	from?: string;
	to: string;
	method: InsertContentMethod;
	insertScripts?: boolean | string[];
	insertStyles?: boolean | string[];
	addTransitionClass?: string;
}

export type FetchMergeOptions = Omit<FetchDOMOptions, "to" | "method">;

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
 * Create and manage Manifold state
 * @example
 * ```ts
 * import Manifold from "manifoldjs";
 *
 * const $ = Manifold.create("app", { count: 2 });
 * $.derive("doubleCount", (state) => state.count * 2);
 *
 * const state = $.build();
 *
 * console.log(state.count); // 2
 * console.log(state.doubleCount); // 4
 */
export default class Manifold<TState extends IntermediateState = IntermediateState> {
	/**
	 * Create a new Manifold intermediate state (finish with .build())
	 * @param name Optional scope name for registry; an unnamed state registry is equal to "default"
	 * @param initial Optional initial state object; defaults to {}
	 */
	static create<S extends IntermediateState>(
		name?: string,
		initial?: S,
	): Manifold<S>;

	/**
	 * Fetch a URL with GET and optionally insert the content into the DOM
	 * @param url The URL to fetch
	 * @param fetchOps RequestInit options for the fetch call
	 * @example
	 * // In your state:
	 * const state = Manifold.create()
	 * 	.add("loadSnippet", () => {
	 *		Manifold.get("/api/snippet.html").replace("#content", {
	 * 			from: "#payload",
	 * 			addTransitionClass: "fade",
	 * 		});
	 *	})
	 * 	.build();
	 * 
	 * // In your HTML:
	 * <div id="content"></div>
	 * <button :onclick="loadSnippet()">Load Content</button>
	 * 
	 * @example
	 * //Or use directly in expressions
	 * <button :onclick="$.get('/snippets/header.html').append('#main')">Load Header</button>
	 */
	static get(
		url: string | URL,
		fetchOps?: RequestInit,
		defaultOps?: FetchMergeOptions,
	): FetchedContent;

	/**
	 * Fetch a URL with POST and optionally insert the content into the DOM
	 * @param url The URL to fetch
	 * @param fetchOps RequestInit options for the fetch call
	 * @example
	 * // In your state:
	 * const state = Manifold.create()
	 * 	.add("loadSnippet", () => {
	 *		Manifold.post("/api/snippet.html", { body: JSON.stringify(myBody) }).replace("#content", {
	 * 			from: "#payload",
	 * 			addTransitionClass: "fade",
	 * 		});
	 *	})
	 * 	.build();
	 * 
	 * // In your HTML:
	 * <div id="content"></div>
	 * <button :onclick="loadSnippet()">Load Content</button>
	 * 
	 * @example
	 * //Or use directly in expressions
	 * <button :onclick="$.post('/snippets/header.html', { body: JSON.stringify(myBody) }).append('#main')">Load Header</button>
	 */
	static post(
		url: string | URL,
		fetchOps?: RequestInit,
		defaultOps?: FetchMergeOptions,
	): FetchedContent;

	/**
	 * Fetch a URL with an unspecified method and optionally insert the content into the DOM.
	 * This is equal to using Manifold.get if fetchOps.method is "GET" or undefined, but allows
	 * specifying other HTTP methods like "PUT", "DELETE, etc.
	 * @param url The URL to fetch
	 * @param fetchOps RequestInit options for the fetch call
	 * @example
	 * // In your state:
	 * const state = Manifold.create()
	 * 	.add("loadSnippet", () => {
	 *		Manifold.fetch("/api/snippet.html", { method: "DELETE"} ).replace("#content", {
	 * 			from: "#payload",
	 * 			addTransitionClass: "fade",
	 * 		});
	 *	})
	 * 	.build();
	 * 
	 * // In your HTML:
	 * <div id="content"></div>
	 * <button :onclick="loadSnippet()">Load Content</button>
	 * 
	 * @example
	 * //Or use directly in expressions
	 * <button :onclick="$.fetch('/snippets/header.html', { method: "DELETE"} ).append('#main')">Load Header</button>
	 */
	static fetch(
		url: string | URL,
		ops: FetchDOMOptions,
		fetchOps?: RequestInit,
	): Promise<void>;

	/**
	 * Add new state variables to the intermediate state
	 * @param key The string key acting as your state variable's name
	 * @param value The value of your state variable
	 * 
	 * Alternatively, you can pass an object with multiple key-value pairs to add several state variables at once
	 * @param obj An object containing key-value pairs to add to the state
	 * 
	 * @example
	 * const myComplexState = {
	 * 	name: "Manifold",
	 * 	status: Statuses.Awesome,
	 * 	users: 1,000,000,000
	 * }
	 * 
	 * const myFn = ()=> "Hello, World!";
	 * 
	 * const state = Manifold.create()
	 * 	.add("count", 0)
	 * 	.add({
	 * 		name: "Manifold",
	 * 		enabled: true,
	 * 	})
	 * 	.add("extra", myComplexState)
	 *  .add({ myFn })
	 * 	.build();
	 * 
	 * console.log(state.count); // 0
	 * console.log(state.name); // "Manifold"
	 * console.log(state.enabled); // true
	 * console.log(state.extra.name); // "Manifold"
	 * console.log(state.myFn()); // "Hello, World!"
	 */
	add<TAdd extends IntermediateState>(obj: TAdd): Manifold<TState & TAdd>;
	add<K extends string, V>(key: K, value: V): Manifold<TState & Record<K, V>>;

	/**
	 * Derive (or "compute") read-only reactive state variables from existing state
	 * @param key The string key acting as your state variable's name
	 * @param fn The derivation function that computes the value based on the current state
	 */
	derive<K extends string, TValue>(
		key: K,
		fn: (store: TState) => TValue,
	): Manifold<TState & Record<K, TValue>>;

	/**
	 * Finalize and build the intermediate state into a fully-typed and usable state object
	 * @returns The finalized state object
	 */
	build(): TState;
}

