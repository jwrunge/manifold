import { copperConfig } from "../general/config";
import { ProcessFunction } from "./util";

export class Store<T> {
    //State
    name?: string;
    value: T | undefined = undefined;
    #initializer?: (upstreamValues?: Array<any>) => T;
    #subscriptions: Map<Element | string, ProcessFunction> = new Map();

    //Derivation
    #downstreamStores?: Array<Store<any>> = [];
    #upstreamStores?: Array<Store<any>> = [];

    //Change tracking
    #changeHash?: number | string = undefined;
    #onChange?: (value: T) => void;
    #hashFunc: (value: T | undefined) => string | number = copperConfig.hashFunc;

    //Static
    static storeMap: Map<string, Store<any>> = new Map();

    //Constructor
    constructor(defaultValue?: T, name?: string) {
        this.value = defaultValue;
        if(name) {
            this.name = name;
            Store.storeMap.set(name, this);
        }
        
        return this;
    }

    /*
     * INSTANCE METHODS
     */

    //Initialize from upstream stores
    async init(ops?: {
        initialValue?: T | ((upstreamStores: Array<Store<any>>) => T), 
        derivesFrom?: Array<Store<any>>, 
        onChange?: (value: T) => void
    }) {
        this.#upstreamStores = ops?.derivesFrom;
        for(let store of this.#upstreamStores || []) {
            store.addDownstreamStore(this);
        }

        if(typeof ops?.initialValue === "function") {
            this.#initializer = ops?.initialValue as (upstreamValues?: Array<any>) => T;
            await this.calculateStateFromUpstream();
        }
        else if(ops?.initialValue) {
            this.value = ops?.initialValue;
            this.#handleChange();
        }

        if(ops?.onChange) {
            this.#onChange = ops?.onChange;
            this.#onChange?.(this.value as T);
        }

        return this;
    }

    //Dependents
    addDownstreamStore(store: Store<any>) {
        this.#downstreamStores?.push(store);
    }

    addSubscription(ref: string | Element, sub: (value: T) => void) {
        this.#subscriptions.set(ref, sub);
        sub(this.value as T);
    }

    //Update based on upstream stores (initialized by derived stores and on initial load)
    async calculateStateFromUpstream() {
        //Run initialization function if it exists
        if(typeof this.#initializer === "function") {
            let upstreamValues = this.#upstreamStores?.map(store => store.value);
            this.value = await this.#initializer(upstreamValues);
            this.#onChange?.(this.value as T);
        }

        this.#handleChange();
    }

    //Manual update
    async update(value: T | ((value: T, meta?: { upstreamStores?: Array<Store<any>>, downstreamStores?: Array<Store<any>> })=> T)) {
        //Manually pass a value to update the store, or pass a function that calculates the value
        if(typeof value === "function") {
            this.value = await (value as Function)?.(this.value as T, { upstreamStores: this.#upstreamStores, downstreamStores: this.#downstreamStores });
        }
        else {
            this.value = value;
        }

        this.#handleChange();
    }

    //Determine if the store has been changed
    #hasChanged(val: T | undefined) {
        if(this.#changeHash === undefined) {
            this.#changeHash = this.#hashFunc(val);
            return true;
        }

        let newHash = this.#hashFunc(val);
        if(newHash !== this.#changeHash) {
            this.#changeHash = newHash;
            return true;
        }

        return false;
    }

    #handleChange() {
        if(this.#hasChanged(this.value)) {
            this.#onChange?.(this.value as T);
            this.#updateDependents();
        }
    }

    //Sync changes to downstream stores
    #updateDependents() {
        //Remove any undefined stores
        this.#downstreamStores = (this.#downstreamStores || []).filter(store => store !== undefined);

        //Update downstream stores
        for(let store of this.#downstreamStores || []) {
            store.calculateStateFromUpstream();
        }

        //Iterate over subscribers and update them
        this.#subscriptions.forEach((sub, ref) => {
            if(!ref) {
                this.#subscriptions.delete(ref);   //Remove undefined
                return;
            }
            sub?.(this.value as T, typeof ref === "string" ? undefined : ref as HTMLElement);
        });
    }
}
