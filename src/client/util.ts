import { Store } from "./store";
export type ProcessFunction = ((data: {val: any, el?: HTMLElement})=> any) | null

//Get data from settings string
export function breakOutSettings(settings?: string | null, fn: string = "bind") {
    let triggers, _binding, func;
    const [_p1, _p2, _p3] = settings?.split(" ") || [];
    if(fn == "sync" && !_p1.includes(":")) {
        triggers = _p1.split("|");
        _binding = _p2;
        func = _p3;
    }
    else {
        _binding = _p1;
        func = _p2;
    }

    let _propsList, source;
    const [_q1, _q2] = _binding?.split("->") || [];
    if(fn == "sync") {
        _propsList = _q1;
        source = _q2;
    }
    else {
        source = _q1;
        _propsList = _q2;
    }

    const props = _propsList.split("|")
    const processFunc = Store.func(func) as ProcessFunction;

    return { source, props, processFunc, triggers };
}

//Register DOM subscription
export function registerDomSubscription(element: HTMLElement, store: Store<any> | undefined, storePath: string, processFunc?: ProcessFunction, bindTo?: string | null, bindType?: string | null, cb?: (data: {val: any, el: HTMLElement})=> void) {
    if(store) {
        const domSubscription = (val: any)=> {
            val = findNestedValue(val, storePath);
            val = processFunc?.({val, el: element}) ?? val;         //If ingress function, run it

            if(!bindTo && bindType === "style") bindTo = "style";   //Allow bulk style setting
            if(bindTo) {
                if(bindType === "attr") element.setAttribute(bindTo, val);
                else if(bindType === "style") element.style[bindTo as any] = val;
                //@ts-ignore
                else element[bindTo] = val;
            }

            cb?.({val, el: element});
        }

        //Add subscription - run whenever store updates
        store.addSub(
            element,
            domSubscription
        );
    }
}

export function registerChangeListener(el: HTMLElement, store: Store<any> | undefined, storePath: string, processFunc?: ProcessFunction, bindTo?: string | null, bindType?: string | null, triggers?: Array<string>) {
    //If sync, bind prop to event
    for(const eventName of triggers || []) {
        const eventFunc = (e: Event)=> { 
            let value = bindType === "attr" ? 
                (e.currentTarget as HTMLElement)?.getAttribute(bindTo as string) : 
                bindType === "style" ?
                (e.currentTarget as HTMLElement)?.style.getPropertyValue(bindTo as string) :
                //@ts-ignore
                e.currentTarget[bindTo];

            value = processFunc?.({val: value, el: el as HTMLElement}) || value;    //If egress function, run it
            store?.update(value);
        }
        
        //Clear previous event listener (preventing reassingment) and bind new one
        (el as HTMLElement).removeEventListener(eventName, eventFunc);
        (el as HTMLElement).addEventListener(eventName, eventFunc);
    }
}

//Find nested values
function findNestedValue(obj: any, path: string) {
    let value = obj;

    const pathParts = path?.replace(/[\]?]/g, "").split(/[\.\[]/g).slice(1) || [];
    if(!pathParts?.length) return value;

    for(let key of pathParts) {
        try {
            if(value instanceof Map) value = value.get(key);
            else value = value[Array.isArray(value) || value instanceof Set ? parseInt(key) : key];
        }
        catch(_) { return undefined; }
    }

    return value;
}