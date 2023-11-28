import { copperConfig } from "../general/config";

var storeMap: Map<string, Store<any>> = new Map();

export class Store<T> {
    //State
    name?: string;
    value: T | undefined = undefined;
    initializer?: (upstreamValues?: Array<any>) => T;
    #subscriptions: Array<(value: T) => void> = [];
    #domSubscriptions: Map<Element, (value: T, el: Element) => void> = new Map();

    //Derivation
    #downstreamStores?: Array<Store<any>> = [];
    #upstreamStores?: Array<Store<any>> = [];

    //Change tracking
    #changeHash?: number | string = undefined;
    #onChange?: (value: T) => void;
    hashFunc: (value: T | undefined) => string | number = copperConfig.hashFunc;

    constructor(defaultValue?: T, name?: string) {
        this.value = defaultValue;
        if(name) {
            this.name = name;
            storeMap.set(name, this);
        }
    }

    /*
     * STATIC METHODS
     */
    static getStore(name: string) {
        const store = storeMap.get(name);
        if(!store) throw new Error(`Store ${name} not found`);
        return store;
    }

    static deleteStore(name: string) {
        const store = storeMap.get(name);
        if(!store) throw new Error(`Store ${name} not found`);
        storeMap.delete(name);
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
            this.initializer = ops?.initialValue as (upstreamValues?: Array<any>) => T;
            await this.calculateStateFromUpstream();
        }
        else if(ops?.initialValue) {
            this.value = ops?.initialValue;
            this.#handleChange();
        }

        console.log("Initting", ops?.onChange)
        if(ops?.onChange) {
            this.setOnChangeFunc(ops?.onChange);
            this.#onChange?.(this.value as T);
        }

        return this;
    }

    //Set change functions
    setOnChangeFunc(callback: (value: T) => void) {
        this.#onChange = callback;
    }

    setHashFunc(callback: (value: T | undefined) => string | number) {
        this.hashFunc = callback;
    }

    //Dependents
    addDownstreamStore(store: Store<any>) {
        this.#downstreamStores?.push(store);
    }

    addSubscription(sub: (value: T) => void) {
        this.#subscriptions.push(sub);
        sub(this.value as T);
    }

    addDomSubscription(el: Element, sub: (value: T) => void) {
        this.#domSubscriptions.set(el, sub);
        sub(this.value as T);
    }

    //Update based on upstream stores (initialized by derived stores and on initial load)
    async calculateStateFromUpstream() {
        //Run initialization function if it exists
        if(typeof this.initializer === "function") {
            let upstreamValues = this.#upstreamStores?.map(store => store.value);
            this.value = await this.initializer(upstreamValues);
            this.#onChange?.(this.value as T);
        }

        this.#handleChange();
    }

    //Manual update
    async update(value: T | ((value: T, meta?: { upstreamStores?: Array<Store<any>>, downstreamStores?: Array<Store<any>> })=> T)) {
        //Manually pass a value to update the store, or pass a function that calculates the value
        if(typeof value === "function") {
            this.value = await (value as Function)(this.value as T, { upstreamStores: this.#upstreamStores, downstreamStores: this.#downstreamStores });
        }
        else {
            this.value = value;
        }

        this.#handleChange();
    }

    //Determine if the store has been changed
    #hasChanged(val: T | undefined) {
        if(this.#changeHash === undefined) {
            this.#changeHash = this.hashFunc(val);
            return true;
        }

        let newHash = this.hashFunc(val);
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
        //Iterate over registered derived stores and update them
        if(this.#downstreamStores && this.#downstreamStores.length > 0) {
            //Remove any undefined stores
            this.#downstreamStores = this.#downstreamStores.filter(store => store !== undefined);

            //Update downstream stores
            for(let store of this.#downstreamStores) {
                store.calculateStateFromUpstream();
            }
        }

        //Iterate over registered subscriptions and update them
        if(this.#subscriptions && this.#subscriptions.length > 0) {
            //Remove any undefined subscriptions
            this.#subscriptions = this.#subscriptions.filter(sub => sub !== undefined);

            //Update subscribers
            for(let sub of this.#subscriptions) {
                sub(this.value as T);
            }
        }

        //Iterate over DOM subscribers and update them
        if(this.#domSubscriptions && this.#domSubscriptions.size > 0) {
            //Remove any undefined subscriptions
            this.#domSubscriptions.forEach((_, el) => {
                if(!el) this.#domSubscriptions.delete(el);
            });

            //Update subscribers
            this.#domSubscriptions.forEach((sub, el) => {
                sub(this.value as T, el);
            });
        }
    }
}
