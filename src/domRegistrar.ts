import { Store } from "./store";
import { fetchHttp } from "./http";

export type FetchOptions = {
    //No user access
    fetchProfiles?: { [ key: string ]: Partial<FetchOptions> },
    method: string, 
    href: string, 
    extract: string[], 
    replace: string[],

    //User access
    type?: "json" | "text",  
    options?: {[key: string]: any}, 
    cb?: (val: any)=> void, 
    err?: (err: any)=> void, 
    allowCodes?: string[],
    onCode?: (code: number)=> boolean | void,
    allowExternal?: string[],
    allowScripts?: true | false, 
    allowStyles?: true | false | "all",

    //Animation
    transClass?: string,
    inDur?: number,
    outDur?: number,
    swapDelay?: number,
    inStartHook?: (el: HTMLElement)=> void,
    outStartHook?: (el: HTMLElement)=> void,
    inEndHook?: (el: HTMLElement)=> void,
    outEndHook?: (el: HTMLElement)=> void,
    applyCss?: (el: HTMLElement, css: string)=> void,
}

type LimitedFetchOptions = Omit<FetchOptions, "fetchProfiles" | "method" | "href" | "extract" | "replace">

let commaSepRx = /, {0,}/g;
let elIdx = 0;

function paramsInParens(str: string) {
    if(str?.includes("(")) {
        let matches = str.match(/[^\(\)]{1,}/g);
        str = matches?.[matches.length - 1] || "";
    }
    return str?.split(commaSepRx) || [];
}

let ops: Partial<FetchOptions> = {};

export function options(newops: LimitedFetchOptions, profileName?: string) {
    if(profileName) ops.fetchProfiles = { ...ops.fetchProfiles, [profileName]: newops };
    else ops = { ...ops, ...newops };
}

//Register subscriptions on the DOM (scopable in case an update needs run on a subset of the DOM)
export function registerSubs(parent?: HTMLElement) {
    let modes = ["bind", "sync", "get", "post", "put", "patch", "delete", "head", "options", "trace", "connect"];
    for(let el of (parent || document.body)?.querySelectorAll(`[data-${modes.join("],[data-")}]`) as NodeListOf<HTMLElement>) {
        if(!el.id) el.id = `cu-${elIdx++}`;

        //Loop over all data attributes (modes)
        for(let mode in el.dataset) {
            let shouldHaveTriggers = mode != "bind";
            let err_detail = `(#${el.id} on ${mode})`;

            el?.dataset?.[mode]?.split(";").every(setting=> {
                //Break out settings
                let _parts = setting?.split(/(?:(?:\)|->) ?){1,}/g) || []; 
        
                //Extract settings
                let triggers = shouldHaveTriggers ? paramsInParens(_parts.splice(0,1)[0]) as string[] : [];
                let processFuncName = _parts[0]?.includes("(") ? _parts[0]?.match(/^[^\(]{1,}/)?.[0] || "" : "";
                let external = paramsInParens(_parts.splice(mode == "sync" ? 1 : 0, 1)[0]) as string[];
                let internal = paramsInParens(_parts[0]) as string[];

                //Handle errors
                if(shouldHaveTriggers && !triggers?.length) throw(`No trigger: ${err_detail}.`)

                let processFunc: Function | undefined;
                if(processFuncName) {
                    processFunc = globalThis[processFuncName as keyof typeof globalThis] || Store.func(processFuncName);
                    if(!processFunc) throw(`"${processFuncName}" not registered: ${err_detail}`);
                    if(((!shouldHaveTriggers && external.length > 1) || (shouldHaveTriggers && internal.length > 1))) throw(`Multiple sources: ${err_detail}`);
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
                let href: string, fetchOverrides: Partial<LimitedFetchOptions>, fetchOps: Partial<LimitedFetchOptions> = {};

                if(!["bind", "sync"].includes(mode)) {
                    href = external.splice(0, 1)[0];
                    fetchOverrides = ops.fetchProfiles?.[el.dataset["fetchops"] || ""] || JSON.parse(el.dataset["fetchops"] || "{}") || {};
                    fetchOps = {
                        ...ops,
                        ...fetchOverrides
                    }
                }

                //Loop over triggers
                if(!triggers?.length) triggers = [""]
                for(let trigger of triggers) {
                    //No internal loops for fetch
                    if(!["bind", "fetch"].includes(mode)) {
                        let ev = (e?: Event)=> {  
                            e?.preventDefault();                             
                            fetchHttp(
                                {
                                    method: mode, 
                                    href,
                                    extract: external,
                                    replace: internal,
                                    allowStyles: true,
                                    ...fetchOps,
                                },
                                el,
                                (el: HTMLElement)=> registerSubs(el)
                            )
                        }

                        if(trigger == "mount") {
                            ev();
                        }
                        else el.addEventListener(trigger, ev);
                    }

                    //Loop over internal
                    if(!internal?.length) internal = [ "" ];
                    for(let i=0; i < internal.length; i++) {
                        //Handle bind
                        if(mode == "bind") {
                            let domSubscription = ()=> {
                                (el as any)[internal[i]] = processFunc?.(
                                    ...externalData.map(
                                        s=> nestedValue(Store.store(s.name)?.value, s.path)
                                    ), el
                                ) ??
                                nestedValue(
                                    Store.store(externalData[0].name || "")?.value, externalData[0].path
                                );
                            }
                        
                            //Add subscription - run whenever store updates
                            for(let store of externalData) Store.store(store.name)?.addSub(el.id, domSubscription);
                        }

                        //Handle sync
                        else if(mode == "sync") {
                            if(externalData.length > 1) throw(`Only one store supported: ${err_detail}`)
                            let ev = ()=> {
                                let value = (el as any)[internal[i]];
                                
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
                    }   //End loop internal
                }   //End loop triggers
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