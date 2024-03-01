import { Store } from "./store";

let evMap = new Map<string, Map<string, (this: HTMLElement, ev: Event)=> any>>();
let elIdx = 0;

//Register subscriptions on the DOM (scopable in case an update needs run on a subset of the DOM)
export function registerSubs(parent?: Element) {
    for(let el of (parent || document.body)?.querySelectorAll("[data-bind],[data-sync]")) {
        if(!el.id) el.id = `cu-${elIdx++}`;
        for(let attr of Object.keys((el as HTMLElement).dataset)) {
            if(attr == "bind") handleDataBindSync(el as HTMLElement);
            else if(attr == "sync") handleDataBindSync(el as HTMLElement, true);
            // if(attr == "if") handleConditionals(el as HTMLElement);
        }
    };
}

//Get data from settings string
function breakOutSettings(elId: string, settings?: string | null, sync = false) {
    let _func_avoid_space_split = settings?.split(/[\(\)]{1,}/g);
    if(_func_avoid_space_split?.[1]) _func_avoid_space_split[1] = _func_avoid_space_split[1].replace(" ", "");  //Avoiding negative lookahead and lookbehind because Safari
    let _parts = _func_avoid_space_split?.join(" ").replace("on:", "").split(/[ \->]{1,}/g).filter(p=> p ?? false) || [];
    
    //Extract settings
    if(_parts.length > 4) throw(`Too many arguments in ${sync ? "bind" : "sync"} (#${elId}): ${settings}`);
    let triggers = sync ? _parts.splice(0, 1)[0]?.split(/[|,]/g) || [] : [];
    let processFunc = settings?.includes("(") ? _parts.splice(0, 1)[0] : "";
    let stores = _parts.splice(sync ? 1 : 0, 1)[0]?.split(",") || [];
    let props = _parts[0]?.split(",") || [];

    //Handle errors
    if(sync && !settings?.includes("on:")) throw(`Sync requires at least one trigger (#${elId}).`)
    if(!processFunc && ((!sync && stores.length > 1) || (sync && props.length > 1))) throw(`Multiple sources require a process function (#${elId} on ${sync ? "sync" : "bind"}): ${(sync ? props : stores).join(", ")}`);
    return { stores, props, processFunc, triggers };
}

//Get or set nested store values
function nestedValue(obj: any, path: (string | number)[], newval?: any) {
    let ptr = obj;

    for(let key of path) {
        //Dynamically letruct object if it doesn't exist
        if(ptr == undefined) ptr = typeof key == "number" ? [] : {};

        //Set or get value
        if(newval == undefined || path.at(-1) !== key) ptr = ptr instanceof Map ? ptr.get(key) : ptr?.[key];
        else ptr instanceof Map ? ptr.set(key, newval) : ptr?.[key] ? ptr[key] = newval : undefined;
    }

    return ptr;
}

//Handle store and store path from source
function getStorePath(source: string) {
    let [ n, ...sourcePathArr ] = source.split(/[\.\[\]\?]{1,}/g);
    let p = sourcePathArr.map(sp=> !isNaN(parseInt(sp)) ? parseInt(sp) : sp).filter(sp=> sp) as (string | number)[];
    return { n, p };
}

//Handle binding and syncing
function handleDataBindSync(el: HTMLElement, sync = false) {
    el?.dataset?.[sync ? "sync" : "bind"]?.split(";").forEach(setting=> {
        let { stores, props, processFunc, triggers } = breakOutSettings(el.id, setting, sync);
        let storeData = stores.map(s=> getStorePath(s));

        //Handle binding
        if(!props?.length) props = [ "" ];
        for(let p of props) {
            let spl = p.split("-");

            if(sync) registerDomEventSync(el, storeData[0], triggers, processFunc, spl.at(-1), spl.at(-2));
            else registerDomSubscription(el, storeData, processFunc, spl.at(-1), spl.at(-2));
        }
    });
}

//Register subscription to store from DOM -- Function arguments are store values
function registerDomSubscription(el: HTMLElement, storeData: {n: string, p: (string | number)[]}[], processFunc: string | undefined, bindTo = "", bindType = "") {   
    let domSubscription = ()=> {
        if(processFunc && Store.func(processFunc) == undefined) throw(`Function ${processFunc} not registered.`);
        let val: any = Store.func(processFunc || "")?.(...storeData.map(s=> nestedValue(Store.box(s.n)?.value, s.p)), el) ?? nestedValue(Store.box(storeData[0].n || "")?.value, storeData[0].p);         //If ingress function, run it

        if(bindTo) {
            if(!bindType) (el as any)[bindTo] = val;
            else if(bindType == "attr") el.setAttribute(bindTo, val);
            else el.style[bindTo as any] = val;
        }
    }

    //Add subscription - run whenever store updates
    for(let store of storeData) Store.box(store.n)?.addSub(el.id, domSubscription);
}

//Register event to store from DOM -- Function arguments are prop values
function registerDomEventSync(el: HTMLElement, storeData: {n: string, p: (string | number)[]}, triggers: string[], processFunc: string, bindTo = "", bindType = "") {
    for(let trigger of triggers) {
        let ev = ()=> {
            let value = bindType == "style" ? el.style.getPropertyValue(bindTo) : bindType == "attr" ? el.getAttribute(bindTo) : (el as any)[bindTo];
            
            if(processFunc) {
                if(Store.func(processFunc) == undefined) throw(`Function ${processFunc} not registered.`);
                value = Store.func(processFunc)?.(value, el);
            }

            const store = Store.box(storeData?.n);
            
            if(value !== undefined) {
                store?.update?.((curVal: any)=> {
                    return storeData?.p?.length ? nestedValue(curVal, storeData?.p, value) : value
                });
            }
        }

        //Clear old event if it exists
        let m = evMap.get(el.id) || new Map();
        el.removeEventListener(trigger as keyof HTMLElementEventMap, m.get(trigger));

        //Store new event
        evMap.set(el.id, m.set(trigger, ev));
        el.addEventListener(trigger, ev);
        ev();
    }
}