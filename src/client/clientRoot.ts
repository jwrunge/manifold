import { copperConfig as cc } from "../general/config";
import { handleDataBinding } from "./bindSync";
import { Store } from "./store";
import { handleStringInterpolation } from "./stringInterp";
import { ProcessFunction, get as getStore } from "./util";

//Register subscriptions on the DOM (scopable in case an update needs run on a subset of the DOM)
export function registerSubs(parent?: Element) {
    if(!parent) parent = document.body;
    const selectors = [];
    for(let attr in cc.attr) {
        //@ts-ignore
        selectors.push(`[${cc.attr[attr]}]`);
        //@ts-ignore
        selectors.push(`[data-${cc.attr[attr]}]`);
    }

    console.log(parent, selectors.join(","), parent?.querySelectorAll(selectors.join(",")))
    parent?.querySelectorAll(selectors.join(",")).forEach(el=> {
        console.log(el)
        if(el.hasAttribute(cc.attr.bind) || el.hasAttribute(`data-${cc.attr.bind}`)) handleDataBinding(el as HTMLElement);
        if(el.hasAttribute(cc.attr.interpValue) || el.hasAttribute(`data-${cc.attr.interpValue}`)) handleStringInterpolation(el as HTMLElement);
    });
}

//Iterate over selectors
export function forSelected(el: HTMLElement, prop: string, splitChar: string | null, cb: (el: HTMLElement, setting: string | null)=> void) {
    const subSettingsStr = el?.getAttribute(prop);
    const subSettings = splitChar ? subSettingsStr?.split(splitChar) : [subSettingsStr];

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
        if(parts.length > 1 && parts[0] === "sync") {
            output.propagations = parts[1]?.split("|");
            continue;
        }

        //Otherwise, it's a processing function
        if(!output.propagations) output.ingressFunc = window[setting as any] as unknown as ProcessFunction;
        else output.egressFunc = window[setting as any] as unknown as ProcessFunction;
    }
    
    //Abort if no storeName or bindTo
    return output;
}


//Get store from name
export function storeFromName(name?: string | null) {
    if(!name) return null;

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
            if(processFunc) val = processFunc(val, element);    //If ingress function, run it

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
            let value = !attr ? e.currentTarget[bindTo] : (e.currentTarget as HTMLElement)?.getAttribute(bindTo as string);

            if(processFunc) value = processFunc(value, element);    //If egress function, run it
            if(store) {
                store.update(value);
            }
        }
        
        //Clear previous event listener (preventing reassingment) and bind new one
        element.removeEventListener(eventName, eventFunc);
        element.addEventListener(eventName, eventFunc)
    }
}
