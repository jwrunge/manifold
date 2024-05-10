/**
 * @param {any} input 
 * @returns {any}
 */
function _hashAny(input) {
    if (typeof input === 'number') return input;
    if(input === true) return 1;

    if(typeof input === 'object') {
        if(input instanceof Map) return _hashAny(input.entries());
        if(input instanceof Set) return _hashAny(Array.from(input));
        return Date.now();
    }

    let hash = 0;
    for(const char of new TextEncoder().encode(
        typeof input === 'string' ? input : input.toString()
    )) 
        hash = ((hash << 5) - hash) + char;
    return hash;
}

//Static
/** @type {Map<string, Store<any>>} */ let _stores = new Map();
/** @type {Map<string, Function>} */ let _funcs = new Map();
/** @type {Map<string, UpdaterValue<any>>} */ let _workOrder = new Map();
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
     * @param {StoreOptions<T>} ops
     */
    constructor(ops) {
        this.name = undefined;
        this.value = undefined;
        this.modify(ops);
    }

    /**
     * @param {string} ref
     * @param {() => void} sub
     */
    addSub(ref, sub) {
        this._subscriptions.set(ref, sub);
        sub?.();
    }

    /**
     * @param {StoreOptions<T>} ops
     * @returns {Store<T>}
     */
    modify(ops) {
        if(ops?.name) {
            this.name = ops.name;
            _stores.set(ops.name, this);
        }
        this._upstreamStores = ops?.upstream || [];
        for(let storeName of this._upstreamStores || []) {
            let store = _store(storeName);
            if(store) store._downstreamStores?.push(this.name || "");
        }
        this.value = ops?.value;
        this.#updater = ops?.updater;
        
        return this;
    }

    //Update (manual or automated -- cascades downstream)
    /**
    * @param {UpdaterValue<T> | undefined} value
    */
    async update(value) {
        _workOrder.set(this.name || "", value);
        clearTimeout(_workCacheTimeout);
        _workCacheTimeout = setTimeout(_applyChanges, 0);    //Hack to force running all updates at the end of the JS event loop
    }

    //Auto update
    async _autoUpdate() {
        this.update(
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
 * @template U
 * @param {string} name 
 * @param {StoreOptions<U>} [ops] 
 * @returns {Store<U>}
 */
export function _store(name, ops) {
    const store = _stores.get(name);
    if(ops) return store?.modify(ops) || new Store({...ops, name});
    return store || new Store({name})
}

/**
 * @param {string} name 
 * @returns {Function | undefined}
 */
export function _func(name) {
    return _funcs.get(name);
}

/**
 * @param {{[key: string]: Function}} funcs 
 */
export function _assign(funcs) {
    for(let key in funcs) _funcs.set(key, funcs[key]);
}

async function _applyChanges() {
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
        let newValue = await (typeof value == "function" ? /** @type {Function} */(value)?.(store.value) : value);

        //Check complex object lengths (avoid lengthy hashes) -- if the lengths indicate the value HAS NOT CHANGED, double-check via hash
        let valueChanged = Array.from((store.value || []))?.length !== Array.from(newValue).length;
        store.value = newValue;

        let newHash = "";
        if(!valueChanged) {
            newHash = _hashAny(store.value);
            valueChanged = newHash !== store._storedHash;    //Double-check that the value has not changed via hash
        }

        //If the value HAS DEFINITELY CHANGED or is LIKELY TO HAVE CHANGED, update the stored hash and cascade
        if(valueChanged) {
            store._storedHash = newHash;
            for(let S of store._downstreamStores) downstream.push(S);
            for(let [ref, sub] of store._subscriptions) sub?.(store.value, ref);
        }
    }

    //Clear work order and cascade
    _workOrder.clear();
    for(let S of downstream) if(_store(S)) _store(S)._autoUpdate();
}