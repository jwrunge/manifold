import { hashAny } from "./hash";

export let storeGlobalConfig = {
    hashFunc: hashAny
}

export class Store<T> {
    //State
    value: T | undefined = undefined;
    initializer?: (upstreamValues?: Array<any>) => T;
    #subscriptions: Array<(value: T) => void> = [];

    //Derivation
    #downstreamStores?: Array<Store<any>> = [];
    #upstreamStores?: Array<Store<any>> = [];

    //Change tracking
    #changeHash?: number | string = undefined;
    #onChange?: (value: T) => void;
    hashFunc: (value: T | undefined) => string | number = storeGlobalConfig.hashFunc;

    constructor(defaultValue?: T) {
        if(defaultValue !== undefined) this.value = defaultValue;
    }

    //Initialize from upstream stores
    async init(initialValue?: T | ((upstreamStores: Array<Store<any>>) => T), derivesFrom?: Array<Store<any>>, onChange?: (value: T) => void) {
        this.#upstreamStores = derivesFrom;
        for(let store of this.#upstreamStores || []) {
            store.addDownstreamStore(this);
        }

        if(typeof initialValue === "function") {
            this.initializer = initialValue as (upstreamValues?: Array<any>) => T;
            await this.calculateStateFromUpstream();
        }
        else {
            this.value = initialValue;
            this.#handleChange();
        }

        if(onChange) {
            this.setOnChangeFunc(onChange);
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

    //Add downstream stores
    addDownstreamStore(store: Store<any>) {
        this.#downstreamStores?.push(store);
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
            for(let store of this.#downstreamStores) {
                store.calculateStateFromUpstream();
            }
        }

        //Iterate over registered subscriptions and update them
        for(let sub of this.#subscriptions) {
            sub(this.value as T);
        }
    }
}
