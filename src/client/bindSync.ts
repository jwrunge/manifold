import { breakOutSettings, registerDomSubscription, storeFromName } from "./util";
import { copperConfig as cc } from "../general/config";

export function handleDataBinding(el: Element) {
    el?.getAttribute(cc.attr.bind)?.split(";").forEach(setting=> {
        const { storeName, bindings, ingressFunc, propagations, egressFunc } = breakOutSettings(setting);

        //Add or overwrite DOM subscription method
        for(let bindTo of bindings || [null]) {
            let bindType: "attr" | "style" | null = null;
            if(bindTo?.includes("attr-")) {
                bindType = "attr";
                bindTo = bindTo.replace("attr-", "");
            }
            else if(bindTo?.includes("style-")) {
                bindType = "style";
                bindTo = bindTo.replace("style-", "");
            }

            const store = storeFromName(storeName);
            registerDomSubscription(el as HTMLElement, store, storeName || "", ingressFunc, bindTo, bindType);
            
            for(let eventName of propagations || []) {
                const eventFunc = (e: Event)=> { 
                    let value = bindType === "attr" ? 
                        (e.currentTarget as HTMLElement)?.getAttribute(bindTo as string) : 
                        bindType === "style" ?
                        (e.currentTarget as HTMLElement)?.style.getPropertyValue(bindTo as string) :
                        //@ts-ignore
                        e.currentTarget[bindTo];
        
                    value = egressFunc?.({val: value, el: el as HTMLElement}) || value;    //If egress function, run it
                    store?.update(value);
                }
                
                //Clear previous event listener (preventing reassingment) and bind new one
                (el as HTMLElement).removeEventListener(eventName, eventFunc);
                (el as HTMLElement).addEventListener(eventName, eventFunc);
            }
        }
    })
}
