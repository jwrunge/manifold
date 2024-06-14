import { _registerInternalStore } from "./domutil";
import { _store } from "./store";
import { _scheduleUpdate } from "./updates";
import { _glob, _handlePushState, _inputNestSplitRx } from "./util";

export let _handleBindSync = (el, inputs, output, trigger, mode, processFunc)=> {
    if(mode.match("bind")) {
        _registerInternalStore(inputs, {
            observeEl: el,
            func: ()=> {
                let val = processFunc?.(...(inputs.map(input => _glob.MFLD.st.get(input)?.value || _glob?.[val] || [])), el);
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
            if(inputs.length > 1) console.warn("Multiple sync props", el);
            let [type, attr] = inputs?.[0]?.trim().split(":") || [],
                val = type == "style" ? el.style[attr] : type == "attr" ? el.getAttribute(attr) : el[type],
                numVal = parseFloat(val),
                value;
            
            if(!isNaN(numVal)) val = numVal;
            value = processFunc?.(val, el);
            if(output && value !== undefined) _store(output)?.update?.(value);
            _handlePushState(el, e);
        }
        if(trigger == "$mount") ev();
        else el.addEventListener(trigger, ev);
    }
}