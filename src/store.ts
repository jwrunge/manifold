import { hashAny } from "./hash";

type SubFunction = (value: any, ref?: string)=> void;

type StoreOptions<T> = {
    value?: T, name?: string, 
    upstream?: Array<string>, 
    updater?: (upstreamValues?: Array<any>, curVal?: T) => T, 
    onChange?: (value: T) => void,
};

type EventBinding = {
    el: string,
    target: string
}

export class Store<T> {
    //State
    name?: string;
    value: T | undefined = undefined;
    #updater?: (upstreamValues: Array<any>, curVal?: T) => T;
    #subscriptions: Map<string, SubFunction> = new Map();
    #storedHash?: string;

    //Derivation
    #downstreamStores?: Array<string> = [];
    #upstreamStores?: Array<string> = [];
    #onChange?: (value: T) => void;

    //Static
    static hash = hashAny;
    static changeHash = (hash: (value: any)=> string) => Store.hash = hash;
    static _evs: Map<EventBinding, (this: HTMLElement, ev: Event)=> void> = new Map();
    static _stores: Map<string, Store<any>> = new Map();
    static _funcs: Map<string, Function> = new Map();

    //Constructor
    constructor(ops: StoreOptions<T>) {
        this.modify(ops);
        return this;
    }

    /*
     * INSTANCE METHODS
     */
    addDep(store?: string) {
        if(store) this.#downstreamStores?.push(store);
    }

    addSub(ref: string, sub: (value: T)=> void) {
        this.#subscriptions.set(ref, sub);
        sub?.(this.value as T);
    }

    //Update based on upstream stores (initialized by derived stores and on initial load)
    async _refresh() {
        let upstreamValues = this.#upstreamStores?.map(store => Store.box(store)?.value);
        if(upstreamValues?.length) {
            this.value = await this.#updater?.(upstreamValues || [], this?.value) || undefined;
            this.#onChange?.(this.value as T);

            this.#handleChange();
        }
    }

    //Modify store
    modify(ops: StoreOptions<T>) {
        this.#upstreamStores = ops?.upstream;
        for(let store of this.#upstreamStores || []) Store.box(store)?.addDep(this.name);

        if(ops?.name) {
            this.name = ops?.name;
            Store._stores.set(ops?.name, this);
        }
        this.value = ops?.value;
        this.#onChange = ops?.onChange;
        this.#updater = ops?.updater || (([], cur)=> cur as T);
        return this;
    }

    //Manual update
    async update(value: T | ((curVal: T)=> T)) {
        if(typeof value == "function") this.value = (value as Function)?.(this.value);
        else this.value = value;
        this.#handleChange();
    }

    //Determine if the store has been changed
    #handleChange() {
        let newHash = Store.hash(this.value);
        if(newHash !== this.#storedHash) {
            this.#storedHash = newHash;
            this.#onChange?.(this.value as T);
            this.#updateDependents();
        }
    }

    //Sync changes to downstream stores
    #updateDependents() {
        for(let store of this.#downstreamStores || []) {
            Store.box(store)?._refresh();
        }

        this.#subscriptions.forEach((sub, ref) => {
            sub?.(this.value as T, ref);
        });
    }

    static box<U>(name: string, ops?: StoreOptions<U>): Store<U> {
        const store = Store._stores.get(name);
        if(ops) return store?.modify(ops) || new Store({...ops, name});
        return store || new Store({name})
    }

    static removeBox(name: string) {
        Store._stores.delete(name);
    }

    static func(name: string) {
        return Store._funcs.get(name);
    }

    static assignFuncs(funcs: {[key: string]: Function}) {
        for(let key in funcs) Store._funcs.set(key, funcs[key]);
    }

    static removeFunc(name: string) {
        Store._funcs.delete(name);
    }
}
