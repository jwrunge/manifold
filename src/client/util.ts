import { Store } from "./store";
export type ProcessFunction = ((data: {val: any, el?: HTMLElement})=> any) | null

//Get data from settings string
export function breakOutSettings(settings?: string | null, fn: string = "bind") {
    let triggers, _binding, func;
    const [_p1, _p2] = settings?.trim()?.split(" ") || [];
    
    if(fn == "sync" && _p1.includes(":")) {
        triggers = _p1.replace("on:", "").split("|");
        _binding = _p2;
    }
    else {
        _binding = _p1;
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

    if(/.*?\(.*?\)/.test(source)) {
        const _split = source?.replace(")", "").split("(");
        source = _split?.[1];
        func = _split?.[0];
    }

    const props = _propsList?.split("|") || [];

    return { source, props, processFunc: func, triggers };
}

//Register DOM subscription
export function registerDomSubscription(element: HTMLElement, store: Store<any> | undefined, storePath: string, processFunc: string | undefined, bindTo: string | null, bindType?: string | null) {
    if(store) {
        const domSubscription = (val: any)=> {
            if(bindTo) {
                val = nestedValue(val, storePath);
                val = Store.func(processFunc || "")?.({val, el: element}) ?? val;         //If ingress function, run it

                if(bindType === "attr") element.setAttribute(bindTo, val);
                else if(bindType === "style") element.style[bindTo as any] = val;
                //@ts-ignore
                else element[bindTo] = val;
            }
            else {
                Store.func(processFunc || "")?.({val, el: element});
            }
        }

        //Add subscription - run whenever store updates
        store.addSub(
            element,
            domSubscription
        );

        //Initial run
        domSubscription(store.value);
    }
}

//Find nested values
export function nestedValue(obj: any, path: string, newval?: any) {
    let ptr = obj;

    const pathParts = path?.replace(/[\]\?]/g, "").split(/[\.\[]/g).slice(1) || [];
    if(!pathParts?.length) return ptr;

    for(let i=0; i < pathParts.length; i++) {
        const key = pathParts[i];

        //Dynamically construct object if it doesn't exist
        if(ptr === undefined) {
            if(!isNaN(parseInt(pathParts[i]))) ptr = [];
            else ptr = {};
        }

        //Set or get value
        if(newval === undefined || i < pathParts.length - 1) {
            if(ptr instanceof Map) ptr = ptr.get(key);
            else ptr = ptr[Array.isArray(ptr) || ptr instanceof Set ? parseInt(key) : key];
        }
        else {
            if(ptr instanceof Map) ptr.set(key, newval);
            else ptr[key] = newval;
        }
    }

    return ptr;
}

export function unNestedSourceName(source: string) {
    const split = source?.replace(/[\?\]]/g, "").split(/[\.\[]/);
    return {
        sourceName: split?.[0],
        sourcePath: source?.replace(split?.[0], "")
    };
}