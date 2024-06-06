/** 
 * @template T
 * @typedef {import("./index.module.js").UpdaterFunction<T>} UpdaterFunction 
 */
/** 
 * @template T
 * @typedef {import("./index.module.js").StoreOptions<T>} StoreOptions 
 */

import { _scheduleUpdate } from "./updates.js";

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
function _hashAny(input) {
    if(!input) return 0;
    if(typeof input == 'number') return input;
    if(input === true) return 1;

    if(input instanceof Map) return _hashAny(Array.from(input.entries()));
    else if(input instanceof Set) return _hashAny(Array.from(input));

    let hash = 0;
    for(let char of new TextEncoder().encode(
        typeof input == 'string' ? input : input?.toString() || ""
    )) 
        hash = ((hash << 5) - hash) + char;
    return hash;
}

//Static
/** @type {Map<string, Store<any>>} */ if(!globalThis.MfSt) globalThis.MfSt = new Map();
/** @type {Map<string, Function>} */ if(!globalThis.MfFn) globalThis.MfFn = new Map();

/**
 * @template T
 */
export class Store {
    /** @type {UpdaterFunction<T> | undefined} */ _updater = undefined;
    /** @type {Map<string, SubFunction>} */ _subscriptions = new Map();
    /** @type {string | undefined} */ _storedHash = undefined;
    /** @type {Set<Store<any>>} */ _upstreamStores = new Set();
    /** @type {Set<Store<any>>} */ _downstreamStores = new Set();

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
        // @ts-ignore
        MfSt.set(name, this);
        
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
        this._subscriptions.set(ref || String(Date.now() + Math.random()), sub);
        if(immediate) sub?.(this.value);
    }

    //Update (manual or automated -- cascades downstream on batch updates)
    /**
    * @template T
    * @param {T | ((T)=> T | Promise<T>)} value
    */
    async update(value) {
        return new Promise(async (resolve)=> {
            //Apply new value   
            let newValue = (typeof value == "function" ? /** @type {Function} */(await value)?.(this.value) : value);
            let newHash = _hashAny(newValue);
            
            if(newHash !== this._storedHash) {
                this.value = newValue;
                this._storedHash = newHash;

                // Add this store to the work order
                for(let ds of this._downstreamStores) await ds._auto_update();

                // Wait for next animation frame to return the value
                _scheduleUpdate(()=> {
                    for(let [ref, sub] of this?._subscriptions || []) sub?.(this.value, ref);
                    resolve(this.value);
                });
            }
            else resolve(this.value);
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
export function _store(name, ops) {
    // @ts-ignore
    let found_store = MfSt.get(name);
    if(ops) {
        if(found_store) {
            return found_store._modify(name, ops);
        }
        return new Store(name, ops);
    }
    return found_store || new Store(name, /** @type {StoreOptions<T>}*/(ops));
}