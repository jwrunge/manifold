import { Store } from "./store";

export type ProcessFunction = ((val: any, el?: HTMLElement)=> any) | null

/*
 *  Utility functions to access stores without picking apart nested properties
 */
export function get(name: string) {
    const store = Store.storeMap.get(name);
    if(!store) throw new Error(`Store ${name} not found`);
    return store;
}

export function rm(name: string) {
    Store.storeMap.delete(name);
}

export function val(name: string) {
    return get(name)?.value;
}

export function update(name: string, value: any) {
    get(name)?.update(value);
}
