declare module "mfld" {
    let P: any;
    let F: any;
    namespace L {
        /**!
        * - Create or overwrite a _typed_ global Manifold store by passing `store_ops` (`MfldOps`) -> *returns `Store\<T\>`*
        * - Retrieve an untyped reference to the store specified by name by omitting `store_ops` -> *returns `Store\<any\>`*
        * @template T
        * @param {string} store_name
        * @param {StoreOptions<T> | T} store_ops
        * @return {Store<T>}
        */
        function store<T>(store_name: string, store_ops: any): Store<T>;
        /**!
        * - Create or overwrite an untyped global Manifold store by passing `store_ops` (`MfldOps`) -> *returns `Store\<any\>`*
        * - Retrieve an untyped reference to the store specified by name by omitting `store_ops` -> *returns `Store\<any\>`*
        * @param {string} store_name
        * @param {StoreOptions<any> | any} store_ops
        * @return {Store<any>}
        */
        function ustore(store_name: string, store_ops: any): Store<any>;
        /**!
         * - Add functions to the Manifold function registry in key-value pairs.
         * - Functions must be registered in order to be accessible to HTML elements via `mfBind`, `mfSync`, and `mfResolve`.
         * - It may still be beneficial to keep a reference to the original function if you need to preserve type information.
         * @param {{ [key: string]: MfldFunc }} funcs
         */
        function funcs(funcs: {
            [key: string]: MfldFunc;
        }): void;
        /**!
         * - Set Manifold configuration options, including `trans` (DOM transition settings), `fetch` (fetch options), and `profiles` (configuration option overrides that can be set on elements ad-hoc via `mfOverrides`).
         * - Providing the optional `profileName` parameter allows you to save the configuration as a named profile. Otherwise, the profile is saved as the default configuration.
         * @param {MfldOps} new_ops
         * @param {string} [profile_name]
         */
        function config(new_ops: MfldOps, profile_name?: string): any;
        /**!
          * - Wait for the next Manifold data update cycle to complete before executing the callback function.
          * @param {()=> void} cb
          */
        function onTick(t: any): void;
        /**!
         * - Register Manifold subscriptions on the DOM. *Optional:* Pass an `HTMLElement` or selector string to scope the registration to a specific element.
         * @param {HTMLElement | string | null} [parent]
         */
        function register(t: any): void;
    }
    function N(e: any): Promise<void>;
    function D(t: any, e: any): void;
    export { P as $fn, F as $st, L as Mfld, N as component, D as makeComponent };
}
