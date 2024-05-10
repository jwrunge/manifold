import { _store, _func, _assign } from "./store";
import { _registerSubs, _setOptions } from "./domRegistrar";

globalThis.Cu = {
    store: _store,
    getFunc: _func,
    addFuncs: _assign,
    config: _setOptions
}