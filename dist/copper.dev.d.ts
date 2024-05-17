declare module "@jwrunge/copper/dev" {
    export { $ as Cu };
    /**
     * !
     */
    export type HookKey = "in-start" | "in-end" | "out-start" | "out-end";
    /**
     * !
     */
    export type ExternalOptions = {
        /**
         * - The domain name these settings apply to
         */
        domain: string;
        /**
         * - Allow scripts from this domain to execute
         */
        scripts?: boolean;
        /**
         * - Allow styles from this domain to apply
         */
        styles?: boolean;
    };
    /**
     * !
     */
    export type FetchOptions = {
        /**
         * - Fetch request options
         */
        request?: RequestInit;
        /**
         * - Response type (default: "text")
         */
        type?: "json" | "text";
        /**
         * - Callback function - run on successful fetch; *val* is the un-parsed response body
         */
        cb?: (val: any) => void;
        /**
         * - Error callback - run on fetch error
         */
        err?: (err: Error) => void;
        /**
         * - Callback function - run on fetch response code; return `false` to prevent further processing
         */
        onCode?: (code: number) => boolean | void;
        /**
         * - Automatically fetch content on page load
         */
        auto?: boolean;
        /**
         * - External domain fetch settings
         */
        externals?: ExternalOptions[];
    };
    /**
     * !
     */
    export type TransitionOptions = {
        /**
         * - CSS class applied to transitions (default: `cu-trans`)
         */
        class?: string;
        /**
         * - Transition duration: [in, out] or single value (in ms); default: 300
         */
        dur?: [number, number] | number;
        /**
         * - Swap delay (in ms) - applied between one element's outro start and the replacement's intro start; default: 0
         */
        swap?: number;
        /**
         * - Transition hooks
         */
        hooks?: {
            "in-start"?: (el: HTMLElement) => void;
            "in-end"?: (el: HTMLElement) => void;
            "out-start"?: (el: HTMLElement) => void;
            "out-end"?: (el: HTMLElement) => void;
        };
    };
    /**
     * !
     * Copper options for `fetch`, `trans`, and `profiles`.
     */
    export type CuOps = {
        /**
         * - Fetch profiles assignable to elements
         */
        profiles?: {
            [key: string]: Partial<CuOps>;
        };
        /**
         * - Fetch options - see https://google.com
         */
        fetch?: FetchOptions;
        /**
         * - Transition settings - see https://google.com
         */
        trans?: TransitionOptions;
    };
    /**
     * !
     */
    export type UpdaterFunction<T> = (upstreamValues: Array<any>, value: T) => T;
    /**
     * !
     */
    export type StoreOptions<T> = {
        value?: T;
        upstream?: Array<string>;
        updater?: UpdaterFunction<T>;
    };
    /**
     * !
     */
    export type Store<T> = {
        /**
         * - The store's current value (read only)
         */
        value: T;
        /**
         * - Update the store's current value
         */
        update: (arg0: T) => Promise<T | undefined>;
        /**
         * - Add a subscription function to the store
         */
        sub: (arg0: (arg0: T) => void) => void;
    };
    /**
     * !
     */
    export type CuFunc = Function;
    namespace $ {
        /**!
        * - Create or overwrite a _typed_ global Copper store by passing `store_ops` (`CuOps`) -> *returns `Store\<T\>`*
        * - Retrieve an untyped reference to the store specified by name by omitting `store_ops` -> *returns `Store\<any\>`*
        * @template T
        * @param {string} store_name
        * @param {StoreOptions<T>} [store_ops]
        * @return {Store<T>}
        */
        function store<T>(store_name: string, store_ops?: StoreOptions<T>): Store<T>;
        /**!
        * - Create or overwrite an untyped global Copper store by passing `store_ops` (`CuOps`) -> *returns `Store\<any\>`*
        * - Retrieve an untyped reference to the store specified by name by omitting `store_ops` -> *returns `Store\<any\>`*
        * @param {string} store_name
        * @param {StoreOptions<any>} [store_ops]
        * @return {Store<any>}
        */
        function ustore(store_name: string, store_ops?: StoreOptions<any>): Store<any>;
        /**!
         * - Retrieve a Copper function by name. *val* refers to the store's current value; *el* refers to the element that triggered the update (if applicable). *returns `CuFunc`*
         * - *Note:* Functions retrived using this method cannot infer the type of the store's value and is therefore **not** type-checked. It is preferable to keep a reference to the function if you need to preserve type information.
         * @param {string} func_name
         * @return {CuFunc}
         */
        function getFunc(func_name: string): Function;
        /**!
         * - Add functions to the Copper function registry in key-value pairs.
         * - Functions must be registered in order to be accessible to HTML elements via `bind`, `sync`, and `resolve`.
         * - It may still be beneficial to keep a reference to the original function if you need to preserve type information.
         * @param {{ [key: string]: CuFunc }} funcs
         */
        function addFuncs(funcs: {
            [key: string]: Function;
        }): void;
        /**!
         * - Set Copper configuration options, including `trans` (DOM transition settings), `fetch` (fetch options), and `profiles` (configuration option overrides that can be set on elements ad-hoc via `cu-overrides`).
         * - Providing the optional `profileName` parameter allows you to save the configuration as a named profile. Otherwise, the profile is saved as the default configuration.
         * @param {CuOps} new_ops
         * @param {string} [profile_name]
         */
        function config(new_ops: CuOps, profile_name?: string): void;
        /**!
          * - Wait for the next Copper data update cycle to complete before executing the callback function.
          * @param {()=> void} cb
          */
        function tick(t: any): void;
    }
}
