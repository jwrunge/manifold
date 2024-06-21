import { $fn, $st } from "./common_types";
import { _registerInternalStore } from "./domutil";
import { _handlePushState } from "./util";

export let _handleBind = (el: HTMLElement, func?: Function, dependencyList?: string[]): void => {
    _registerInternalStore(
        dependencyList, 
        () => func?.({$el: el, $st, $fn}),
        el
    );
}

export let _handleSync = (el: HTMLElement, trigger: string, func?: Function): void => {
    let ev = (e?: Event): void => {
        func?.({$el: el, $st, $fn});
        if(e) _handlePushState(el, e);
    }
    if(trigger === "$mount") ev();
    else el.addEventListener(trigger, ev);
}