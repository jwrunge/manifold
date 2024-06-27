import { $fn, $st } from "./common_types";
import { _registerInternalStore } from "./util";
import { RegisteredElement } from "./registered_element";
import { _handlePushState } from "./util";

export let _handleSync = (el: RegisteredElement, trigger: string, func?: Function): void => {
    let ev = (e?: Event): void => {
        func?.({$el: el._el, $st, $fn});
        if(e) _handlePushState(el, e);
    }
    if(trigger === "$mount") ev();
    else el._addListener(trigger, ev);
}