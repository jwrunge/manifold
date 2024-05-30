import { _store } from "./store.js";
import { _fetchHttp } from "./http.js";
import { _scheduleDomUpdate } from "./domUpdates.js";
/** @typedef {import("./index.module.js").MfldOps} MfldOps */

let _commaSepRx = /, {0,}/g;
let _elIdx = 0;

// globalThis.addEventListener("popstate", (e)=> {
//     let el = document?.getElementById(e.state?.elId);
//     if(e?.state?.fetchData) {
//         _fetchHttp(
//             "get", 
//             "",
//             e.state.fetchData,
//             el,
//             el=> {if(el) _registerSubs(el)}
//         );
//     }
// });

/** @type {Partial<MfldOps>} */
let _ops = {};
let _modes = ["bind", "sync", "fetch"];

/**!
 * @param {Partial<MfldOps>} newops 
 * @param {string} [profileName] 
 */
export function _setOptions(newops, profileName) {
    if(profileName) _ops.profiles = { ..._ops.profiles, [profileName]: newops };
    else _ops = { ..._ops, ...newops };
}

//Register subscriptions on the DOM (scopable in case an update needs run on a subset of the DOM)
/**
 * @param {HTMLElement | null} [parent] 
 */
export function _registerSubs(parent) {
    let modes = `[data-${_modes.join("],[data-")}],[data-cu-${_modes.join("],[data-cu-")}],[cu-${_modes.join("],[cu-")}]${_ops.fetch?.auto != false ? ",a" : ""}`;
    
    /** @type {NodeListOf<HTMLElement> | []} */
    let els = (parent || document.body).querySelectorAll(modes) || [];

    for(let el of els) {
        /** @type {HTMLElement} */
        if(!el.id) el.id = `cu-${_elIdx++}`;

        //Loop over all data attributes (modes)
        for(let mode of _modes) {
            let shouldHaveTriggers = mode != "bind";
            let err_detail = `(#${el.id} on ${mode})`;

            const settings = el.getAttribute(`data-${mode}`) || el.getAttribute(`cu-${mode}`) || el.getAttribute(`data-cu-${mode}`);
            settings?.split(";").forEach(setting=> {
                //Break out settings
                let _parts = setting?.split(/(?:(?:\)|->) ?){1,}/g) || []; 
        
                //Extract settings
                let triggers = shouldHaveTriggers ? _paramsInParens(_parts.splice(0,1)[0]) : [];
                let processFuncName = _parts[0]?.includes("(") ? _parts[0]?.match(/^[^\(]{1,}/)?.[0] || "" : "";
                let output = _paramsInParens(_parts.splice(mode == "sync" ? 1 : 0, 1)[0]);
                let input = _paramsInParens(_parts[0]);

                //Handle errors
                if(shouldHaveTriggers && !triggers?.length) throw(`No trigger: ${err_detail}.`)

                /** @type {Function | undefined} */
                let processFunc;
                if(processFuncName) {
                    processFunc = globalThis[processFuncName] || globalThis.Mfld_funcs?.get(processFuncName);
                    if(!processFunc) throw(`"${processFuncName}" not registered: ${err_detail}`);
                    if(((!shouldHaveTriggers && output.length > 1) || (shouldHaveTriggers && input.length > 1))) throw(`Multiple sources: ${err_detail}`);
                }

                //Map output names and paths
                let outputData = output.map((ext)=> {
                    let [ name, ...sourcePathArr ] = ext.split(/[\.\[\]\?]{1,}/g);
                    return {
                        name,
                        path: sourcePathArr.map(sp=> !isNaN(parseInt(sp)) 
                            ? parseInt(sp) 
                            : sp)
                            .filter(sp=> sp) /** @type {(string | number)[]} */
                    }
                });

                //Loop over triggers
                if(!triggers?.length) triggers = [""]
                for(let trigger of triggers) {
                    //No input loops for fetch
                    if(mode == "fetch") {
                        _handleFetch(el, trigger, output, input, _ops);
                    }

                    //Loop over input
                    if(!input?.length) input = [ "" ];
                    for(let i=0; i < input.length; i++) {
                        //Handle bind
                        if(mode == "bind") {
                            let domSubscription = ()=> {
                                _scheduleDomUpdate(()=> {
                                    el[input[i]] = processFunc?.(
                                        ...outputData.map(
                                            s=> _nestedValue(_store(s.name)?.value, s.path)
                                        ), el
                                    ) ??
                                    _nestedValue(
                                        _store(outputData[0].name || "")?.value, outputData[0].path
                                    );

                                    //Make sure to update dependent stores on value update
                                    el.dispatchEvent(new CustomEvent(trigger))
                                });
                            }
                        
                            //Add subscription - run whenever store updates
                            for(let store of outputData) _store(store.name)?._addSub(el.id, domSubscription);
                        }

                        //Handle sync
                        else if(mode == "sync") {
                            if(outputData.length > 1) throw(`Only one store supported: ${err_detail}`)
                            let ev = ()=> {
                                let value = el[input[i].trim()];
                                
                                if(processFunc) value = processFunc?.(value, el);
                                const store = _store(outputData[0]?.name);
                                
                                if(value !== undefined) {
                                    store?.update?.(curVal=> {
                                        return outputData[0]?.path?.length ? _nestedValue(curVal, outputData[0]?.path, value) : value
                                    });
                                }
                            }
                            el.addEventListener(trigger, ev);
                        }
                    }   //End loop input
                }   //End loop triggers
            }); //End loop settings
        }   //End loop dataset modes
    };  //End loop elements
}

//Get or set nested store values
/**
 * 
 * @param {any} obj 
 * @param {(string | number)[]} path 
 * @param {any} [newval] 
 * @returns 
 */
function _nestedValue(obj, path, newval) {
    let ptr = obj;

    for(let key of path) {
        //Dynamically construct object if it doesn't exist
        if(ptr == undefined) ptr = typeof key == "number" ? [] : {};

        //Set or get value
        if(newval == undefined || path[path.length - 1] !== key) ptr = ptr instanceof Map ? ptr?.get(key) : ptr?.[key];
        else ptr instanceof Map ? ptr.set(key, newval) : ptr[key] = newval;
    }

    return ptr;
}

/**
 * @param {string} str 
 * @returns 
 */
function _paramsInParens(str) {
    if(str?.includes("(")) {
        let matches = str.match(/[^\(\)]{1,}/g);
        str = matches?.[matches.length - 1] || "";
    }
    return str?.split(_commaSepRx)?.map(s=> s.trim()) || [];
}

/**
 * @param {HTMLElement} el 
 * @param {string} trigger 
 * @param {string[]} output 
 * @param {string[]} input 
 * @param {Partial<MfldOps>} ops 
 */
function _handleFetch(el, trigger, output, input, ops) {
    /**
     * @param {Event} [e]
     */
    let ev = e=> {  
        e?.preventDefault();
        e?.stopPropagation();  

        let fetchData = {
            ...ops,
            ...ops.profiles?.[el.dataset["overrides"] || ""] || JSON.parse(el.dataset["overrides"] || "{}") || {},
        };

        /** @type {any} */ let target = e?.target;
        if(["click", "submit"].includes(trigger) || ["A", "FORM"].includes(target?.nodeName)) {
            history.pushState(
                {fetchData, elId: el.id}, 
                "", 
                target?.href || target?.action || ""
            );
        }

        _fetchHttp(
            {
                method: el.dataset["method"]?.toLowerCase() || "get",
                href: target?.href,
                el
            },
            fetchData,
            el=> {if(el) _registerSubs(el)}
        );
    }

    if(trigger == "mount") {
        ev();
    }
    else el.addEventListener(trigger, ev);
}