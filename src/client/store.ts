import { copperConfig as cc } from "../general/config";

type SubFunction = (value: any, ref?: string | HTMLElement)=> void;

interface StoreOptions<T> {
    value?: T, name?: string, 
    upstream?: Array<string>, 
    updater: (upstreamValues?: Array<any>) => T, 
    onChange?: (value: T) => void,
};

export class Store<T> {
    //State
    name?: string;
    value: T | undefined = undefined;
    #updater?: (upstreamValues: Array<any>, curVal?: T) => T;
    #subscriptions: Map<Element | string, SubFunction> = new Map();

    //Derivation
    #downstreamStores?: Array<string> = [];
    #upstreamStores?: Array<string> = [];
    #onChange?: (value: T) => void;

    //Static
    static _evs: Map<HTMLElement, (this: HTMLElement, ev: Event)=> void> = new Map();
    static _stores: Map<string, Store<any>> = new Map();
    static _funcs: Map<string, Function> = new Map();

    //Constructor
    constructor(ops: StoreOptions<T>) {
        this.modify(ops);
        console.log("Constructed", this)
        return this;
    }

    /*
     * INSTANCE METHODS
     */
    addDep(store: string) {
        this.#downstreamStores?.push(store);
    }

    addSub(ref: string | Element, sub: (value: T)=> void) {
        this.#subscriptions.set(ref, sub);
        sub?.(this.value as T);
    }

    //Update based on upstream stores (initialized by derived stores and on initial load)
    async _refresh() {
        let upstreamValues = this.#upstreamStores?.map(store => Store.box(store)?.value);
        if(!upstreamValues?.length) return;
        try {
            this.value = await this.#updater?.(upstreamValues || [], this?.value) || undefined;
            this.#onChange?.(this.value as T);
        }
        catch(e) {
            console.error("No value returned from updater().", e);
        }

        this.#handleChange();
    }

    //Modify store
    modify(ops: StoreOptions<T>) {
        this.#upstreamStores = ops?.upstream;
        console.log(this.#upstreamStores, "upstream")
        for(let store of this.#upstreamStores || []) if(this.name) Store.box(store)?.addDep(this.name);

        if(ops?.name) {
            this.name = ops?.name;
            Store._stores.set(ops?.name, this);
        }
        this.value = ops?.value;
        this.#onChange = ops?.onChange;
        this.#updater = ops?.updater;
        this._refresh();
    }

    //Manual update
    async update(value: T | ((curVal: T)=> T)) {
        if(typeof value === "function") {
            this.value = (value as Function)?.(this.value);
        }
        else this.value = value;
        this.#handleChange();
    }

    //Determine if the store has been changed
    #handleChange() {
        let newHash = cc.hash(this.value);
        // if(newHash !== this.#changeHash) {
        //     this.#changeHash = newHash;
        //     this.#onChange?.(this.value as T);
        //     this.#updateDependents();
        // }
    }

    //Sync changes to downstream stores
    #updateDependents() {
        this.#downstreamStores = (this.#downstreamStores || []).filter(store => store !== undefined);   //Remove any undefined stores

        for(let store of this.#downstreamStores || []) {
            Store.box(store)?._refresh();
        }

        this.#subscriptions.forEach((sub, ref) => {
            if(!ref) this.#subscriptions.delete(ref);   //Remove undefined
            else sub?.(this.value as T, ref as HTMLElement);
        });
    }

    static box<U>(name: string, ops?: StoreOptions<U>): Store<U> | undefined {
        console.log(ops ? "Creating new store" : "Retrieving existing store")
        if(ops) return new Store({...ops, name});
        else return Store._stores.get(name);
    }

    static func(name: string, func?: Function) {
        if(func) Store._funcs.set(name, func);
        return Store._funcs.get(name);
    }

    static funcs(funcs: {[key: string]: Function}) {
        for(let key in funcs) Store._funcs.set(key, funcs[key]);
    }
}
