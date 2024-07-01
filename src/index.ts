import { _store, Store } from "./store";
import { _makeComponent, _component } from "./component";
import { MfldFunc, StoreOptions } from "./common_types";
import "./templ";

export let store = {
    make: <T>(store_name: string, store_ops: StoreOptions<T> | T)=> {
        if(!store_ops?.hasOwnProperty("value") && !store_ops?.hasOwnProperty("updater")) store_ops = { value: store_ops } as StoreOptions<T>;
        return _store(store_name, store_ops as StoreOptions<T>) as Store<T>;
    },
    untyped: (store_name: string, store_ops: StoreOptions<any>)=> _store(store_name, store_ops),
    funcs: (funcs: { [key: string]: MfldFunc })=> { for(let key in funcs) MFLD.$fn[key] = funcs[key]; },
};

export let component = {
    make: _makeComponent,
    register: _component
};

export { onTick } from "./updates";
export { _setOptions as config } from "./registrar";
export { $st, $fn } from "./common_types";
