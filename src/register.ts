import { Store } from "./store";

const BIND = 0;
const SYNC = 1;

let DOMObserver = new MutationObserver(()=> true);

type SyncBindTriggerGroup = {
    props: string[],
    propTypes: string[],
    processFunc: string,
    triggers: string[],
    sourceName: string,
    sourcePath: (string | number)[]
}
let DOMEvents = new Map<string, SyncBindTriggerGroup[]>();

//Register subscriptions on the DOM (scopable in case an update needs run on a subset of the DOM)
export function registerSubs(parent?: Element) {
    for(const el of (parent || document.body)?.querySelectorAll("[data-bind],[data-sync]")) {
        if(!el.id) el.id = `cu-${Math.random().toString(36)}`;
        for(const attr of Object.keys((el as HTMLElement).dataset)) {
            if(attr == "bind") handleDataBindSync(el as HTMLElement, BIND);
            else if(attr == "sync") handleDataBindSync(el as HTMLElement, SYNC);
            // if(attr == "if") handleConditionals(el as HTMLElement);
        }
    };
}

//Get data from settings string
export function breakOutSettings(settings?: string | null, fn = BIND) {
    let triggers, _binding, func, _propsList, source;
    const [_p1, _p2] = settings?.trim()?.split(" ") || [];

    triggers = fn == SYNC ? _p1.replace("on:", "").split("|") : [];
    _binding = fn == SYNC ? _p2 : _p1;

    const [_q1, _q2] = _binding?.split("->") || [];
    _propsList = fn == SYNC ? _q1 : _q2;
    source = fn == SYNC ? _q2 : _q1;

    if(/.*?\(.*?\)/.test(source)) {
        const _split = source?.replace(")", "").split("(");
        source = _split?.[1];
        func = _split?.[0];
    }

    let props: (string | null)[] = _propsList?.split("|");
    if(!props?.length) props = [null]
    return { source, props, processFunc: func, triggers };
}

//Get or set nested store values
export function nestedValue(obj: any, path: (string | number)[], newval?: any) {
    let ptr = obj;

    for(let key of path) {
        //Dynamically construct object if it doesn't exist
        if(ptr == undefined) ptr = typeof key == "number" ? [] : {};

        //Set or get value
        if(newval == undefined || path.at(-1) !== key) ptr = ptr instanceof Map ? ptr.get(key) : ptr[key];
        else ptr instanceof Map ? ptr.set(key, newval) : ptr[key] = newval;
    }

    return ptr;
}

//Handle binding and syncing
function handleDataBindSync(el: HTMLElement, fn = BIND) {
    let syncBindTriggerGroups: SyncBindTriggerGroup[] = [];

    el?.dataset?.[fn]?.split(";").forEach(setting=> {
        const { source, props, processFunc, triggers } = breakOutSettings(setting, fn);
        let [ sourceName, ...sourcePath ] = source?.split(/[\.\[\]\?]{1,}/g);
        //@ts-ignore
        sourcePath = sourcePath.map(sp=> !isNaN(parseInt(sp)) ? parseInt(sp) : sp) as (string | number)[];
        const store = Store.box(sourceName);

        //Handle binding
        let bindProps: string[] = [], bindTypes: string[] = [];
        for(let bindTo of props) {
            const spl = bindTo?.split("-");
            let bindType = "";

            if(spl?.[1]) {
                bindTo = spl[0];
                bindType = spl[1];
            }

            if(fn == BIND) registerDomSubscription(el, store, sourcePath, processFunc, bindTo, bindType);
            else {
                bindProps.push(bindTo || "");
                bindTypes.push(bindType);
            }
        }

        if(fn == SYNC) {
            syncBindTriggerGroups.push({ props: bindProps, propTypes: bindTypes, processFunc: processFunc || "", triggers, sourceName, sourcePath });
        }
    });

    //Handle syncing
    if(fn == SYNC) {
        DOMEvents.set(el.id, syncBindTriggerGroups);

        //If sync, bind prop to event
        

        DOMObserver.observe(el, { attributeFilter: [], attributeOldValue: true });
    }
}

//Register subscription to store from DOM
export function registerDomSubscription(element: HTMLElement, store: Store<any> | undefined, storePath: string[], processFunc: string | undefined, bindTo: string | null, bindType?: string | null) {
    const domSubscription = (val: any)=> {
        val = nestedValue(val, storePath);
        val = Store.func(processFunc || "")?.({val, el: element}) ?? val;         //If ingress function, run it

        if(bindTo) {
            if(bindType == "attr") element.setAttribute(bindTo, val);
            else if(bindType == "style") element.style[bindTo as any] = val;
            //@ts-ignore
            else element[bindTo] = val;
        }
    }

    //Add subscription - run whenever store updates
    store?.addSub(
        element.id,
        domSubscription
    );

    //Initial run
    domSubscription(store?.value);
}

function registerDomEventSync(el: HTMLElement, triggers: string[], processFunc: string, sourceName: string, sourcePath: (string | number)[], bindTo: string, bindType: string) {
    for(let _ of triggers) {
        //@ts-ignore
        let value = bindType == "style" ? el.style.getPropertyValue(bindTo as string) : bindType == "attr" ? el.getAttribute(bindTo as string) : el[bindTo];
        value = Store.func(processFunc || "")?.({val: value, el: el as HTMLElement}) || value;    //If function, run it
        
        if(sourceName) {
            const store = Store.box(sourceName);
            if(sourcePath?.length) {
                store?.update((curVal: any)=> {
                    if(curVal == undefined) {
                        if(typeof sourcePath[0] == "number") curVal = new Array();
                        else curVal = new Object();
                    }
                    nestedValue(curVal, sourcePath, value);
                    return curVal;
                })
            }
            else store?.update(value);
        }
    }
}