import { _store } from "./store.js";
import { _addToNextTickQueue } from "./updates.js";
import { _register, _setOptions } from "./registrar.js";

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
 * @property {"json"|"text"} [resType] - Response type (default: "text")
 * @property {(err: Error)=> void} [err] - Error callback - run on fetch error
 * @property {(code: number, data: void | Response)=> boolean | void} [onCode] - Callback function - run on fetch response code; return `false` to prevent further processing
 * @property {ExternalOptions[]} [externals] - External domain fetch settings
 */

/**!
 * @typedef {object} TransitionOptions
 * @property {string} [class] - CSS class applied to transitions (default: `mfTrans`)
 * @property {[number, number] | number} [dur] - Transition duration: [in, out] or single value (in ms); default: 300
 * @property {number} [swap] - Swap delay (in ms) - applied between one element's outro start and the replacement's intro start; default: 0
 * @property {boolean} [smart] - Enable smart transitions (default: true)
 * @property {{ [key in HookKey]?: (el: HTMLElement)=> void }} [hooks] - Transition hooks
 */

/**!
 * Manifold options for `fetch`, `trans`, and `profiles`.
 * @typedef {Object} MfldOps
 * @property {{ [ key: string ]: Partial<MfldOps> }} [profiles] - Fetch profiles assignable to elements
 * @property {FetchOptions} [fetch] - Fetch options - see https://google.com
 * @property {TransitionOptions} [trans] - Transition settings - see https://google.com
 */

/**!
 * @template T
 * @callback UpdaterFunction
 * @param {Array<any>} upstreamValues
 * @param {T} value
 * @returns {T | Promise<T>}
 */

/**!
 * @template T
 * @callback ValueDeterminer
 * @param {T} [currentValue]
 * @returns {T | Promise<T> | undefined}
 */

/**!
 * @template T
 * @callback UpdateFunction
 * @param {T | ValueDeterminer<T>} value
 * @returns {T | Promise<T> | undefined}
 */

/**!
 * @template T
 * @callback SubDeterminer
 * @param {T} value
 * @returns {void}
 */

/**!
 * @template T
 * @callback SubFunction
 * @param {SubDeterminer<T>} value The store's current value
 * @returns void
 */

/**!
 * @template T
 * @typedef {Object} StoreOptions
 * @property {T} [value]
 * @property {Array<string>} [upstream]
 * @property {UpdaterFunction<T>} [updater]
 * @property {HTMLElement | SVGScriptElement | "global"} [scope]
 */

/**!
 * @template T
 * @typedef Store
 * @prop {T} value - The store's current value (read only)
 * @prop {UpdateFunction<T>} update - Update the store's current value
 * @prop {SubFunction<T>} sub - Add a subscription function to the store
 */

/**!
 * @typedef {Function} MfldFunc
 * @param {any} val
 * @param {HTMLElement} [el]
 */

/**!
 * The global Manifold interface.
 */
export let Mfld = {
store: 
/**!
* - Create or overwrite a _typed_ global Manifold store by passing `store_ops` (`MfldOps`) -> *returns `Store\<T\>`* 
* - Retrieve an untyped reference to the store specified by name by omitting `store_ops` -> *returns `Store\<any\>`*
* @template T
* @param {string} store_name
* @param {StoreOptions<T> | T} store_ops
* @return {Store<T>}
*/ (store_name, store_ops)=> {
    if(!store_ops?.hasOwnProperty("value") && !store_ops?.hasOwnProperty("updater")) {
        store_ops = /** @type {StoreOptions<T>}*/({ value: /** @type {T}*/store_ops });
    }
    return /**@type {Store<T>}*/(_store(store_name, /**@type {StoreOptions<T>}*/store_ops))
},
ustore: 
/**!
* - Create or overwrite an untyped global Manifold store by passing `store_ops` (`MfldOps`) -> *returns `Store\<any\>`* 
* - Retrieve an untyped reference to the store specified by name by omitting `store_ops` -> *returns `Store\<any\>`*
* @param {string} store_name
* @param {StoreOptions<any> | any} store_ops
* @return {Store<any>}
*/ (store_name, store_ops)=> /**@type {Store<any>}*/(_store(store_name, store_ops)),
get:
/**!
 * - Retrieve a Manifold store by name. *returns `Store\<any\>`*
 * @param {string} store_name
 * @return {Store<any>}
 */ (store_name)=> /**@type {Store<any>}*/(_store(store_name)),
func: 
/**!
 * - Retrieve a Manifold function by name. *val* refers to the store's current value; *el* refers to the element that triggered the update (if applicable). *returns `MfldFunc`*
 * - *Note:* Functions retrived using this method cannot infer the type of the store's value and is therefore **not** type-checked. It is preferable to keep a reference to the function if you need to preserve type information.
 * @param {string} func_name
 * @return {MfldFunc}
 */ (func_name)=> /** @type {(val: any, el?: HTMLElement)=> void}*/(
// @ts-ignore
 MFLD.fn[func_name]),
funcs: 
/**!
 * - Add functions to the Manifold function registry in key-value pairs.
 * - Functions must be registered in order to be accessible to HTML elements via `mfBind`, `mfSync`, and `mfResolve`. 
 * - It may still be beneficial to keep a reference to the original function if you need to preserve type information.
 * @param {{ [key: string]: MfldFunc }} funcs
 */ funcs=> {
    for(let key in funcs) {
    // @ts-ignore
    MFLD.fn[key] = funcs[key];
 }},
config:
/**!
 * - Set Manifold configuration options, including `trans` (DOM transition settings), `fetch` (fetch options), and `profiles` (configuration option overrides that can be set on elements ad-hoc via `mfOverrides`).
 * - Providing the optional `profileName` parameter allows you to save the configuration as a named profile. Otherwise, the profile is saved as the default configuration.
 * @param {MfldOps} new_ops
 * @param {string} [profile_name]
 */ (new_ops, profile_name)=> _setOptions(new_ops, profile_name),
 onTick:
 /**!
  * - Wait for the next Manifold data update cycle to complete before executing the callback function.
  * @param {()=> void} cb
  */ (cb)=> _addToNextTickQueue(cb),
register:
/**!
 * - Register Manifold subscriptions on the DOM. *Optional:* Pass an `HTMLElement` or selector string to scope the registration to a specific element.
 * @param {HTMLElement | string | null} [parent]
 */ (parent)=> {
    if(typeof parent == "string") parent = /** @type {HTMLElement | null}*/(document.querySelector(parent));
        _register(parent)
    },
};