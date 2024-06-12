/** 
 * @template T
 * @typedef {import("./index.js").UpdaterFunction<T>} UpdaterFunction 
 */
/** 
 * @template T
 * @typedef {import("./index.js").StoreOptions<T>} StoreOptions 
 */

import { _scheduleUpdate } from "./updates.js";
import { _id } from "./util.js";

/**
 * @callback SubFunction
 * @param {any} value
 * @param {string} [ref]
 * @returns {void}
 */

/**
 * @param {any} input 
 * @returns {any}
 */
let _hashAny = (input)=> {
    if(!input) return 0;
    if(typeof input == 'number' || input === true) return input;
    if(input instanceof Map || input instanceof Set) return _hashAny(Array.from(input.entries() || input));

    let hash = 0;
    for(let char of new TextEncoder().encode(input?.toString() || "")) 
        hash = ((hash << 5) - hash) + char;
    return hash;
}

//Static
if(!window.MFLD) window.MFLD = {
    st: new Map(),
    fn: {},
    mut: new Map(),
}

/**
 * @template T
 */
export class Store {
    /** @type {UpdaterFunction<T> | undefined} */ _updater = undefined;
    /** @type {Map<string, SubFunction>} */ _subscriptions = new Map();
    /** @type {string | undefined} */ _storedHash = undefined;
    /** @type {Set<Store<any>>} */ _upstreamStores = new Set();
    /** @type {Set<Store<any>>} */ _downstreamStores = new Set();
    /** @type {HTMLElement | SVGScriptElement | string | "global"} */ _scope;
    /** @type {any | undefined} */ _updateTimeout;

    /**
     * @param {string} name
     * @param {StoreOptions<T>} [ops]
     */
    constructor(name, ops) {
        return this._modify(name, ops);        
    }

    /**
     * @param {string} name
     * @param {StoreOptions<T>} [ops]
     */
    _modify(name, ops) {
        this.name = name;
        this._scope = ops?.scope || document.currentScript || "global";
        // @ts-ignore
        MFLD.st.set(name, this);

        //Watch for scope destroy
        // Watch for scope destroy
        if(this._scope instanceof Element) {
            // @ts-ignore
            let mutOb = MFLD.mut.get(this._scope) || { toRemove: new Set() };
            if(!mutOb.observer) {
                mutOb.observer = new MutationObserver((muts)=> {
                    for(let mut of muts) {
                        if(mut.type == "childList") {
                            for(let node of mut.removedNodes) {
                                if(node instanceof Element) {
                                    for(let store of mutOb.toRemove) {
                                        if(store._scope == node) {
                                            let scope = this._scope;
                                            _destroy(store);
                                            mutOb.observer.disconnect();
                                            mutOb.toRemove.delete(store);
                                            // @ts-ignore
                                            MFLD.mut.delete(scope)
                                        }
                                    }
                                }
                            }
                        }
                    }
                });
                /** @type {MutationObserver}*/(mutOb.observer).observe(/** @type {HTMLElement}*/(this._scope?.parentElement), { childList: true });
            }
            mutOb.toRemove.add(this);
            // @ts-ignore
            MFLD.mut.set(this._scope, mutOb);
        }
        
        (ops?.upstream?.map(s=> {
            let S = _store(s);
            this._upstreamStores.add(S);
            S._downstreamStores.add(this);
            return S;
        }) || []);

        this.value = ops?.value;
        this._updater = ops?.updater;
        this._auto_update();
        return this;
    }

    /**
     * @param {(T)=> void} sub
     * @param {string | undefined} [ref]
     * @param {boolean} [immediate]
     */
    sub(sub, ref, immediate = true) {
        this._subscriptions.set(ref || _id(), sub);
        if(immediate) sub?.(this.value);
    }

    //Update (manual or automated -- cascades downstream on batch updates)
    /**
    * @template T
    * @param {T | ((T)=> T | Promise<T>)} value
    */
    async update(value) {
        return new Promise(async (resolve)=> {
            // Group updates
            if(this._updateTimeout) clearTimeout(this._updateTimeout);
            this._updateTimeout = setTimeout(()=> {

                _scheduleUpdate(async ()=> {
                    //Apply new value   
                    let newValue = (typeof value == "function" ? /** @type {Function} */(await value)?.(this.value) : value);
                    let newHash = _hashAny(newValue);
                    
                    if(newHash !== this._storedHash) {
                        this.value = newValue;
                        this._storedHash = newHash;

                        // Add this store to the work order
                        for(let ds of this._downstreamStores) await ds._auto_update();

                        // Wait for next animation frame to return the value
                        for(let [ref, sub] of this?._subscriptions || []) sub?.(this.value, ref);
                        resolve(this.value);
                    }
                    else {
                        resolve(this.value);
                    }
                });
            }, 0);
        });
    }

    async _auto_update() {
        let newVal = await this._updater?.(
            Array.from(this._upstreamStores)?.map(S => S?.value) || [], 
            /** @type {T} */(this?.value)
        );

        await this.update(newVal === undefined ? this.value : newVal);
    }
}

/**
 * STORE STATIC METHODS
 */
/**
 * @template T
 * @param {string} name - The name of the store
 * @param {StoreOptions<T> | T} [ops] - Options to update the store
 * @returns {Store<T>}
 */
export let _store = (name, ops)=> {
    let found_store = MFLD.st.get(name);
    return ops ? (found_store ? found_store._modify(name, ops) : new Store(name, ops)) : (found_store || new Store(name, ops));
}
/**
 * @param {HTMLElement | string} scope 
 */
export let _clearScope = (scope)=> {
    // @ts-ignore
    MsFt.forEach(store=> {
        if(store._scope == scope) _destroy(store); 
    });
}

/**
 * @param {Store<any>} store 
 */
export let _destroy = (store)=> {
    // @ts-ignore
    MFLD.st.delete(store.name);
    // @ts-ignore
    store = undefined;
}