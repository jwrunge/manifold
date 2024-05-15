import { _store, _func, _funcs, _stores, Store } from "./store";
import { _registerSubs, _setOptions } from "./domRegistrar";

/**! @typedef {"in-start"|"in-end"|"out-start"|"out-end"} HookKey*/
/**!
 * @typedef {Object} CuOps
 * @property {{ [ key: string ]: Partial<CuOps> }} [profiles] - Fetch profiles assignable to elements
 * @property {{request: RequestInit, type?: "json" | "text", cb: (val: any)=> void, err: (err: Error)=> void, onCode: (code: number)=> boolean | void, auto?: boolean, externals: {domain: string, scripts?: boolean, styles?: boolean }[]}} [fetch] - Fetch options - see https://google.com
 * @property {{class?: string, dur?: [number, number] | number, swap?: number, hooks?: { [key in HookKey]?: (el: HTMLElement)=> void }}} [trans] - Transition settings - see https://google.com
 */

/**!
 * @template T
 * @callback UpdaterFunction
 * @param {Array<any>} upstreamValues
 * @param {T} [curVal]
 * @returns {T}
 */

/**!
 * @template T
 * @class Store
 * @property {T} value The current value of the store
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
 * @typedef {Function} StoreFn
 * @param {string} name - The name of the store
 * @param {StoreOptions<T>} ops - Options to update the store
 * @returns {Store<T>}
 */

/**!
 * @template T
 * @type {StoreFn<T>}
 */
globalThis.CuStore = (name, ops)=> _stores.get(name) || new Store(name, ops);

/**!
 * The global Copper interface.
 * @typdef {Object} Cu
 * @template T
 * @property {StoreFn<T>} store : The store object
 * @property {any} getFunc The getFunc object
 * @property {Function} addFuncs The addFuncs object
 * @property {(newops: Partial<CuOps>, profileName?: string)=> void} config The config object
 */
globalThis.Cu = {
    store: _store,
    getFunc: _func,
    addFuncs: funcs=> {for(let key in funcs) _funcs.set(key, funcs[key])},
    config: _setOptions,
}