import { $fn, $st } from "./common_types";
import { _registerInternalStore } from "./domutil";
import { RegisteredElement } from "./registered_element";
import { _handlePushState } from "./util";

export let _handleBind = (el: RegisteredElement, func?: Function, dependencyList?: string[]): void => {
    _registerInternalStore(
        dependencyList, 
        () => func?.({$el: el, $st, $fn}),
        el
    );
}

export let _handleSync = (el: RegisteredElement, trigger: string, func?: Function): void => {
    let ev = (e?: Event): void => {
        func?.({$el: el, $st, $fn});
        if(e) _handlePushState(el, e);
        RegisteredElement
    }
    if(trigger === "$mount") ev();
    else RegisteredElement._addListener(trigger, ev);
}