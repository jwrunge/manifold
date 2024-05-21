/** 
 * @template T
 * @typedef {import("./index.module.js").UpdaterFunction<T>} UpdaterFunction 
 */
/** 
 * @template T
 * @typedef {import("./index.module.js").StoreOptions<T>} StoreOptions 
 */

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
    if(typeof input === 'number') return input;
    if(input === true) return 1;

    if(input instanceof Map) return _hashAny(Array.from(input.entries()));
    else if(input instanceof Set) return _hashAny(Array.from(input));

    let hash = 0;
    for(const char of new TextEncoder().encode(
        typeof input === 'string' ? input : input?.toString() || ""
    )) 
        hash = ((hash << 5) - hash) + char;
    return hash;
}

// Next tick queue
/**
 * @type {Function[]}
 */
let _nextTickQueue = [];

export function _addToNextTickQueue(fn) {
    if(fn) _nextTickQueue.push(fn);
}

//Static
/** @type {Map<string, Store<any>>} */ if(!globalThis.Mfld_stores) globalThis.Mfld_stores = new Map();
/** @type {Map<string, Function>} */ if(globalThis.Mfld_funcs) globalThis.Mfld_funcs = new Map();
/** @type {Map<string, (any | ((any)=> any))>} */ let _workOrder = new Map();
/** @type {any} */ let _workCacheTimeout;

/**
 * @template T
 */
export class Store {
    /** @type {UpdaterFunction<T> | undefined} */ #updater = undefined;
    /** @type {Map<string, SubFunction>} */ _subscriptions = new Map();
    /** @type {string | undefined} */ _storedHash = undefined;
    /** @type {Array<string>} */ _downstreamStores = [];
    /** @type {Array<string>} */ _upstreamStores = [];

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
        globalThis.Mfld_stores.set(name, this);
        
        this._upstreamStores = ops?.upstream || [];
        for(let storeName of this._upstreamStores) _store(storeName)?._downstreamStores?.push(this.name || "");
        this.value = ops?.value;
        this.#updater = ops?.updater;

        return this;
    }

    /**
     * @param {string} ref
     * @param {() => void} sub
     */
    _addSub(ref, sub) {
        this._subscriptions.set(ref, sub);
        sub?.();
    }

    /**
     * @param {(T)=> void} sub
     */
    sub(sub) {
        let ref = "x".repeat(5).replace(/./g, c => "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"[Math.floor(Math.random() * 36) ] );
        this._subscriptions.set(ref, sub);
        sub?.(this.value);
    }

    //Update (manual or automated -- cascades downstream)
    /**
    * @template T
    * @param {T | ((T)=> T | Promise<T>)} value
    */
    async update(value) {
        return new Promise((resolve)=> {
            _workOrder.set(this.name || "", value);
            clearTimeout(_workCacheTimeout);
            _workCacheTimeout = setTimeout(async ()=> {
                //Sort this.#workOrder such that dependencies are updated first, duplicate work is filtered out
                for(let [storeName, _] of _workOrder) {
                    const store = _store(storeName);

                    //Don't repeat work if an upstream store will cascade
                    store._downstreamStores.forEach(d=> _workOrder.delete(d));   //Delete downstream stores from work order
                    store._upstreamStores.forEach(u=> _workOrder.has(u) ? _workOrder.delete(storeName) : true);
                }

                //Apply changes to top-level workers, then cascade     
                /** @type {string[]} */ let downstream = [];
                for(let [storeName, value] of _workOrder) {
                    let store = _store(storeName);
                    let newValue = (typeof value == "function" ? /** @type {Function} */await (value)?.(store.value) : value);

                    //If the value HAS DEFINITELY CHANGED or is LIKELY TO HAVE CHANGED, update the stored hash and cascade
                    let newHash = _hashAny(newValue);
                    if(newHash !== store._storedHash) {
                        store.value = newValue;
                        store._storedHash = newHash;
                        for(let S of store._downstreamStores) downstream.push(S);
                        for(let [ref, sub] of store._subscriptions) sub?.(store.value, ref);
                    }
                }

                //Clear work order and cascade
                _workOrder.clear();
                for(let S of downstream) if(_store(S)) await _store(S)._autoUpdate();

                //Handle queued nextTick functions
                _nextTickQueue.forEach(fn=> fn());
                _nextTickQueue = [];

                //Resolve value
                resolve(this.value);
            }, 0);    //Hack to force running all updates at the end of the JS event loop
        });
    }

    //Auto update
    async _autoUpdate() {
        await this.update(
            await (this.#updater?.(
                this._upstreamStores?.map(store => _store(store)?.value) || [], 
                /** @type {T} */(this?.value)
            ) || this.value),
        )
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
    let found_store = globalThis.Mfld_stores.get(name);
    if(ops) {
        if(found_store) {
            return found_store._modify(name, ops);
        }
        return new Store(name, ops);
    }
    return found_store || new Store(name, /** @type {StoreOptions<T>}*/(ops));
}