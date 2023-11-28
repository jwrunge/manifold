import { handleDataBinding } from "./bindSync";
import { handleStringInterpolation } from "./stringInterp";
import { Store } from "./store";

//Register subscriptions on the DOM (scopable in case an update needs run on a subset of the DOM)
export function registerSubs(parent?: Element) {
    if(!parent) parent = document.body;
    handleDataBinding(parent);
    handleStringInterpolation(parent);
}

//Get store from name
export function storeFromName(name?: string | null) {
    if(!name) return null;

    let store: Store<any>;
    try {
        store = Store.getStore(name || "");
    }
    catch(_) {
        //@ts-ignore - Get store
        store = window[storeName] as Store<any>;
    }

    return store;
}

//Utility functions to access stores without nesting
export function get(name: string) {
    return Store.getStore(name);
}

export function remove(name: string) {
    Store.deleteStore(name);
}

export function valueof(name: string) {
    const store = Store.getStore(name);
    return store.value;
}

export function update(value: any, name: string) {
    const store = Store.getStore(name);
    store.update(value);
}
