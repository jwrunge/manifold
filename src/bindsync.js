import { _store } from "./store";
import { _scheduleUpdate } from "./updates";
import { _nestedValue, ATTR_PREFIX } from "./util";

export function _handleBindSync(el, input, outputData, trigger, mode, processFunc, err_detail) {
    //Loop over input
    if(!input?.length) input = [ "" ];
    for(let i=0; i < input.length; i++) {
        /**
         * HANDLE MF-BIND
         */
        if(mode == `${ATTR_PREFIX}bind`) {
            let domSubscription = ()=> {
                _scheduleUpdate(()=> {
                    let val = processFunc?.(
                        ...outputData.map(
                            s=> _nestedValue(_store(s.name)?.value, s.path)
                        ), el
                    ) ??
                    _nestedValue(
                        _store(outputData[0].name || "")?.value, outputData[0].path
                    );

                    if(val !== undefined) el[input[i]] = val;

                    //Make sure to update dependent stores on value update
                    el.dispatchEvent(new CustomEvent(trigger))
                });
            }
        
            //Add subscription - run whenever store updates
            for(let store of outputData) _store(store.name)?.sub(domSubscription, el.id);
        }

        /**
         * HANDLE MF-SYNC
         */
        else if(mode == `${ATTR_PREFIX}sync`) {
            if(outputData.length > 1) throw(`Only one store supported: ${err_detail}`)
            let ev = ()=> {
                let prop = input[i].trim();
                let value = el[prop] ?? el.getAttribute(prop) ?? el.dataset[prop] ?? undefined;
                
                if(processFunc) value = processFunc?.(value, el);
                let store = _store(outputData[0]?.name);
                
                if(value !== undefined) {
                    store?.update?.(curVal=> {
                        return outputData[0]?.path?.length ? _nestedValue(curVal, outputData[0]?.path, value) : value
                    });
                }
            }
            if(trigger == "$mount") ev();
            else el.addEventListener(trigger, ev);
        }
    }   //End loop input
}