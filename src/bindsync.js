import { $fn, $st } from "./registrar";
import { _registerInternalStore } from "./domutil";
import { _handlePushState } from "./util";

export let _handleBind = (el, func, dependencyList)=> {
    _registerInternalStore(
        dependencyList, 
        ()=> {
            return func?.({$el: el, $st, $fn});
        },
        el
    );
}

export let _handleSync = (el, trigger, func)=> {
    let ev = (e)=> {
        func?.({$el: el, $st, $fn});
        _handlePushState(el, e);
    }
    if(trigger == "$mount") ev();
    else el.addEventListener(trigger, ev);
}