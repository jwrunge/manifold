import { _registerInternalStore } from "./domutil";
import { _store } from "./store";
import { _scheduleUpdate } from "./updates";
import { _glob, _handlePushState, _inputNestSplitRx } from "./util";

export let _handleBindSync = (el, output, trigger, mode, processFunc, dependencyList)=> {
    if(mode.match("bind")) {
        output = output?.replace(/\$el\./, "") || "";
        _registerInternalStore(dependencyList, {
            observeEl: el,
            func: ()=> {
                let val = processFunc?.(el);
                if(output && val != undefined) {
                    let [type, attr] = output.split(":");
                    if(type == "style") el.style[attr] = val;
                    else if(type == "attr") el.setAttribute(attr, val);
                    else el[output] = val;
                }
                el.dispatchEvent(new CustomEvent(trigger));
                return val;
            }
        });
    } else {
        let ev = (e)=> {
            console.log("EV", processFunc.toString(), el, processFunc?.(el));
            let value = processFunc?.(el);
            if(output && value !== undefined) _store(output)?.update?.(value);
            _handlePushState(el, e);
        }
        if(trigger == "$mount") ev();
        else el.addEventListener(trigger, ev);
    }
}