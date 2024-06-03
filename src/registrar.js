import { _store } from "./store.js";
import { _fetchHttp } from "./http.js";
import { _scheduleUpdate } from "./updates.js";
/** @typedef {import("./index.module.js").MfldOps} MfldOps */

/** @type {Partial<MfldOps>} */
let _ops = {};

let ATTR_PREFIX = "mf";
let _commaSepRx = /, {0,}/g;
let _elIdx = 0;
let _modes = ["bind", "sync", "get", "head", "post", "put", "delete", "patch"].map(m=> `${ATTR_PREFIX}${m}`);
let pageScripts = new WeakMap();
let pageStyles = new WeakMap();

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
    /** @type {NodeListOf<HTMLElement> | []} */
    let els = (parent || document.body).querySelectorAll(
        `[data-${_modes.join(`],[data-`)}]${_ops.fetch?.auto != false ? ",a" : ""}`
    ) || [];

    for(let el of els) {
        /** @type {HTMLElement} */
        if(!el.id) el.id = `${_elIdx++}`;

        //Loop over all data attributes (modes)
        for(let mode in el.dataset) {
            if(!_modes.includes(mode)) continue;
            let shouldHaveTriggers = mode != `${ATTR_PREFIX}bind`;
            let err_detail = `(#${el.id} on ${mode})`;

            //Loop over provided settings
            el.dataset?.[mode]?.split(";").forEach(setting=> {
                //Break out settings
                let _parts = setting?.split(/(?:(?:\)|->) ?){1,}/g) || []; 
        
                //Extract settings
                let triggers = shouldHaveTriggers ? _paramsInParens(_parts.splice(0,1)[0]) : [];
                let processFuncName = _parts[0]?.includes("(") ? _parts[0]?.match(/^[^\(]{1,}/)?.[0] || "" : "";
                let output = _paramsInParens(_parts.splice(mode == `${ATTR_PREFIX}sync` ? 1 : 0, 1)[0]);
                let input = _paramsInParens(_parts[0]);

                //Handle errors
                if(shouldHaveTriggers && !triggers?.length) throw(`No trigger: ${err_detail}.`)

                /** @type {Function | undefined} */
                let processFunc;
                if(processFuncName) {
                    // @ts-ignore
                    processFunc = globalThis[processFuncName] || MfFn?.get(processFuncName);
                    if(!processFunc) console.warn(`"${processFuncName}" not registered: ${err_detail}`);
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
                    /**
                     * HANDLE MF-FETCH
                     */
                    //No input loops for fetch
                    if(!mode.match(/bind|sync/)) {
                        if(input.length > 1 || output.length > 1) throw(`Multiple sources: ${err_detail}`);
                        _handleFetch(el, trigger, mode.replace(ATTR_PREFIX, ""), input[0], output[0]);
                        return;
                    }

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
        //Dynamically letruct object if it doesn't exist
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
 * @param {string} [method] 
 * @param {BodyInit | null} [input]
 * @param {string} [href]
 */
function _handleFetch(el, trigger, method, input, href) {
    /**
     * @param {Event} [e]
     */
    let ev = async e=> {  
        e?.preventDefault();
        e?.stopPropagation();

        let overrides = el.dataset[`${ATTR_PREFIX}overrides`] || "{}";
        let overrideOps = _ops.profiles?.[overrides]?.fetch || JSON.parse(overrides);

        /** @type {MfldOps} */
        let fetchOps = overrideOps ? {
            ..._ops,
            ...overrideOps,
        } : _ops;

        // If no input data was provided, it's the href; use fetchOps.body if it exists (input overrides this)
        if(!href) {
            href = typeof input == "string" ? structuredClone(input) : null || /** @type {string} */(/** @type {any}*/(e?.target)?.href);
            input = fetchOps?.fetch?.request?.body;
        }

        // Set from target element if relevant; fall back to "get"
        if(!method) method = /** @type {any}*/(e?.target)?.method || "get";

        // if(["click", "submit"].includes(trigger) || ["A", "FORM"].includes(target?.nodeName)) {
        //     history.pushState(
        //         {fetchData, elId: el.id}, 
        //         "", 
        //         target?.href || target?.action || ""
        //     );
        // }
    
        //Make sure we're allowed to fetch
        let externalPermissions = fetchOps?.fetch?.externals?.find(allowed=> href?.startsWith(allowed.domain)) || 
            !href.match(/^https?:\/\//) || href.includes(location.origin) ? {
                scripts: true,
                styles: true,
        } : undefined;

        //Fetch data
        let data = await fetch(href, {
            ...(fetchOps?.fetch?.request || {}),
            method,
            body: typeof input == "string" ? input : JSON.stringify(input),
        })
        .catch(error=> {
            fetchOps?.fetch?.err?.(error);
        });

        //Handle onCode callback
        let code = data?.status;
        if(code && fetchOps?.fetch?.onCode?.(code, data) == false) return;

        //Return JSON or text in callback
        let resp = await data?.[fetchOps?.fetch?.type || "text"]();
        fetchOps?.fetch?.cb?.(resp);

        // Handle resolutions
        for(let instruction of ["append", "prepend", "swapinner", "swapouter"]) {
            let ds = el.dataset[`${ATTR_PREFIX}${instruction}`];
            if(ds === undefined) continue;
            let [selector, toReplace] = ds?.split("->").map(s=> s.trim()) || [];

            //Extract content and schedule a DOM update
            let fullMarkup = (new DOMParser())?.parseFromString?.(resp, 'text/html');
            if(fullMarkup) {
                _scheduleUpdate({
                    in: /** @type {HTMLElement} */ (fullMarkup.querySelector(selector || "body")),
                    out: /** @type {HTMLElement} */ (toReplace ? document.querySelector(toReplace) : el),
                    relation: /** @type {"append" | "prepend" | "swapinner" | "swapouter"}*/(instruction),
                    ops: fetchOps,
                    done: ()=> true,
                })
            }
        }

        if(el.dataset?.[`${ATTR_PREFIX}resolve`]) {
            alert("RESOLVING")
        }

            // //Clear existing scripts/styles
            // for(let s of [pageScripts, pageStyles]) {
            //     let elements = s.get(fullMarkup) || [];
            //     elements.forEach(el => el.remove());
            //     s.set(fullMarkup, []);
            // }

            // //Get scripts and styles
            // let seek: string[] = ops.allowScripts ? ["scripts"] : [];
            // if(ops.allowStyles) seek.push("style");
            // if(seek.length) {
            //     let globls: NodeListOf<HTMLScriptElement | HTMLStyleElement> = fullMarkup.querySelectorAll(seek.join(","));
            //     for(let el of globls) {
            //         let isScript = el instanceof HTMLScriptElement;
            //         let source = isScript ? pageScripts : pageStyles;

            //         if(isScript ? ops.allowScripts : ops.allowStyles){
            //             if(!source.has(parent)) source.set(parent, []);
            //             source.get(parent)?.push(el as any);
            //         }
            //         else if(isScript) el.parentNode?.removeChild(el);
            //     }
            // }
    }

    if(trigger == "$mount") ev();
    else el.addEventListener(trigger, ev);
    console.log("Adding event listener", trigger, el)

}