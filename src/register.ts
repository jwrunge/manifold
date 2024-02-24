import { Store } from "./store";

let BIND = 0, SYNC = 1;

//Register subscriptions on the DOM (scopable in case an update needs run on a subset of the DOM)
export function registerSubs(parent?: Element) {
    for(let el of (parent || document.body)?.querySelectorAll("[data-bind],[data-sync]")) {
        if(!el.id) el.id = `cu-${Math.random().toString(36)}`;
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
    let source = fn == SYNC ? _parts[1] : _parts[0];
    let props = (fn == SYNC ? _parts[0] : _parts[1]).split("|") || [];
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

//Handle binding and syncing
function handleDataBindSync(el: HTMLElement, fn = BIND) {
    el?.dataset?.[fn == BIND ? "bind" : "sync"]?.split(";").forEach(setting=> {
        let { source, props, processFunc, triggers } = breakOutSettings(setting, fn);
        let [ sourceName, ...sourcePathArr ] = source?.split(/[\.\[\]\?]{1,}/g);
        let sourcePath = sourcePathArr.map(sp=> !isNaN(parseInt(sp)) ? parseInt(sp) : sp).filter(sp=> sp) as (string | number)[];
        let store = Store.box(sourceName);

        //Handle binding
        for(let p of props) {
            let spl = p.split("-");
            let bindTo = spl.at(-1) || "";
            let bindType = spl.at(-2) || "";

            if(fn == BIND) registerDomSubscription(el, store, sourcePath, processFunc, bindTo, bindType);
            else registerDomEventSync(el, store, triggers, processFunc, sourcePath, bindTo, bindType);
        }
    });
}

//Register subscription to store from DOM
function registerDomSubscription(element: HTMLElement, store: Store<any> | undefined, storePath: (string | number)[], processFunc: string | undefined, bindTo: string | null, bindType?: string | null) {
    console.log("REGISTERING DOM SUB", {element, store, storePath, processFunc, bindTo, bindType})
    let domSubscription = (val: any)=> {
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

function registerDomEventSync(el: HTMLElement, store: Store<any>, triggers: string[], processFunc: string, sourcePath: (string | number)[], bindTo: string, bindType: string) {
    for(let trigger of triggers) {
        let ev = ()=> {
            //@ts-ignore
            let value = bindType == "style" ? el.style.getPropertyValue(bindTo as string) : bindType == "attr" ? el.getAttribute(bindTo as string) : el[bindTo];
            value = Store.func(processFunc || "")?.({val: value, el: el as HTMLElement}) || value;
            
            if(sourcePath?.length) {
                store?.update((curVal: any)=> nestedValue(curVal, sourcePath, value))
            }
            else store?.update(value);
        }

        el.addEventListener(trigger, ev);
        ev();
    }
}