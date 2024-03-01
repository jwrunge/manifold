export function hashAny(input: any): any {
    if(!input) return 0;
    if(typeof input == "object") {
        if(input instanceof Map) return hashAny(input.entries());
        else if(input instanceof Set) return hashAny(Array.from(input));
        return Date.now();
    }

    let hash = 0;
    let enc = new TextEncoder().encode(typeof input == "string" ? input : input.toString());
    for(let char of enc) {
        hash = ((hash << 5) - hash) + char;
    }
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
    static #stores: Map<string, Store<any>> = new Map();
    static #funcs: Map<string, Function> = new Map();
    static #workOrder: Map<string, UpdaterValue<any>> = new Map();
    static #workCacheTimeout: NodeJS.Timeout;

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
        if(ops?.name) {
            this.name = ops.name;
            Store.#stores.set(ops.name, this);
        }
        this.#upstreamStores = ops?.upstream || [];
        for(let storeName of this.#upstreamStores || []) {
            let store = Store.box(storeName);
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
                this.#upstreamStores?.map(store => Store.box(store)?.value) || [], 
                this?.value
            ) || this.value) as T,
        )
    }

    /**
     * STORE STATIC METHODS
     */
    static box<U>(name: string, ops?: StoreOptions<U>): Store<U> {
        const store = Store.#stores.get(name);
        if(ops) return store?.modify(ops) || new Store({...ops, name});
        return store || new Store({name})
    }

    static func(name: string) {
        return Store.#funcs.get(name);
    }

    static assign(funcs: {[key: string]: Function}) {
        for(let key in funcs) Store.#funcs.set(key, funcs[key]);
    }

    static async #applyChanges() {
        //Sort this.#workOrder such that dependencies are updated first, duplicate work is filtered out
        for(let [storeName, _] of Store.#workOrder) {
            const store = Store.box(storeName);

            //Don't repeat work if an upstream store will cascade
            for(let d of store.#downstreamStores) {
                if(Store.#workOrder.has(d)) Store.#workOrder.delete(d);   //Delete downstream stores from work order
            }
            for(let u of store.#upstreamStores) {
                if(Store.#workOrder.has(u)) Store.#workOrder.delete(storeName);          //Delete self if upstream store is already in work order
                continue;
            }
        }

        //Apply changes to top-level workers, then cascade     
        let downstream: string[] = [];  
        for(let [storeName, value] of Store.#workOrder) {
            const store = Store.box(storeName);
            let newValue = await (typeof value == "function" ? (value as Function)?.(store.value) : value);

            //Check complex object lengths (avoid lengthy hashes)
            let valueChanged = false;
            let newHash = "";
            if(typeof store.value == "object") {
                try {
                    if(Array.from(store.value as ArrayLike<unknown>).length !== Array.from(newValue).length) valueChanged = true;
                }
                catch(_) {
                    valueChanged = false;
                }
            }

            store.value = newValue;

            //Check hash for changes
            if(!valueChanged) {
                newHash = hashAny(store.value);
                valueChanged = newHash !== store.#storedHash;
            }
        
            if(valueChanged){
                store.#storedHash = newHash;
                
                //Cascade changes
                for(let S of store.#downstreamStores) downstream.push(S);    
                for(let [ref, sub] of store.#subscriptions) {
                    sub?.(store.value, ref);
                }
            }
        }

        //Clear work order and cascade
        Store.#workOrder.clear();
        for(let S of downstream) if(Store.box(S)) Store.box(S).#autoUpdate();
    }
}
