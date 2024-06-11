import { _registerInternalStore } from "./domutil";
import { _store } from "./store";
import { _scheduleUpdate } from "./updates";
import { _evalInputs, _inputNestSplitRx, _nestedValue, _randomEnoughId } from "./util";

export function _handleBindSync(el, inputs, output, trigger, mode, processFunc) {
    /**
     * HANDLE MF-BIND - inputs are stores, output is element property
     */
    if(mode.match("bind")) {
        _registerInternalStore(
            _randomEnoughId(),
            inputs,
            {
                observeEl: el,
                func: ()=> {
                    let val = processFunc?.(..._evalInputs(inputs), el);

                    if(output && val != undefined) {
                        let parts = output.split(":");
                        switch(parts[0]) {
                            case "style": el.style[parts[1]] = val; break;
                            case "attr": el.setAttribute(parts[1], val); break;
                            default: el[output] = val;
                        }
                    }

                    //Make sure to update dependent stores on value update
                    el.dispatchEvent(new CustomEvent(trigger));
                    return val;
                }
            } 
        )
    }

    else {
        /**
         * HANDLE MF-SYNC - inputs are element properties, output is a store
         */
        let ev = ()=> {
            if(inputs.length > 1) console.warn("Multiple sync props", el);

            // Get prop value
            let parts = inputs?.[0].trim().split(":");
            let val;
            switch(parts[0]) {
                case "style": val = el.style[parts[1]]; break;
                case "attr": val = el.getAttribute(parts[1]); break;
                default: val = el[parts[0]];
            }

            let numVal = parseFloat(val);
            if(!isNaN(numVal)) val = numVal;

            let value = processFunc?.(val, el);
            if(output && value !== undefined) _store(output)?.update?.(value);
        }
        
        if(trigger == "$mount") ev();
        else el.addEventListener(trigger, ev);
    }
}