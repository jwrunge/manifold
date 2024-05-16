import { _store, _funcs, _stores } from "./store.mjs";
import { _registerSubs, _setOptions } from "./domRegistrar.mjs";

/**! @typedef {"in-start"|"in-end"|"out-start"|"out-end"} HookKey*/

/**!
 * @typedef {object} ExternalOptions
 * @property {string} domain - The domain name these settings apply to
 * @property {boolean} [scripts] - Allow scripts from this domain to execute
 * @property {boolean} [styles] - Allow styles from this domain to apply
 */

/**!
 * @typedef {object} FetchOptions
 * @property {RequestInit} [request] - Fetch request options
 * @property {"json"|"text"} [type] - Response type (default: "text")
 * @property {(val: any)=> void} [cb] - Callback function - run on successful fetch; *val* is the un-parsed response body
 * @property {(err: Error)=> void} [err] - Error callback - run on fetch error
 * @property {(code: number)=> boolean | void} [onCode] - Callback function - run on fetch response code; return `false` to prevent further processing
 * @property {boolean} [auto] - Automatically fetch content on page load
 * @property {ExternalOptions[]} [externals] - External domain fetch settings
 */

/**!
 * @typedef {object} TransitionOptions
 * @property {string} [class] - CSS class applied to transitions (default: `cu-trans`)
 * @property {[number, number] | number} [dur] - Transition duration: [in, out] or single value (in ms); default: 300
 * @property {number} [swap] - Swap delay (in ms) - applied between one element's outro start and the replacement's intro start; default: 0
 * @property {{ [key in HookKey]?: (el: HTMLElement)=> void }} [hooks] - Transition hooks
 */

/**!
 * Copper options for `fetch`, `trans`, and `profiles`.
 * @typedef {Object} CuOps
 * @property {{ [ key: string ]: Partial<CuOps> }} [profiles] - Fetch profiles assignable to elements
 * @property {FetchOptions} [fetch] - Fetch options - see https://google.com
 * @property {TransitionOptions[]} [trans] - Transition settings - see https://google.com
 */

/**!
 * @template T
 * @callback UpdaterFunction
 * @param {Array<any>} upstreamValues
 * @param {T} value
 * @returns {T}
 */

/**!
 * @template T
 * @typedef {Object} StoreOptions
 * @property {T} value
 * @property {Array<string>} [upstream]
 * @property {UpdaterFunction<T>} [updater]
 */

/**!
 * @template T
 * @typedef Store
 * @prop {T} value - The store's current value (read only)
 * @prop {function(T):void} update - Update the store's current value
 * @prop {function(function(T):void):void} sub - Add a subscription function to the store
 */

/**!
 * @typedef {Function} CuFunc
 * @param {any} val
 * @param {HTMLElement} [el]
 */

/**!
 * The global Copper interface.
 */
globalThis.Cu = {
store: 
/**!
* - Create or overwrite a _typed_ global Copper store by passing `store_ops` (`CuOps`) -> *returns `Store\<T\>`* 
* - Retrieve an untyped reference to the store specified by name by omitting `store_ops` -> *returns `Store\<any\>`*
* @template T
* @param {string} store_name
* @param {StoreOptions<T>} [store_ops]
* @return {Store<T>}
*/ (store_name, store_ops)=> /**@type {Store<T>}*/(_store(store_name, store_ops)),
ustore: 
/**!
* - Create or overwrite an untyped global Copper store by passing `store_ops` (`CuOps`) -> *returns `Store\<any\>`* 
* - Retrieve an untyped reference to the store specified by name by omitting `store_ops` -> *returns `Store\<any\>`*
* @param {string} store_name
* @param {StoreOptions<any>} [store_ops]
* @return {Store<any>}
*/ (store_name, store_ops)=> /**@type {Store<any>}*/(_store(store_name, store_ops)),
getFunc: 
/**!
 * - Retrieve a Copper function by name. *val* refers to the store's current value; *el* refers to the element that triggered the update (if applicable). *returns `CuFunc`*
 * - *Note:* Functions retrived using this method cannot infer the type of the store's value and is therefore **not** type-checked. It is preferable to keep a reference to the function if you need to preserve type information.
 * @param {string} func_name
 * @return {CuFunc}
 */ (func_name)=> /** @type {(val: any, el?: HTMLElement)=> void}*/(_funcs.get(func_name)),
addFuncs: 
/**!
 * - Add functions to the Copper function registry in key-value pairs.
 * - Functions must be registered in order to be accessible to HTML elements via `bind`, `sync`, and `resolve`. 
 * - It may still be beneficial to keep a reference to the original function if you need to preserve type information.
 * @param {{ [key: string]: CuFunc }} funcs
 */ funcs=> {for(let key in funcs) _funcs.set(key, funcs[key])},
config:
/**!
 * - Set Copper configuration options, including `trans` (DOM transition settings), `fetch` (fetch options), and `profiles` (configuration option overrides that can be set on elements ad-hoc via `cu-overrides`).
 * - Providing the optional `profileName` parameter allows you to save the configuration as a named profile. Otherwise, the profile is saved as the default configuration.
 * @param {CuOps} newops
 * @param {string} [profileName]
 */ (newops, profileName)=> _setOptions(newops, profileName),
}