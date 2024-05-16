import { _store, _funcs, _stores } from "./store";
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
 * @typedef {Object} StoreOptions
 * @property {T} value
 * @property {Array<string>} [upstream]
 * @property {UpdaterFunction<T>} [updater]
 */

/**!
 * @template T
 * @typedef Store
 * @prop {T} value
 */

/**!
 * The global Copper interface.
 */
globalThis.Cu = {
    /**!
     * @template T
     * @param {string} store_name
     * @param {StoreOptions<T>} store_ops
     * @returns {Store<T>}
     */
    store: (store_name, store_ops)=> /**@type {Store<T>}*/(_store(store_name, store_ops)),
    getFunc: (name)=> _funcs.get(name),
    addFuncs: funcs=> {for(let key in funcs) _funcs.set(key, funcs[key])},
    config: _setOptions,
}