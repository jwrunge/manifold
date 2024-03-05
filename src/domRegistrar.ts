import { Store } from "./store";
import { fetchHttp } from "./http";
import { cuOps, type CuOptions } from "./options";

let commaSepRx = /, {0,}/g;
let elIdx = 0;

//Register subscriptions on the DOM (scopable in case an update needs run on a subset of the DOM)
export function registerSubs(parent?: HTMLElement) {
    let modes = ["bind", "sync", "get", "post", "put", "patch", "delete", "head", "options", "trace", "connect"];
    for(let el of (parent || document.body)?.querySelectorAll(`[data-${modes.join("],[data-")}]`) as NodeListOf<HTMLElement>) {
        if(!el.id) el.id = `cu-${elIdx++}`;

        //Loop over all data attributes (modes)
        for(let mode in el.dataset) {
            el?.dataset?.[mode]?.split(";").every(setting=> {
                //Break out settings
                let _parts = setting?.split(/(?:(?:\)|->) ?){1,}/g) || []; 
                let sync = mode != "bind";   
        
                //Extract settings
                let triggers = sync ? _parts.splice(0, 1)[0]?.replace("on(", "")?.split(commaSepRx) || [] : [];
                let processFuncName = _parts[0]?.includes("(") ? _parts[0]?.slice(0, _parts[0]?.indexOf("(")) : "";
                _parts[0] = _parts[0]?.replace(processFuncName, "");
                let external = _parts.splice(mode == "sync" ? 1 : 0, 1)[0]?.replace(/\(|\)/g, "")?.split(commaSepRx) || [];
                let internal = _parts[0]?.replace(/\(|\)/g, "")?.split(commaSepRx) || [];

                let err_detail = `(#${el.id} on ${mode})`;

                //Handle errors
                if(sync && !triggers?.length) throw(`No trigger: ${err_detail}.`)

                let processFunc: Function | undefined;
                if(processFuncName) {
                    processFunc = globalThis[processFuncName as keyof typeof globalThis] || Store.func(processFuncName);
                    if(!processFunc) throw(`"${processFunc}" not registered: ${err_detail}`);
                    if(((!sync && external.length > 1) || (sync && internal.length > 1))) throw(`Multiple sources: ${err_detail}`);
                }

                //Map external names and paths
                let externalData = external.map((ext)=> {
                    let [ name, ...sourcePathArr ] = ext.split(/[\.\[\]\?]{1,}/g);
                    return {
                        name,
                        path: sourcePathArr.map((sp: any)=> !isNaN(parseInt(sp)) 
                            ? parseInt(sp) 
                            : sp)
                            .filter((sp: any)=> sp) as (string | number)[]
                    }
                });

                //Fetch-specific
                let href: string, fetchOverrides: Partial<CuOptions>, fetchOps: Partial<CuOptions>;

                if(!["bind", "sync"].includes(mode)) {
                    href = external.splice(0, 1)[0];
                    fetchOverrides = cuOps.fetchProfiles?.[el.dataset["fetchops"] || ""] || JSON.parse(el.dataset["fetchops"] || "{}") || {};
                    fetchOps = {
                        ...cuOps?.fetch,
                        ...fetchOverrides
                    }
                }

                //Loop over internal
                if(!internal?.length) internal = [ "" ];
                for(let i=0; i < internal.length; i++) {
                    let [ bindTo, bindType ] = internal[i].split("-").map(s=> s.trim());
                    if(!triggers?.length) triggers = [""]

                    //Loop over triggers
                    for(let trigger of triggers) {
                        if(mode == "bind") {
                            let domSubscription = ()=> {
                                let val: any = processFunc?.(...externalData.map(s=> nestedValue(Store.store(s.name)?.value, s.path)), el) ?? nestedValue(Store.store(externalData[0].name || "")?.value, externalData[0].path);         //If ingress function, run it
                        
                                if(bindTo) {
                                    if(!bindType) (el as any)[bindTo] = val;
                                    else if(bindType == "attr") el.setAttribute(bindTo, val);
                                    else el.style[bindTo as any] = val;
                                }
                            }
                        
                            //Add subscription - run whenever store updates
                            for(let store of externalData) Store.store(store.name)?.addSub(el.id, domSubscription);
                        }

                        //Handle bind and sync
                        else if(mode == "sync") {
                            if(externalData.length > 1) throw(`Only one store supported: ${err_detail}`)
                            let ev = ()=> {
                                let value = bindType == "style" ? el.style.getPropertyValue(bindTo) : bindType == "attr" ? el.getAttribute(bindTo) : (el as any)[bindTo];
                                
                                if(processFunc) value = processFunc?.(value, el);
                                const store = Store.store(externalData[0]?.name);
                                
                                if(value !== undefined) {
                                    store?.update?.((curVal: any)=> {
                                        return externalData[0]?.path?.length ? nestedValue(curVal, externalData[0]?.path, value) : value
                                    });
                                }
                            }
                            el.addEventListener(trigger, ev);
                        }

                        //Handle fetch
                        else {
                            let ev = (e?: Event)=> {  
                                e?.preventDefault();                             
                                fetchHttp({
                                    method: mode, 
                                    href,
                                    done: (el: HTMLElement)=> registerSubs(el),
                                    extract: external[i]?.trim(),
                                    replace: internal[i]?.trim(),
                                    ...fetchOps,
                                })
                            }

                            if(trigger == "mount") ev();
                            else el.addEventListener(trigger, ev);
                        }
                    }   //End loop triggers
                }   //End loop internal
            }); //End loop settings
        }   //End loop dataset modes
    };  //End loop elements
}

//Get or set nested store values
function nestedValue(obj: any, path: (string | number)[], newval?: any) {
    let ptr = obj;

    for(let key of path) {
        //Dynamically letruct object if it doesn't exist
        if(ptr == undefined) ptr = typeof key == "number" ? [] : {};

        //Set or get value
        if(newval == undefined || path.at(-1) !== key) ptr = ptr instanceof Map ? ptr?.get(key) : ptr?.[key];
        else ptr instanceof Map ? ptr.set(key, newval) : ptr[key] = newval;
    }

    return ptr;
}