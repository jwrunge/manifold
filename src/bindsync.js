import { _registerInternalStore } from "./domutil";
import { _store } from "./store";
import { _scheduleUpdate } from "./updates";
import { _getStorePathFromKey, _inputNestSplitRx, _nestedValue, _randomEnoughId, ATTR_PREFIX } from "./util";

export function _handleBindSync(el, input, output, trigger, mode, processFunc) {
    /**
     * HANDLE MF-BIND - inputs are stores, output is element property
     */
    if(mode == `${ATTR_PREFIX}bind`) {
        let stores = [], paths = [];
        for(let s of input) {
            let [storeName, path] = _getStorePathFromKey(s);
            stores.push(storeName);
            paths.push(path);
        }

        _registerInternalStore(
            _randomEnoughId(),
            stores,
            {
                observeEl: el,
                func: ()=> {
                    let storeValues = [];
                    for(let i=0; i<stores.length; i++) storeValues.push(_nestedValue(_store(stores[i])?.value, paths[i]));

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
                    return val;
                }
            } 
        )
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