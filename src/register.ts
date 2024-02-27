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
function breakOutSettings(settings?: string | null, fn = BIND) {
    let _parts = settings?.trim()?.replace("on:", "").split(/[ ()\->]{1,}/g) || [];
    let triggers = fn == SYNC ? _parts.splice(0, 1)[0].split("|") || [] : [];
    let processFunc = settings?.includes("(") ? _parts.splice(fn == SYNC ? 1 : 0, 1)[0] : "";
    let source = _parts.splice(fn == SYNC ? 1 : 0, 1)[0].split(",") || [];
    let props = _parts[0].split("|") || [];

    //Handle errors
    if(!processFunc && source.length > 1) throw("Multiple sources require a process function.")

    return { source, props, processFunc, triggers };
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
        let { source, props, processFunc, triggers } = breakOutSettings(setting, fn);

        //Handle binding
        for(let p of props) {
            let spl = p.split("-");
            let bindTo = spl.at(-1) || "";
            let bindType = spl.at(-2) || "";

            if(fn == BIND) registerDomSubscription(el, source, processFunc, bindTo, bindType);
            else registerDomEventSync(el, source, triggers, processFunc, bindTo, bindType);
        }
    });
}

//Register subscription to store from DOM
function registerDomSubscription(element: HTMLElement, source: string[], processFunc: string | undefined, bindTo: string | null, bindType?: string | null) {
    let domSubscription = ()=> {
        let vals: any[] = [];
        for(let s of source) {
            let { storeName, storePath } = getStorePath(s);
            vals.push(nestedValue(Store.box(storeName)?.value, storePath));
        }
        let val: any = Store.func(processFunc || "")?.({val: vals.length === 1 ? vals[0] : val, el: element}) ?? vals[0];         //If ingress function, run it

        if(bindTo) {
            if(!bindType) {
                //@ts-ignore
                element[bindTo] = val;
            }
            else if(bindType == "attr") element.setAttribute(bindTo, val);
            else element.style[bindTo as any] = val;
        }
    }

    //Add subscription - run whenever store updates
    store?.addSub(element.id, domSubscription);
}

function registerDomEventSync(el: HTMLElement, source: string[], triggers: string[], processFunc: string, bindTo: string, bindType: string) {
    for(let trigger of triggers) {
        //Clear old event if it exists
        let m = evMap.get(el.id) || new Map();
        let oldEv = m.get(trigger);
        if(oldEv) el.removeEventListener(trigger as keyof HTMLElementEventMap, oldEv);

        let ev = ()=> {
            //@ts-ignore
            let value = bindType == "style" ? el.style.getPropertyValue(bindTo as string) : bindType == "attr" ? el.getAttribute(bindTo as string) : el[bindTo];
            value = Store.func(processFunc || "")?.({val: value, el: el as HTMLElement}) || value;
            
            if(sourcePath?.length) {
                store?.update((curVal: any)=> nestedValue(curVal, sourcePath, value))
            }
            else store?.update(value);
        }

        //Store new event
        m.set(trigger, ev);
        evMap.set(el.id, m);

        el.addEventListener(trigger, ev);
        ev();
    }
}