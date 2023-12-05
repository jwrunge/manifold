import { Store } from "./store";

export type ProcessFunction = ((val: any, el?: HTMLElement)=> any) | null

/*
 *  Utility functions to access stores without picking apart nested properties
 */
export function get(name: string) {
    return Store.storeMap.get(name);
}

export function rm(name: string) {
    Store.storeMap.delete(name);
}

export function val(name: string, value?: any) {
    if(!value) return get(name)?.value;
    get(name)?.update(value);
}