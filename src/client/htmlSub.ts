import { copperConfig } from "../general/config";
import { Store } from "./store";

//Register subscriptions on the DOM (scopable in case an update needs run on a subset of the DOM)
export function registerSubs(parent?: Element) {
    if(!parent) parent = document.body;
    handleDataBinding(parent);
    // handleEvals(parent);
}

function breakOutSettings(element: HTMLElement, attribute: string, allowNullBinding = false): {storeName: string, bindings: string[], remaining: string} | null {
    const subSettings = element?.getAttribute(attribute)?.trim()?.split(" ");
    if(!subSettings) return null;

    //Break out settings
    const nameAndBinding = subSettings[0].split(":");
    const storeName = nameAndBinding[0].trim();
    const bindings = nameAndBinding[1]?.trim().split("|");

    let ingressFunc: Function | null = null;
    let propagations: string[] | null = null;
    let egressFunc: Function | null = null;

    //Check remaining settings - processing function or propagation events
    if(subSettings[1]?.includes(":")) {

    }
    else {

    }

    //Check remaining settings - processing function or propagation events
    if(subSettings[2]?.includes(":")) {

    }
    else {

    }

    //Check remaining settings - processing function or propagation events
    if(subSettings[3]?.includes(":")) {

    }
    else {

    }

    const remaining = subSettings[1]?.split(":");
    
    //Abort if no storeName or bindTo
    if(!storeName || (!allowNullBinding && !bindings)) return null;
    return {storeName, bindings, remaining};
}

function applyBindings(element: HTMLElement, bindTo: string | null, storeName: string, propagateOn?: string[], execFunc?: Function) {
    let attr = false;
    if(bindTo && bindTo.includes("attr-")) {
        attr = true;
        bindTo = bindTo.replace("attr-", "");
    }

    let store: Store<any> = Store.getStore(storeName);
    if(!store) {
        //@ts-ignore - Get store
        store = window[storeName] as Store<any>;
    }

    store.addDomSubscription(
        element,
        (val)=> {
            if(execFunc) val = execFunc(val, element);

            if(bindTo) {
                //@ts-ignore - Update DOM value
                if(!attr) element[bindTo] = val;
                else element.setAttribute(bindTo, val);

                //For each propogation event
                for(let eventName of propagateOn || []) {
                    const eventFunc = (e: Event)=> { 
                        store.update(
                            !attr ?
                            //@ts-ignore
                            e.currentTarget[bindTo] :
                            (e.currentTarget as HTMLElement)?.getAttribute(bindTo as string)
                        );
                    }
                    //Clear previous event listener (preventing reassingment) and bind new one
                    element.removeEventListener(eventName, eventFunc);
                    element.addEventListener(eventName, eventFunc)
                }
            }
        }
    );
}

//Handle data binding
function handleDataBinding(parent: Element) {
    const subBlocks = parent.querySelectorAll(`[${copperConfig.bindAttr}], [data-${copperConfig.bindAttr}]`);

    subBlocks.forEach((b)=> {
        let settings = breakOutSettings(b as HTMLElement, copperConfig.bindAttr);
        if(!settings) {
            console.warn("Copper: Data binding must have a store name and bindTo attribute. Bind aborted.", b);
            return;
        }
        let {storeName, bindings, remaining} = settings;
        let propagateOn = remaining?.replace("sync:", "")?.trim()?.split("|") || [];

        //Add or overwrite DOM subscription method
        for(let bindTo of bindings) {
            applyBindings(b as HTMLElement, bindTo, storeName, propagateOn);
        }
    });
}

// Handle function evals
// function handleEvals(parent: Element) {
//     const subBlocks = parent.querySelectorAll(`[${copperConfig.evalAttr}], [data-${copperConfig.evalAttr}]`);

//     subBlocks.forEach((b)=> {
//         let settings = breakOutSettings(b as HTMLElement, copperConfig.evalAttr, true);
//         if(!settings) {
//             console.warn("Copper: Eval binding must have a store name and can optionally have a bindTo attribute. Bind aborted.", b);
//             return;
//         }
//         let {storeName, bindings, remaining} = settings;
//         const execFunc = window[remaining as any];
//         if(!execFunc || typeof execFunc !== "function") return;

//         //Add or overwrite DOM subscription method
//         for(let bindTo of bindings || [null]) {
//             applyBindings(b as HTMLElement, bindTo, storeName, undefined, execFunc)
//         }
//     });
// }
