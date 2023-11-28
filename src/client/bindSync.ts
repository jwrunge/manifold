import { copperConfig } from "../general/config";
import { Store } from "./store";
import { storeFromName } from "./util";

//Handle data binding
export function handleDataBinding(parent: Element) {
    const subBlocks = parent.querySelectorAll(`[${copperConfig.bindAttr}], [data-${copperConfig.bindAttr}]`);

    subBlocks.forEach((b)=> {
        const subSettings = b?.getAttribute(copperConfig.bindAttr)?.trim()?.split(";"); //Get all settings packs
        if(!subSettings || subSettings.length === 0) return;

        //Loop over settings packs
        for(let subSetting of subSettings) {
            const { storeName, bindings, ingressFunc, propagations, egressFunc } = breakOutSettings(subSetting);

            //Add or overwrite DOM subscription method
            for(let bindTo of bindings || [null]) {
                applyBindings(b as HTMLElement, bindTo, storeName, propagations || [], ingressFunc, egressFunc);
            }
        }
    });
}

function breakOutSettings(settings: string): {
    storeName: string | null, 
    bindings: string[] | null, 
    ingressFunc: Function | null,
    propagations: string[] | null,
    egressFunc: Function | null
} {
    //Break out settings
    let storeName: string | null = null;
    let bindings: string[] | null = null;
    let ingressFunc: Function | null = null;
    let propagations: string[] | null = null;
    let egressFunc: Function | null = null;

    //Loop through parts to assign settings
    let s = settings.split(" ");
    for(let i=0; i < s.length; i++) {
        const setting = s[i];
        const parts = setting.split(":");

        if(i === 0) {
            storeName = parts[0];
            bindings = parts[1]?.split("|");
            continue;
        }

        //If parts > 1, it's either a storeName-bindings pair or a sync-propagations pair
        if(parts.length > 1 && parts[0] === "sync") {
            propagations = parts[1]?.split("|");
            continue;
        }

        //Otherwise, it's a processing function
        //@ts-ignore
        if(!propagations) ingressFunc = window[setting]
        //@ts-ignore
        else egressFunc = window[setting];
    }
    
    //Abort if no storeName or bindTo
    return {storeName, bindings, ingressFunc, propagations, egressFunc};
}

function applyBindings(element: HTMLElement, bindTo: string | null, storeName: string | null, propagations: string[], ingressFunc: Function | null, egressFunc: Function | null) {
    let attr = false;
    if(bindTo && bindTo.includes("attr-")) {
        attr = true;
        bindTo = bindTo.replace("attr-", "");
    }

    const store = storeFromName(storeName);

    if(store) {
        const domSubscription = (val: any)=> {
            if(ingressFunc) val = ingressFunc(val, element);    //If ingress function, run it

            if(bindTo) {
                //@ts-ignore - Update DOM value
                if(!attr) element[bindTo] = val;
                else element.setAttribute(bindTo, val);
            }
        }

        //Add subscription - run whenever store updates
        store.addDomSubscription(
            element,
            domSubscription
        );

        domSubscription(store.value);   //Run subscription once to initialize
    }

    //Add event listeners to element for each propagation event
    for(let eventName of propagations) {
        const eventFunc = (e: Event)=> { 
            //@ts-ignore - Get value
            let value = !attr ? e.currentTarget[bindTo] : (e.currentTarget as HTMLElement)?.getAttribute(bindTo as string);

            if(egressFunc) value = egressFunc(value, element);    //If egress function, run it
            if(store) {
                store.update(value);
            }
        }
        
        //Clear previous event listener (preventing reassingment) and bind new one
        element.removeEventListener(eventName, eventFunc);
        element.addEventListener(eventName, eventFunc)
    }
}
