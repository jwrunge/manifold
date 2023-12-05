import { copperConfig as cc } from "../general/config";

type SubFunction = (value: any, ref?: string | HTMLElement)=> void

export class Store<T> {
    //State
    name?: string;
    value: T | undefined = undefined;
    #updater?: (upstreamValues: Array<any>, curVal?: T) => T;
    #subscriptions: Map<Element | string, SubFunction> = new Map();

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
        for(let store of this.#upstreamStores || []) store.addDep(this);

        if(ops?.name) {
            this.name = ops?.name;
            Store.storeMap.set(ops?.name, this);
        }
        this.value = ops?.value;
        this.#onChange = ops?.onChange;
        this.#updater = ops?.updater;
        this.#refresh();
        return this;
    }

    /*
     * INSTANCE METHODS
     */
    addDep(store: Store<any>) {
        this.#downstreamStores?.push(store);
    }

    addSub(ref: string | Element, sub: (value: T)=> void) {
        this.#subscriptions.set(ref, sub);
        sub?.(this.value as T);
    }

    //Update based on upstream stores (initialized by derived stores and on initial load)
    async #refresh() {
        let upstreamValues = this.#upstreamStores?.map(store => store.value);
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
            store.#refresh();
        }

        this.#subscriptions.forEach((sub, ref) => {
            if(!ref) this.#subscriptions.delete(ref);   //Remove undefined
            else sub?.(this.value as T, ref as HTMLElement);
        });
    }
}
