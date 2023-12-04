import { handleDataBinding } from "./bindSync";
import { Store } from "./store";
import { handleStringInterpolation } from "./stringInterp";
import { ProcessFunction, get as getStore } from "./util";
import { copperDefaults as cd } from "../general/config";

//Register subscriptions on the DOM (scopable in case an update needs run on a subset of the DOM)
export function registerSubs(parent?: Element) {
    const selectors = [cd.el.interpString, `[${cd.attr.bind}]`, `[data-${cd.attr.bind}]`];

    (parent || document.body)?.querySelectorAll(selectors.join(",")).forEach(el=> {
        if(el.tagName == cd.el.interpString.toUpperCase()) {
            handleStringInterpolation(el as HTMLElement);
        }
        else if(el.hasAttribute(cd.attr.bind) || el.hasAttribute(`data-${cd.attr.bind}`)) handleDataBinding(el as HTMLElement);
    });
}

//Iterate over selectors
export function forSelected(el: HTMLElement, prop: string, splitChar: string | null, cb: (el: HTMLElement, setting: string | null)=> void) {
    const subSettings = splitChar ? el?.getAttribute(prop)?.split(splitChar) : [el?.getAttribute(prop)];

    for(const setting of subSettings || []) {
        cb(el as HTMLElement, setting);
    }
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

    if(!settings) return output;

    //Loop through parts to assign settings
    let s = settings.split(" ");
    for(let i=0; i < s.length; i++) {
        const setting = s[i];
        const parts = setting.split(":");

        if(i === 0) {
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
    let store: Store<any>;
    try {
        store = getStore(name || "");
    }
    catch(_) {
        //@ts-ignore - Get store
        store = window[name] as Store<any>;
    }

    return store;
}

//Register DOM subscription
export function registerDomSubscription(element: HTMLElement, store: Store<any> | null, processFunc?: ProcessFunction, bindTo?: string | null, attr = false) {
    if(store) {
        const domSubscription = (val: any)=> {
            val = processFunc?.(val, element) || val;    //If ingress function, run it

            if(bindTo) {
                //@ts-ignore - Update DOM value
                if(!attr) element[bindTo] = val;
                else element.setAttribute(bindTo, val);
            }
        }

        //Add subscription - run whenever store updates
        store.addSubscription(
            element,
            domSubscription
        );

        domSubscription(store.value);   //Run subscription once to initialize
    }
}

//Register event listeners from propagation list
export function registerPropagationListeners(element: HTMLElement, store: Store<any> | null, propagations: string[], processFunc?: ProcessFunction, bindTo?: string | null, attr = false) {
    for(let eventName of propagations) {
        const eventFunc = (e: Event)=> { 
            //@ts-ignore - Get value
            let value = attr ? (e.currentTarget as HTMLElement)?.getAttribute(bindTo as string) : e.currentTarget[bindTo];

            value = processFunc?.(value, element) || value;    //If egress function, run it
            store?.update(value);
        }
        
        //Clear previous event listener (preventing reassingment) and bind new one
        element.removeEventListener(eventName, eventFunc);
        element.addEventListener(eventName, eventFunc);
    }
}
