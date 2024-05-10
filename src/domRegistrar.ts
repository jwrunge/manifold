import { Store } from "./store";
import { fetchHttp } from "./http";
import { scheduleDomUpdate } from "./domUpdates";

export type FetchOptions = {
    //No user access
    fetchProfiles?: { [ key: string ]: Partial<FetchOptions> },
    method: string, 
    href: string, 
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
    convertAnchors?: true | false,

    //Animation
    transClass?: string,
    inDur?: number,
    outDur?: number,
    swapDelay?: number,
    applyCssDurations?: true | false,
    smartOutroStyling?: true | false,
    wrapperTransDur?: number,
    inStartHook?: string | ((el: HTMLElement)=> void),
    outStartHook?: string | ((el: HTMLElement)=> void),
    inEndHook?: string | ((el: HTMLElement)=> void),
    outEndHook?: string | ((el: HTMLElement)=> void),
}

type LimitedFetchOptions = Omit<FetchOptions, "fetchProfiles" | "method" | "href" | "extract" | "replace">
type StringifiableFetchOptions = Omit<LimitedFetchOptions, "inStartHook" | "outStartHook" | "inEndHook" | "outEndHook">

let commaSepRx = /, {0,}/g;
let elIdx = 0;

// Initialize from script params
function intialize() {
    let scriptParamsStr = document.currentScript?.dataset?.init;

    if(scriptParamsStr) {
        try {
            let scriptParams = JSON.parse(scriptParamsStr);
            options(scriptParams);
        } catch(e) {
            console.warn(`Invalid script params: ${scriptParamsStr}, e`);
        }
    }
}

intialize();

window.addEventListener("popstate", (e)=> {
    let el = document.getElementById(e.state?.elId);
    if(e?.state?.fetchData) {
        fetchHttp(
            e.state.fetchData,
            el,
            (el: HTMLElement | null)=> {if(el) registerSubs(el)}
        );
    }
});

let ops: Partial<FetchOptions> = {};
let modes = ["bind", "sync", "fetch"];

export function options(newops: LimitedFetchOptions, profileName?: string) {
    if(profileName) ops.fetchProfiles = { ...ops.fetchProfiles, [profileName]: newops };
    else ops = { ...ops, ...newops };
}

//Register subscriptions on the DOM (scopable in case an update needs run on a subset of the DOM)
export function registerSubs(parent?: HTMLElement | null) {
    for(let el of (parent || document.body)?.querySelectorAll(`[data-${modes.join("],[data-")}]${ops.convertAnchors != false ? ",a" : ""}`) as NodeListOf<HTMLElement>) {
        if(!el.id) el.id = `cu-${elIdx++}`;

        //Loop over all data attributes (modes)
        for(let mode in el.dataset) {
            if(!modes.includes(mode)) continue;
            let shouldHaveTriggers = mode != "bind";
            let err_detail = `(#${el.id} on ${mode})`;

            el?.dataset?.[mode]?.split(";").forEach(setting=> {
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

                //Loop over triggers
                if(!triggers?.length) triggers = [""]
                for(let trigger of triggers) {
                    //No internal loops for fetch
                    if(mode == "fetch") {
                        handleFetch(el, trigger, external, internal, ops);
                    }

                    //Loop over internal
                    if(!internal?.length) internal = [ "" ];
                    for(let i=0; i < internal.length; i++) {
                        //Handle bind
                        if(mode == "bind") {
                            let domSubscription = ()=> {
                                scheduleDomUpdate(()=> {
                                    (el as any)[internal[i]] = processFunc?.(
                                        ...externalData.map(
                                            s=> nestedValue(Store.store(s.name)?.value, s.path)
                                        ), el
                                    ) ??
                                    nestedValue(
                                        Store.store(externalData[0].name || "")?.value, externalData[0].path
                                    );

                                    //Make sure to update dependent stores on value update
                                    el.dispatchEvent(new CustomEvent(trigger))
                                });
                            }
                        
                            //Add subscription - run whenever store updates
                            for(let store of externalData) Store.store(store.name)?.addSub(el.id, domSubscription);
                        }

                        //Handle sync
                        else if(mode == "sync") {
                            if(externalData.length > 1) throw(`Only one store supported: ${err_detail}`)
                            let ev = ()=> {
                                let value = (el as any)[internal[i].trim()];
                                
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
        //Dynamically construct object if it doesn't exist
        if(ptr == undefined) ptr = typeof key == "number" ? [] : {};

        //Set or get value
        if(newval == undefined || path.at(-1) !== key) ptr = ptr instanceof Map ? ptr?.get(key) : ptr?.[key];
        else ptr instanceof Map ? ptr.set(key, newval) : ptr[key] = newval;
    }

    return ptr;
}

function paramsInParens(str: string) {
    if(str?.includes("(")) {
        let matches = str.match(/[^\(\)]{1,}/g);
        str = matches?.[matches.length - 1] || "";
    }
    return str?.split(commaSepRx) || [];
}

function handleFetch(el: HTMLElement, trigger: string, external: string[], internal: string[], ops: Partial<FetchOptions>) {
    let ev = (e?: Event)=> {  
        e?.preventDefault();
        e?.stopPropagation();  

        let fetchData = {
            method: el.dataset["method"]?.toLowerCase() || "get", 
            href: external[0],
            replace: internal,
            allowStyles: true,
            ...ops,
            ...ops.fetchProfiles?.[el.dataset["overrides"] || ""] || JSON.parse(el.dataset["overrides"] || "{}") || {},
        };
        
        if(["click", "submit"].includes(trigger) || ["A", "FORM"].includes((e?.target as HTMLElement)?.nodeName)) {
            history.pushState(
                {fetchData, elId: el.id}, 
                "", 
                (e?.target as HTMLAnchorElement)?.href || (e?.target as HTMLFormElement)?.action || ""
            );
        }

        fetchHttp(
            fetchData,
            el,
            (el: HTMLElement | null)=> {if(el) registerSubs(el)}
        )
    }

    if(trigger == "mount") {
        ev();
    }
    else el.addEventListener(trigger, ev);
}