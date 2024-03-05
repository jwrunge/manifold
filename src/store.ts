export function hashAny(input: any): any {
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

type UpdaterValue<T> = T | ((curVal: T)=> T)
type SubFunction = (value: any, ref?: string)=> void;

type StoreOptions<T> = {
    value?: T, name?: string, 
    upstream?: Array<string>, 
    updater?: (upstreamValues?: Array<any>, curVal?: T) => T, 
};

export class Store<T> {
    //State
    name?: string;
    value: T | undefined = undefined;
    #updater?: (upstreamValues: Array<any>, curVal?: T) => T;
    #subscriptions: Map<string, SubFunction> = new Map();
    #storedHash?: string;

    //Derivation
    #downstreamStores: Array<string> = [];
    #upstreamStores: Array<string> = [];

    //Static
    static #stores: WeakSet<Store<any>> = new WeakSet();
    static #funcs: WeakSet<Function> = new WeakSet();
    static #workOrder: Map<string, UpdaterValue<any>> = new Map();
    static #workCacheTimeout: any;

    //Constructor
    constructor(ops: StoreOptions<T>) {
        return this.modify(ops);
    }

    addSub(ref: string, sub: ()=> void) {
        this.#subscriptions.set(ref, sub);
        sub?.();
    }

    //Modify store
    modify(ops: StoreOptions<T>) {
        Store.#stores.add(this);
        if(ops?.name) this.name = ops.name;
        this.#upstreamStores = ops?.upstream || [];
        for(let storeName of this.#upstreamStores || []) {
            let store = Store.store(storeName);
            if(store) store.#downstreamStores?.push(this.name || "");
        }
        this.value = ops?.value;
        this.#updater = ops?.updater;
        
        return this;
    }

    //Update (manual or automated -- cascades downstream)
    async update(value: UpdaterValue<T>) {
        Store.#workOrder.set(this.name || "", value);
        clearTimeout(Store.#workCacheTimeout);
        Store.#workCacheTimeout = setTimeout(Store.#applyChanges, 0);    //Hack to force running all updates at the end of the JS event loop
    }

    //Auto update
    async #autoUpdate() {
        this.update(
            await (this.#updater?.(
                this.#upstreamStores?.map(store => Store.store(store)?.value) || [], 
                this?.value
            ) || this.value) as T,
        )
    }

    /**
     * STORE STATIC METHODS
     */
    static findStore(name: string): Store<any> | undefined {
        Set.prototype.forEach.call(Store.#stores, (store: Store<any>)=> {
            if(store.name == name) return store;
        });
        return undefined;
    }

    static func(name: string): Function | undefined {
        Set.prototype.forEach.call(Store.#funcs, (func: Function)=> {
            if(func.name == name) return func;
        });
        return undefined;
    }

    static store<U>(name: string, ops?: StoreOptions<U>): Store<U> {
        let store: Store<any> | undefined = undefined;
        Set.prototype.forEach.call(Store.#stores, (S: Store<any>)=> { if(S.name == name) store = S; });
        if(ops) return (store as Store<any> | undefined)?.modify(ops) || new Store({...ops, name});
        return store || new Store({name})
    }

    static funcs(funcs: {[key: string]: Function}) {
        for(let key in funcs) Store.#funcs.add(funcs[key]);
    }

    static async #applyChanges() {
        //Sort this.#workOrder such that dependencies are updated first, duplicate work is filtered out
        for(let [storeName, _] of Store.#workOrder) {
            const store = Store.store(storeName);

            //Don't repeat work if an upstream store will cascade
            store.#downstreamStores.every(d=> Store.#workOrder.delete(d));   //Delete downstream stores from work order
            store.#upstreamStores.every(u=> Store.#workOrder.has(u) ? Store.#workOrder.delete(storeName) : true);
        }

        //Apply changes to top-level workers, then cascade     
        let downstream: string[] = [];  
        for(let [storeName, value] of Store.#workOrder) {
            let store = Store.store(storeName);
            let newValue = await (typeof value == "function" ? (value as Function)?.(store.value) : value);

            //Check complex object lengths (avoid lengthy hashes) -- if the lengths indicate the value HAS NOT CHANGED, double-check via hash
            let valueChanged = Array.from(store.value as ArrayLike<any>).length !== Array.from(newValue).length;
            store.value = newValue;

            let newHash = "";
            if(!valueChanged) {
                newHash = hashAny(store.value);
                valueChanged = newHash !== store.#storedHash;    //Double-check that the value has not changed via hash
            }

            //If the value HAS DEFINITELY CHANGED or is LIKELY TO HAVE CHANGED, update the stored hash and cascade
            if(valueChanged) {
                store.#storedHash = newHash;
                for(let S of store.#downstreamStores) downstream.push(S);
                for(let [ref, sub] of store.#subscriptions) sub?.(store.value, ref);
            }
        }

        //Clear work order and cascade
        Store.#workOrder.clear();
        for(let S of downstream) if(Store.store(S)) Store.store(S).#autoUpdate();
    }
}
