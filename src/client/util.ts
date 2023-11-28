import { handleDataBinding } from "./bindSync";
import { handleStringInterpolation } from "./stringInterp";
import { Store } from "./store";

export type ProcessFunction = ((val: any, el?: HTMLElement)=> any) | null

//Register subscriptions on the DOM (scopable in case an update needs run on a subset of the DOM)
export function registerSubs(parent?: Element) {
    if(!parent) parent = document.body;
    handleDataBinding(parent);
    handleStringInterpolation(parent);
}

//Get store from name
export function storeFromName(name?: string | null) {
    if(!name) return null;

    let store: Store<any>;
    try {
        store = get(name || "");
    }
    catch(_) {
        //@ts-ignore - Get store
        store = window[storeName] as Store<any>;
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

/*
 *  Utility functions to access stores without picking apart nested properties
 */
export function get(name: string) {
    const store = Store.storeMap.get(name);
    if(!store) throw new Error(`Store ${name} not found`);
    return store;
}

export function remove(name: string) {
    Store.storeMap.delete(name);
}

export function valueof(name: string) {
    return get(name)?.value;
}

export function update(name: string, value: any) {
    get(name)?.update(value);
}
