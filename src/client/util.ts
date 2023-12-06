import { Store } from "./store";

export type ProcessFunction = ((data: {val: any, el?: HTMLElement})=> any) | null

/*
 *  Utility functions to access stores without picking apart nested properties
 */
export function get(name: string) {
    return Store.storeMap.get(name);
}

export function rm(name: string) {
    Store.storeMap.delete(name);
}

export function val(name: string, value?: any) {
    if(!value) return get(name)?.value;
    get(name)?.update(value);
}

//Get data from settings string
export function breakOutSettings(settings?: string | null) {
    //Break out settings
    let output: {
        storeName?: string | null,
        bindings?: string[] | null,
        ingressFunc?: ProcessFunction,
        propagations?: string[] | null,
        egressFunc?: ProcessFunction
    } = {};

    //Loop through parts to assign settings
    let s = settings?.split(" ") || [];
    for(let i=0; i < s.length; i++) {
        const setting = s[i];
        const parts = setting.split(":");

        if(!i) {
            output.storeName = parts[0];
            output.bindings = parts[1]?.split("|");
            continue;
        }

        //If parts > 1, it's either a storeName-bindings pair or a sync-propagations pair
        if(parts?.[0] === "sync") {
            output.propagations = parts[1]?.split("|");
            continue;
        }

        //Otherwise, it's a processing function
        if(!output.propagations) output.ingressFunc = window[setting as any] as unknown as ProcessFunction;
        else output.egressFunc = window[setting as any] as unknown as ProcessFunction;
    }
    
    return output;
}


//Get store from name
export function storeFromName(name?: string | null) {
    name = name?.split(/[\.\[]/g)[0];   //Remove any pathing
    let store: Store<any> | undefined = get(name || "");
    if(!store) {
        //@ts-ignore - Get store
        store = window[name] as Store<any>;
    }

    return store;
}

//Register DOM subscription
export function registerDomSubscription(element: HTMLElement, store: Store<any> | null, storePath: string, processFunc?: ProcessFunction, bindTo?: string | null, bindType?: string | null, cb?: (data: {val: any, el: HTMLElement})=> void) {
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

            console.log("Calling back", store.name, element, val)
            cb?.({val, el: element});
        }

        //Add subscription - run whenever store updates
        store.addSub(
            element,
            domSubscription
        );
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