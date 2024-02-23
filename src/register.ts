import { Store } from "./store";

//Register subscriptions on the DOM (scopable in case an update needs run on a subset of the DOM)
export function registerSubs(parent?: Element) {
    for(const el of (parent || document.body)?.querySelectorAll("[data-bind],[data-sync]")) {
        if(!el.id) el.id = `cu-${Math.random().toString(36)}`;
        for(const attr of Object.keys((el as HTMLElement).dataset)) {
            if(attr == "bind") handleDataBindSync(el as HTMLElement, "bind");
            else if(attr == "sync") handleDataBindSync(el as HTMLElement, "sync");
            // if(attr == "if") handleConditionals(el as HTMLElement);
        }
    };
}

//Get data from settings string
export function breakOutSettings(settings?: string | null, fn: string = "bind") {
    let triggers, _binding, func, _propsList, source;
    const [_p1, _p2] = settings?.trim()?.split(" ") || [];

    triggers = fn == "sync" ? _p1.replace("on:", "").split("|") : [];
    _binding = fn == "sync" ? _p2 : _p1;

    const [_q1, _q2] = _binding?.split("->") || [];
    _propsList = fn == "sync" ? _q1 : _q2;
    source = fn == "sync" ? _q2 : _q1;

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

function handleDataBindSync(el: HTMLElement, fn: string) {
    el?.dataset?.[fn]?.split(";").forEach(setting=> {
        const { source, props, processFunc, triggers } = breakOutSettings(setting, fn);
        let [ sourceName, ...sourcePath ] = source?.split(/[\.\[\]\?]{1,}/g);
        //@ts-ignore
        sourcePath = sourcePath.map(sp=> !isNaN(parseInt(sp)) ? parseInt(sp) : sp) as (string | number)[];
        const store = Store.box(sourceName);

        //Add or overwrite DOM subscription method
        for(let bindTo of props) {
            let bindType = "";
            const spl = bindTo?.split("-");
            if(spl?.length == 2) {
                bindType = spl[0];
                bindTo = spl[1];
            }

            //If bind, bind store to prop
            if(fn == "bind") registerDomSubscription(el, store, sourcePath, processFunc, bindTo, bindType);
            else {
                //If sync, bind prop to event
                for(const eventName of triggers) {
                    //Clear previous event listener (preventing reassingment) and bind new one
                    const oldEv = Store._evs?.get({el: el.id, target: sourcePath.join(".")});
                    if(oldEv) el.removeEventListener(eventName, oldEv);

                    //Create new listener
                    const eventFunc = (e: Event)=> { 
                        //@ts-ignore
                        let value = bindType == "style" ? el.style.getPropertyValue(bindTo as string) : bindType == "attr" ? el.getAttribute(bindTo as string) : el[bindTo];
                        value = Store.func(processFunc || "")?.({val: value, el: el as HTMLElement}) || value;    //If function, run it
                        
                        if(sourcePath.length) {
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

                    Store._evs.set({el: el.id, target: sourcePath.join(".")}, eventFunc);
                    el.addEventListener(eventName, eventFunc);
                }
            }
        }
    });
}

//Register DOM subscription
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