import { _registerInternalStore } from "./domutil";
import { _store } from "./store";
import { _scheduleUpdate } from "./updates";
import { _inputNestSplitRx, _randomEnoughId } from "./util";

export function _handleBindSync(el, inputs, output, trigger, mode, processFunc) {
    if(mode.match("bind")) {
        _registerInternalStore(_randomEnoughId(), inputs, {
            observeEl: el,
            func: ()=> {
                let val = processFunc?.(...inputs.map(input => MfSt.get(input).value || globalThis.value), el);
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
        let ev = ()=> {
            if(inputs.length > 1) console.warn("Multiple sync props", el);
            let [type, attr] = inputs?.[0].trim().split(":");
            let val = type == "style" ? el.style[attr] : type == "attr" ? el.getAttribute(attr) : el[type];
            let numVal = parseFloat(val);
            if(!isNaN(numVal)) val = numVal;
            let value = processFunc?.(val, el);
            if(output && value !== undefined) _store(output)?.update?.(value);
        }
        if(trigger == "$mount") ev();
        else el.addEventListener(trigger, ev);
    }
}