import { Store } from "./store";
export type ProcessFunction = ((data: {val: any, el?: HTMLElement})=> any) | null

//Get data from settings string
export function breakOutSettings(settings?: string | null, fn: string = "bind") {
    if(fn === "sync") console.log("Settings", settings)
    let triggers, _binding, func;
    const [_p1, _p2, _p3] = settings?.trim()?.split(" ") || [];
    
    if(fn == "sync" && _p1.includes(":")) {
        triggers = _p1.replace("on:", "").split("|");
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

    const props = _propsList?.split("|") || [];

    return { source, props, processFunc: func, triggers };
}

//Register DOM subscription
export function registerDomSubscription(element: HTMLElement, store: Store<any> | undefined, storePath: string, processFunc: string | undefined, bindTo: string | null, bindType?: string | null) {
    if(store) {
        const domSubscription = (val: any)=> {
            if(bindTo) {
                val = findNestedValue(val, storePath);
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
function findNestedValue(obj: any, path: string) {
    let value = obj;

    const pathParts = path?.replace(/[\]\?]/g, "").split(/[\.\[]/g).slice(1) || [];
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

export function unNestedSourceName(source: string) {
    const split = source?.replace(/[\?\]]/g, "").split(/[\.\[]/);
    return {
        sourceName: split?.[0],
        sourcePath: source?.replace(split?.[0], "")
    };
}