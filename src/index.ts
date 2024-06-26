import { _store, Store } from "./store";
import { _addToNextTickQueue } from "./updates";
import { _register, _setOptions } from "./registrar";
import { _makeComponent, _component } from "./component";
import { MfldFunc, MfldOps, StoreOptions } from "./common_types";

export let Mfld = {
    store: <T>(store_name: string, store_ops: StoreOptions<T> | T)=> {
        if(!store_ops?.hasOwnProperty("value") && !store_ops?.hasOwnProperty("updater")) store_ops = { value: store_ops } as StoreOptions<T>;
        return _store(store_name, store_ops as StoreOptions<T>) as Store<T>;
    },
    ustore: (store_name: string, store_ops: StoreOptions<any>)=> _store(store_name, store_ops),
    funcs: (funcs: { [key: string]: MfldFunc })=> { for(let key in funcs) MFLD.$fn[key] = funcs[key]; },
    config: (new_ops: MfldOps, profile_name?: string)=> _setOptions(new_ops, profile_name),
    onTick: (cb: Function)=> _addToNextTickQueue(cb),
    register: (parent: HTMLElement | string | null)=> _register( typeof parent == "string" ? document.querySelector(parent) as HTMLElement | null : parent),
    makeComponent: _makeComponent,
    component: _component
};

export let $st = MFLD.$st;
export let $fn = MFLD.$fn;

