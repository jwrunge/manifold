import { copperConfig } from "../general/config";
import { ProcessFunction, registerDomSubscription, registerPropagationListeners, storeFromName } from "./util";

//Handle data binding
export function handleDataBinding(parent: Element) {
    const subBlocks = parent.querySelectorAll(`[${copperConfig.bindAttr}], [data-${copperConfig.bindAttr}]`);

    subBlocks.forEach((b)=> {
        const subSettings = b?.getAttribute(copperConfig.bindAttr)?.trim()?.split(";"); //Get all settings packs

        //Loop over settings packs
        for(let subSetting of subSettings || []) {
            const { storeName, bindings, ingressFunc, propagations, egressFunc } = breakOutSettings(subSetting);

            //Add or overwrite DOM subscription method
            for(let bindTo of bindings || [null]) {
                let attr = bindTo?.includes("attr-") || false;
                bindTo = bindTo?.replace("attr-", "") || null;

                const store = storeFromName(storeName);
                registerDomSubscription(b as HTMLElement, store, ingressFunc, bindTo, attr);
                registerPropagationListeners(b as HTMLElement, store, propagations || [], egressFunc, bindTo, attr);
            }
        }
    });
}

function breakOutSettings(settings: string) {
    //Break out settings
    let output: {
        storeName?: string | null,
        bindings?: string[] | null,
        ingressFunc?: ProcessFunction,
        propagations?: string[] | null,
        egressFunc?: ProcessFunction
    } = {};

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
