import { copperConfig as cc } from "../general/config";
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
    #hashFunc: (value: T | undefined) => string | number = cc.hash;

    //Static
    static storeMap: Map<string, Store<any>> = new Map();

    //Constructor
    constructor(ops: { value?: T, name?: string, upstream?: Array<Store<any>>, updater: (upstreamValues?: Array<any>) => T, onChange?: (value: T) => void }) {
        this.#upstreamStores = ops?.upstream;
        for(let store of this.#upstreamStores || []) store.addDownstreamStore(this);

        if(ops?.name) {
            this.name = ops?.name;
            Store.storeMap.set(ops?.name, this);
        }
        this.value = ops?.value;
        this.#onChange = ops?.onChange;
        this.#initializer = ops?.updater;
        this.calculateStateFromUpstream();
        return this;
    }

    /*
     * INSTANCE METHODS
     */
    addDownstreamStore(store: Store<any>) {
        this.#downstreamStores?.push(store);
    }

    addSubscription(ref: string | Element, sub: (value: T) => void) {
        this.#subscriptions.set(ref, sub);
        sub(this.value as T);
    }

    //Update based on upstream stores (initialized by derived stores and on initial load)
    async calculateStateFromUpstream() {
        if(typeof this.#initializer === "function") {
            let upstreamValues = this.#upstreamStores?.map(store => store.value);
            this.value = await this.#initializer(upstreamValues);
            this.#onChange?.(this.value as T);
        }

        this.#handleChange();
    }

    //Manual update
    async update(value: T) {
        this.value = value;
        this.#handleChange();
    }

    //Determine if the store has been changed
    #handleChange() {
        let newHash = this.#hashFunc(this.value);
        if(newHash !== this.#changeHash) {
            this.#changeHash = newHash;
            this.#onChange?.(this.value as T);
            this.#updateDependents();
        }
    }

    //Sync changes to downstream stores
    #updateDependents() {
        this.#downstreamStores = (this.#downstreamStores || []).filter(store => store !== undefined);   //Remove any undefined stores

        for(let store of this.#downstreamStores || []) {
            store.calculateStateFromUpstream();
        }

        this.#subscriptions.forEach((sub, ref) => {
            if(!ref) this.#subscriptions.delete(ref);   //Remove undefined
            else sub?.(this.value as T, typeof ref === "string" ? undefined : ref as HTMLElement);
        });
    }
}
