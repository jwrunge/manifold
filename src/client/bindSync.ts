import { breakOutSettings, registerDomSubscription, storeFromName } from "./clientRoot";
import { copperConfig as cc } from "../general/config";

export function handleDataBinding(el: Element) {
    el?.getAttribute(cc.attr.bind)?.split(";").forEach(setting=> {
        const { storeName, bindings, ingressFunc, propagations, egressFunc } = breakOutSettings(setting);

        //Add or overwrite DOM subscription method
        for(let bindTo of bindings || [null]) {
            let attr = bindTo?.includes("attr-") || false;
            bindTo = bindTo?.replace("attr-", "") || null;

            const store = storeFromName(storeName);
            registerDomSubscription(el as HTMLElement, store, ingressFunc, bindTo, attr);
            // registerPropagationListeners(el as HTMLElement, store, propagations || [], egressFunc, bindTo, attr);
            for(let eventName of propagations || []) {
                const eventFunc = (e: Event)=> { 
                    //@ts-ignore - Get value
                    let value = attr ? (e.currentTarget as HTMLElement)?.getAttribute(bindTo as string) : e.currentTarget[bindTo];
        
                    value = egressFunc?.(value, el as HTMLElement) || value;    //If egress function, run it
                    store?.update(value);
                }
                
                //Clear previous event listener (preventing reassingment) and bind new one
                (el as HTMLElement).removeEventListener(eventName, eventFunc);
                (el as HTMLElement).addEventListener(eventName, eventFunc);
            }
        }
    })
}
