import { _store } from "./store";
import { _scheduleUpdate } from "./updates";
import { _getStorePathFromKey, _inputNestSplitRx, _nestedValue, ATTR_PREFIX } from "./util";

export function _handleBindSync(el, input, output, trigger, mode, processFunc) {
    /**
     * HANDLE MF-BIND - inputs are stores, output is element property
     */
    if(mode == `${ATTR_PREFIX}bind`) {
        let stores = input.map(_getStorePathFromKey);
        let domSubscription = ()=> {
            _scheduleUpdate(()=> {
                let storeValues = stores.map(s=> _nestedValue(_store(s[0])?.value, s[1]));
                let val = processFunc?.(...storeValues, el) ?? storeValues[0];
                if(output && val !== undefined) {
                    let parts = output.split(":");
                    if(parts.length > 1) {
                        switch(parts[0]) {
                            case "style": el.style[parts[1]] = val; break;
                            case "attr": el.setAttribute(parts[1], val); break;
                            default: el[output] = val;
                        }
                    }
                    else el[output] = val;
                }

                //Make sure to update dependent stores on value update
                el.dispatchEvent(new CustomEvent(trigger));
            });
        }
    
        //Add subscription - run whenever store updates
        for(let s of stores) _store(s?.[0]|| "")?.sub(domSubscription);
    }

    else {
        /**
         * HANDLE MF-SYNC - inputs are element properties, output is a store
         */
        if(mode == `${ATTR_PREFIX}sync`) {
            let [storeName, path] = _getStorePathFromKey(output || "");
            let ev = ()=> {
                let propValues = input.map(prop=> {
                    prop = prop.trim();
                    let parts = prop.split(":");
                    if(parts.length > 1) {
                        switch(parts[0]) {
                            case "style": return el.style[prop] ?? undefined;
                            case "attr": return el.getAttribute(prop) ?? undefined;
                            default: return el[prop] ?? undefined;
                        }
                    }
                    else return el[prop] ?? undefined;
                });

                let value = processFunc?.(...propValues) ?? propValues[0];
                
                if(storeName && value !== undefined) {
                    _store(storeName)?.update?.(curVal=> {
                        return path?.length ? _nestedValue(curVal, path, value) : value
                    });
                }
            }
            if(trigger == "$mount") ev();
            else el.addEventListener(trigger, ev);
        }
    }
}