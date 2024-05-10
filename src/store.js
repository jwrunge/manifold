/**
 * @param {any} input 
 * @returns {any}
 */
export function hashAny(input) {
    if (typeof input === 'number') return input;
    if(input === true) return 1;

    if(typeof input === 'object') {
        if(input instanceof Map) return hashAny(input.entries());
        if(input instanceof Set) return hashAny(Array.from(input));
        return Date.now();
    }

    let hash = 0;
    for(const char of new TextEncoder().encode(
        typeof input === 'string' ? input : input.toString()
    )) 
        hash = ((hash << 5) - hash) + char;
    return hash;
}

/**
 * @template T
 */
export class Store {
    /**
     * @param {StoreOptions<T>} ops
     */
    constructor(ops) {
        this.name = undefined;
        this.value = undefined;
        this.modify(ops);

        /** @private */ this.updater = undefined;
        /** @private */ this.subscriptions = new Map();
        /** @private */ this.storedHash = undefined;
        /** @private */ this.downstreamStores = [];
        /** @private */ this.upstreamStores = [];
    }

    //Static
    /** 
     * @private 
     * @type {Map<string, Store<any>>}
     */ 
    static stores = new Map();
    /** 
     * @private 
     * @type {Map<string, Function>}
     */ 
    static funcs = new Map();
    /**
     * @private 
     * @type {Map<string, UpdaterValue<any>>}
     */ 
    static workOrder = new Map();
    /** 
     * @private 
     * @type {any}
     */ 
    static workCacheTimeout;

    /**
     * @param {string} ref
     * @param {() => void} sub
     */
    addSub(ref, sub) {
        this.subscriptions.set(ref, sub);
        sub?.();
    }

    /**
     * @param {StoreOptions<T>} ops
     * @returns {Store<T>}
     */
    modify(ops) {
        if(ops?.name) {
            this.name = ops.name;
            Store.stores.set(ops.name, this);
        }
        this.upstreamStores = ops?.upstream || [];
        for(let storeName of this.upstreamStores || []) {
            let store = Store.store(storeName);
            if(store) store.downstreamStores?.push(this.name || "");
        }
        this.value = ops?.value;
        this.updater = ops?.updater;
        
        return this;
    }

    //Update (manual or automated -- cascades downstream)
    /**
    * @param {UpdaterValue<T> | undefined} value
    */
    async update(value) {
        Store.workOrder.set(this.name || "", value);
        clearTimeout(Store.workCacheTimeout);
        Store.workCacheTimeout = setTimeout(Store.applyChanges, 0);    //Hack to force running all updates at the end of the JS event loop
    }

    //Auto update
    async autoUpdate() {
        this.update(
            await (this.updater?.(
                this.upstreamStores?.map(store => Store.store(store)?.value) || [], 
                /** @type {T} */(this?.value)
            ) || this.value),
        )
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
    static store(name, ops) {
        const store = Store.stores.get(name);
        if(ops) return store?.modify(ops) || new Store({...ops, name});
        return store || new Store({name})
    }

    /**
     * @param {string} name 
     * @returns 
     */
    static func(name) {
        return Store.funcs.get(name);
    }

    /**
     * @param {{[key: string]: Function}} funcs 
     */
    static assign(funcs) {
        for(let key in funcs) Store.funcs.set(key, funcs[key]);
    }

    static async applyChanges() {
        //Sort this.workOrder such that dependencies are updated first, duplicate work is filtered out
        for(let [storeName, _] of Store.workOrder) {
            const store = Store.store(storeName);

            //Don't repeat work if an upstream store will cascade
            store.downstreamStores.forEach(d=> Store.workOrder.delete(d));   //Delete downstream stores from work order
            store.upstreamStores.forEach(u=> Store.workOrder.has(u) ? Store.workOrder.delete(storeName) : true);
        }

        //Apply changes to top-level workers, then cascade     
        /** @type {string[]} */ let downstream = [];  
        for(let [storeName, value] of Store.workOrder) {
            let store = Store.store(storeName);
            let newValue = await (typeof value == "function" ? /** @type {Function} */(value)?.(store.value) : value);

            //Check complex object lengths (avoid lengthy hashes) -- if the lengths indicate the value HAS NOT CHANGED, double-check via hash
            let valueChanged = Array.from((store.value || []))?.length !== Array.from(newValue).length;
            store.value = newValue;

            let newHash = "";
            if(!valueChanged) {
                newHash = hashAny(store.value);
                valueChanged = newHash !== store.storedHash;    //Double-check that the value has not changed via hash
            }

            //If the value HAS DEFINITELY CHANGED or is LIKELY TO HAVE CHANGED, update the stored hash and cascade
            if(valueChanged) {
                store.storedHash = newHash;
                for(let S of store.downstreamStores) downstream.push(S);
                for(let [ref, sub] of store.subscriptions) sub?.(store.value, ref);
            }
        }

        //Clear work order and cascade
        Store.workOrder.clear();
        for(let S of downstream) if(Store.store(S)) Store.store(S).autoUpdate();
    }
}
