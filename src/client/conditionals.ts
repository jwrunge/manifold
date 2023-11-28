import {copperConfig} from "../general/config";
import {breakOutSettings, forSelected, registerDomSubscription, storeFromName} from "./clientRoot";

//Handle data binding
export function handleConditionals(parent: Element) {
    forSelected(parent as HTMLElement, copperConfig.ifAttr, true, null, (b, settingsString)=> {
        const { storeName, ingressFunc } = breakOutSettings(settingsString);

        //Check for else statements
        let elseIfBlocks: HTMLElement[] = [];
        let elseBlock: HTMLElement | null = null;
        while(b.nextElementSibling) {
            
        }

        const store = storeFromName(storeName);
        registerDomSubscription(b as HTMLElement, store, ingressFunc, isHTML ? "innerHTML" : "innerText");
    });
}
