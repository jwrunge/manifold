import { Store } from "./store";

let BIND = 0, SYNC = 1;

let evMap = new Map<string, Map<string, (this: HTMLElement, ev: Event)=> any>>();

//Register subscriptions on the DOM (scopable in case an update needs run on a subset of the DOM)
export function registerSubs(parent?: Element) {
    for(let el of (parent || document.body)?.querySelectorAll("[data-bind],[data-sync]")) {
        if(!el.id) el.id = `cu-${Store._elIdx++}`;
        for(let attr of Object.keys((el as HTMLElement).dataset)) {
            if(attr == "bind") handleDataBindSync(el as HTMLElement, BIND);
            else if(attr == "sync") handleDataBindSync(el as HTMLElement, SYNC);
            // if(attr == "if") handleConditionals(el as HTMLElement);
        }
    };
}

//Get data from settings string
function breakOutSettings(elId: string, settings?: string | null, fn = BIND) {
    let _func_avoid_space_split = settings?.split(/[\(\)]{1,}/g);
    if(_func_avoid_space_split?.[1]) _func_avoid_space_split[1] = _func_avoid_space_split[1].replace(" ", "");  //Avoiding negative lookahead and lookbehind because Safari
    let _parts = _func_avoid_space_split?.join(" ").replace("on:", "").split(/[ \->]{1,}/g).filter(p=> p ?? false) || [];
    
    //Extract settings
    if(_parts.length > 4) throw(`Too many arguments in ${fn == BIND ? "bind" : "sync"} (#${elId}): ${settings}`);
    let triggers = fn == SYNC ? _parts.splice(0, 1)[0]?.split(/[|,]/g) || [] : [];
    let processFunc = settings?.includes("(") ? _parts.splice(0, 1)[0] : "";
    let stores = _parts.splice(fn == SYNC ? 1 : 0, 1)[0]?.split(",") || [];
    let props = _parts[0]?.split(",") || [];

    //Handle errors
    if(fn == SYNC && !settings?.includes("on:")) throw(`Sync requires at least one trigger (#${elId}).`)
    if(!processFunc && ((fn == BIND && stores.length > 1) || (fn == SYNC && props.length > 1))) throw(`Multiple sources require a process function (#${elId} on ${fn == BIND ? "bind" : "sync"}): ${(fn == BIND ? stores : props).join(", ")}`);
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
    let [ storeName, ...sourcePathArr ] = source.split(/[\.\[\]\?]{1,}/g);
    let storePath = sourcePathArr.map(sp=> !isNaN(parseInt(sp)) ? parseInt(sp) : sp).filter(sp=> sp) as (string | number)[];
    return { storeName, storePath };
}

//Handle binding and syncing
function handleDataBindSync(el: HTMLElement, fn = BIND) {
    el?.dataset?.[fn == BIND ? "bind" : "sync"]?.split(";").forEach(setting=> {
        let { stores, props, processFunc, triggers } = breakOutSettings(el.id, setting, fn);

        let storeNames: string[] = [];
        let storePaths: (string | number)[][] = [];

        for(let s of stores || []) {
            let { storeName, storePath } = getStorePath(s);
            storeNames.push(storeName);
            storePaths.push(storePath || []);
        }

        //Handle binding
        let propBindings: { prop: string, type: string }[] = [];
        if(!props?.length) props = [ "" ];
        for(let p of props) {
            let spl = p.split("-");
            let bindTo = spl.at(-1) || "";
            let bindType = spl.at(-2) || "";

            propBindings.push({ prop: bindTo, type: bindType });

            if(fn == BIND) registerDomSubscription(el, storeNames, storePaths, processFunc, bindTo, bindType);
            else registerDomEventSync(el, storeNames, storePaths, propBindings, triggers, processFunc, bindTo, bindType);
        }
    });
}

//Register subscription to store from DOM -- Function arguments are store values
function registerDomSubscription(el: HTMLElement, stores: string[], storePaths: (string | number)[][], processFunc: string | undefined, bindTo: string | null, bindType?: string | null) {   
    let domSubscription = ()=> {
        if(processFunc && Store.func(processFunc) == undefined) throw(`Function ${processFunc} not registered.`);
        let val: any = Store.func(processFunc || "")?.(...stores.map((s, i)=> nestedValue(Store.box(s)?.value, storePaths[i])), el) ?? nestedValue(Store.box(stores[0] || "")?.value, storePaths[0]);         //If ingress function, run it

        if(bindTo) {
            if(!bindType) {
                //@ts-ignore
                el[bindTo] = val;
            }
            else if(bindType == "attr") el.setAttribute(bindTo, val);
            else el.style[bindTo as any] = val;
        }
    }

    //Add subscription - run whenever store updates
    for(let store of stores) Store.box(store)?.addSub(el.id, domSubscription);
}

//Register event to store from DOM -- Function arguments are prop values
function registerDomEventSync(el: HTMLElement, stores: string[], storePaths: (string | number)[][], props: { prop: string, type: string }[], triggers: string[], processFunc: string, bindTo: string, bindType: string) {
    for(let trigger of triggers) {
        //Clear old event if it exists
        let m = evMap.get(el.id) || new Map();
        let oldEv = m.get(trigger);
        if(oldEv) el.removeEventListener(trigger as keyof HTMLElementEventMap, oldEv);

        let ev = ()=> {
            let values: any[] = [];
            for(let p of props) {
                //@ts-ignore
                let val = p.type == "style" ? el.style.getPropertyValue(p.prop) : p.type == "attr" ? el.getAttribute(p.prop) : el[p.prop];
                values.push(val);
            }
            
            if(processFunc && Store.func(processFunc) == undefined) throw(`Function ${processFunc} not registered.`);
            let value: any = Store.func(processFunc || "")?.(...values, el) || values[0];
            
            if(storePaths?.[0]?.length) {
                Store.box(stores?.[0])?.update((curVal: any)=> nestedValue(curVal, storePaths?.[0], value))
            }
            else Store.box(stores?.[0])?.update((curVal: any)=> value);
        }

        //Store new event
        m.set(trigger, ev);
        evMap.set(el.id, m);

        el.addEventListener(trigger, ev);
        ev();
    }
}