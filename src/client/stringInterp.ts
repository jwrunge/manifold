import {copperConfig} from "../general/config";
import {ProcessFunction, registerDomSubscription, storeFromName} from "./util";

//Handle data binding
export function handleStringInterpolation(parent: Element) {
    const subBlocks = parent.querySelectorAll(copperConfig.interpTag);

    subBlocks.forEach((b)=> {
        const settings = b?.getAttribute(copperConfig.interpValueAttr)?.trim().split(" "); //Get all settings packs
        
        if(!settings?.[0]) return;

        const storeName = settings[0];
        const store = storeFromName(storeName);

        if(!store) return;

        const processFunc: ProcessFunction = 
            settings[1] ? 
            window[settings[1] as any] as unknown as ProcessFunction : 
            null;

        const isHTML = (b as HTMLElement).getAttribute(copperConfig.htmlFlagAttr) !== null;
        registerDomSubscription(b as HTMLElement, store, processFunc, isHTML ? "innerHTML" : "innerText");
    });
}
