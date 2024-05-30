import {Mfld} from "./index.module.js";
import { _registerSubs, _setOptions } from "./registrar.js";

globalThis.Mfld = Mfld;

let ds = globalThis.document?.currentScript?.dataset || {};
if(ds?.config) {
    try {
        let scriptParams = JSON.parse(ds?.config);
        _setOptions(scriptParams);
    } catch(e) {
        console.warn("Invalid Mfld params", e);
    }
}

if(ds?.init) {
    _registerSubs();
}