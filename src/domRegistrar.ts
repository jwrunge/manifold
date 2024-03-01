import { Store } from "./store";
import { fetchHttp } from "./http";

let evMap = new Map<string, Map<string, (this: HTMLElement, ev: Event)=> any>>();
let elIdx = 0;

//Register subscriptions on the DOM (scopable in case an update needs run on a subset of the DOM)
export function registerSubs(parent?: Element) {
    for(let el of (parent || document.body)?.querySelectorAll("[data-bind],[data-sync],[data-fetch]")) {
        if(!el.id) el.id = `cu-${elIdx++}`;
        for(let attr in (el as HTMLElement).dataset) {
            if(attr != "fetch") handleDataBindSync(el as HTMLElement, attr as "sync" | "bind");
            else if(attr == "fetch") handleDataFetch(el as HTMLElement);
        }
    };
}

//Get data from settings string
function breakOutSettings(elId: string, fn: "bind" | "sync", settings?: string | null, sync = false): [ string[], string[], string, string[] ]{
    let _func_avoid_space_split = settings?.split(/[\(\)]{1,}/g);
    if(_func_avoid_space_split?.[1]) _func_avoid_space_split[1] = _func_avoid_space_split[1].replace(" ", "");  //Avoiding negative lookahead and lookbehind because Safari
    let _parts = _func_avoid_space_split?.join(" ").replace("on:", "").split(/[ \->]{1,}/g).filter(p=> p ?? false) || [];
    
    //Extract settings
    if(_parts.length > 4) throw(`Bad input (#${elId} ${fn}): ${settings}`);
    let triggers = sync ? _parts.splice(0, 1)[0]?.split(/[|,]/g) || [] : [];
    let processFunc = settings?.includes("(") ? _parts.splice(0, 1)[0] : "";
    let stores = _parts.splice(sync ? 1 : 0, 1)[0]?.split(",") || [];
    let props = _parts[0]?.split(",") || [];

    //Handle errors
    if(sync && !settings?.includes("on:")) throw(`No trigger (#${elId} ${fn}).`)
    if(!processFunc && ((!sync && stores.length > 1) || (sync && props.length > 1))) throw(`Multiple sources (#${elId} ${fn}): ${(sync ? props : stores).join(", ")}`);
    return [ stores, props, processFunc, triggers ];
}

//Get or set nested store values
function nestedValue(obj: any, path: (string | number)[], newval?: any) {
    let ptr = obj;

    for(let key of path) {
        //Dynamically letruct object if it doesn't exist
        if(ptr == undefined) ptr = typeof key == "number" ? [] : {};

        //Set or get value
        if(newval == undefined || path.at(-1) !== key) ptr = ptr?.[key] || ptr?.get(key);
        else ptr instanceof Map ? ptr.set(key, newval) : ptr[key] = newval;
    }

    return ptr;
}

//Handle store and store path from source
function getNameAndPath(source: string) {
    let [ n, ...sourcePathArr ] = source.split(/[\.\[\]\?]{1,}/g);
    let p = sourcePathArr.map(sp=> !isNaN(parseInt(sp)) ? parseInt(sp) : sp).filter(sp=> sp) as (string | number)[];
    return { n, p };
}

//Handle binding and syncing
function handleDataBindSync(el: HTMLElement, fn: "bind" | "sync") {
    let sync = fn == "sync";
    el?.dataset?.[fn]?.split(";").forEach(setting=> {
        let [ stores, props, processFunc, triggers ] = breakOutSettings(el.id, fn, setting, sync);
        let storeData = stores.map(s=> getNameAndPath(s));

        //Handle binding
        if(!props?.length) props = [ "" ];
        for(let p of props) {
            let spl = p.split("-");

            if(processFunc && Store.func(processFunc) == undefined) throw(`${processFunc} not registered.`);
            if(sync) registerDomEventSync(el, storeData[0], triggers, processFunc, spl.at(-1), spl.at(-2));
            else registerDomSubscription(el, storeData, processFunc, spl.at(-1), spl.at(-2));
        }
    });
}

//Register subscription to store from DOM -- Function arguments are store values
function registerDomSubscription(el: HTMLElement, storeData: {n: string, p: (string | number)[]}[], processFunc: string | undefined, bindTo = "", bindType = "") {   
    let domSubscription = ()=> {
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

//Generic DOM event bind
function bindDomEvent(el: HTMLElement, trigger: string, ev: ()=> any) {
    //Clear old event if it exists
    let m = evMap.get(el.id) || new Map();
    el.removeEventListener(trigger as keyof HTMLElementEventMap, m.get(trigger));

    //Store new event
    evMap.set(el.id, m.set(trigger, ev));
    el.addEventListener(trigger, ev);
    ev();
}

//Register event to store from DOM -- Function arguments are prop values
function registerDomEventSync(el: HTMLElement, storeData: {n: string, p: (string | number)[]}, triggers: string[], processFunc: string, bindTo = "", bindType = "", isFetch = false) {
    for(let trigger of triggers) {
        let ev = ()=> {
            let value = bindType == "style" ? el.style.getPropertyValue(bindTo) : bindType == "attr" ? el.getAttribute(bindTo) : (el as any)[bindTo];
            
            if(processFunc) value = Store.func(processFunc)?.(value, el);
            const store = Store.box(storeData?.n);
            
            if(value !== undefined) {
                store?.update?.((curVal: any)=> {
                    return storeData?.p?.length ? nestedValue(curVal, storeData?.p, value) : value
                });
            }
        }

        bindDomEvent(el, trigger, ev);
    }
}

function handleDataFetch(el: HTMLElement) {
    el?.dataset?.["fetch"]?.split(";").forEach(setting=> {
        let [ docTargets, httpSrc, method, triggers ] = breakOutSettings(el.id, "sync", setting, true);

        for(let target of docTargets || [""]) {
            for(let trigger of triggers) {
                let [src, extract] = httpSrc[0].split(":");
                let ev = ()=> {                               
                    fetchHttp(method, src, "text", extract || "body", target || "body", {}, undefined, undefined, true)
                }

                if(trigger == "mount") ev();
                else bindDomEvent(el, trigger, ev);
            }
        }
    });
}