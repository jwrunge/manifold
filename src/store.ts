import { UpdaterFunction, StoreOptions } from "./common_types";
import { _scheduleUpdate } from "./updates";
import { _id } from "./util";

export type SubFunction = (value: any, ref?: string) => void;

function _hashAny(input: any): any {
    if(!input) return 0;
    if(typeof input === 'number' || input === true) return input;
    if(input instanceof Map || input instanceof Set) return _hashAny(Array.from(input.entries() || input));

    let hash = 0;
    for (let char of new TextEncoder().encode(input?.toString() || "")) 
        hash = ((hash << 5) - hash) + char;
    return hash;
}

export class Store<T> {
    _updater?: UpdaterFunction<T>;
    _subscriptions: Map<string, SubFunction> = new Map();
    _storedHash?: string;
    _upstreamStores: Set<Store<any>> = new Set();
    _downstreamStores: Set<Store<any>> = new Set();
    _scope: HTMLElement | SVGScriptElement | string | "global";
    _updateTimeout?: any;
    name: string;
    value: T;

    constructor(name: string, ops?: StoreOptions<T>) {
        this.name = name;
        this._scope = "global";
        this.value = undefined as any; // Initial value as undefined
        this._modify(name, ops);
    }

    _modify(name: string, ops?: StoreOptions<T>): Store<T> {
        this.name = name;
        this._scope = ops?.scope || document.currentScript || "global";
        MFLD.st.set(name, this);

        (ops?.upstream?.map(s => {
            let S = _store(s);
            this._upstreamStores.add(S);
            S._downstreamStores.add(this);
            return S;
        }) || []);

        this.value = ops?.value as T;
        this._updater = ops?.updater;
        this._auto_update();
        return this;
    }

    sub(sub: (value: T) => void, ref?: string, immediate: boolean = true): void {
        this._subscriptions.set(ref || _id(), sub);
        if(immediate) sub(this.value);
    }

    update(value: T | ((value: T) => T)): void {
        if(this._updateTimeout) clearTimeout(this._updateTimeout);
        this._updateTimeout = setTimeout(() => {
            _scheduleUpdate(() => {
                let newValue = typeof value === "function" ? (value as Function)(this.value) : value;
                let newHash = _hashAny(newValue);

                if(newHash !== this._storedHash) {
                    this.value = newValue;
                    this._storedHash = newHash.toString();

                    for (let ds of this._downstreamStores) ds._auto_update();

                    for (let [ref, sub] of this._subscriptions) sub(this.value, ref);
                }

                return this.value;
            });
        }, 0);
    }

    _auto_update(): void {
        let newVal = this._updater?.(
            Array.from(this._upstreamStores).map(S => S.value) || [], 
            this.value
        );

        this.update(newVal === undefined ? this.value : newVal);
    }
}

export function _store<T>(name: string, ops?: StoreOptions<T>): Store<T> {
    let found_store = MFLD.st.get(name) as Store<any>;
    return ops ? (found_store ? found_store._modify(name, ops) : new Store(name, ops)) : (found_store || new Store(name, ops));
}