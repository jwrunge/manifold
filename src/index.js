import { _store, _func, _assign } from "./store";
import { _registerSubs, _setOptions } from "./domRegistrar";

/**
 * @preserve
 * @typedef {object} Cu
 * @property {object} store - The name of the store (required)
 */
globalThis.Cu = {
    /** @preserve @typedef {object} store - The name of the store (required) */
    store: _store,
    getFunc: _func,
    addFuncs: _assign,
    config: _setOptions
}