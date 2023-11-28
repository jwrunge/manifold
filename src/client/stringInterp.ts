import {copperConfig} from "../general/config";
import {storeFromName} from "./util";

//Handle data binding
export function handleStringInterpolation(parent: Element) {
    const subBlocks = parent.querySelectorAll(copperConfig.interpTag);

    subBlocks.forEach((b)=> {
        const settings = b?.getAttribute(copperConfig.interpValueAttr)?.trim().split(" "); //Get all settings packs
        
        if(!settings?.[0]) return;

        const storeName = settings[0];
        const store = storeFromName(storeName);

        if(!store) return;

        const processFunc: ((val: any, el: HTMLElement)=> string) | null = 
            settings[1] ? 
            window[settings[1] as any] as unknown as (val: any, el: HTMLElement)=> string : 
            null;

        const domSubscription = (val: any)=> {
            if(processFunc) val = processFunc(val, b as HTMLElement);    //If ingress function, run it

            const isHTML = (b as HTMLElement).getAttribute(copperConfig.htmlFlagAttr) !== null;
            console.log("isHTML", isHTML, (b as HTMLElement).getAttribute(copperConfig.htmlFlagAttr));
            if(isHTML) b.innerHTML = val;
            else (b as HTMLElement).innerText = val;
        }

        //Add subscription - run whenever store updates
        store.addDomSubscription(
            b as HTMLElement,
            domSubscription
        );

        domSubscription(store.value);   //Run subscription once to initialize
    });
}
