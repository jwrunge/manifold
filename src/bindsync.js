import { $fn, $st } from "./registrar";
import { _registerInternalStore } from "./domutil";
import { _handlePushState } from "./util";

export let _handleBind = (el, trigger, func, dependencyList)=> {
    _registerInternalStore(dependencyList, {
        observeEl: el,
        func: ()=> {
            el.dispatchEvent(new CustomEvent(trigger));
            return func?.(el, $st, $fn);
        }
    });
}

export let _handleSync = (el, trigger, func)=> {
    let ev = (e)=> {
        func?.(el, $st, $fn);
        _handlePushState(el, e);
    }
    if(trigger == "$mount") ev();
    else el.addEventListener(trigger, ev);
}