import { Store } from "./store.js";

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
