import {copperConfig as cc} from "../general/config";
import {breakOutSettings, forSelected, registerDomSubscription, storeFromName} from "./clientRoot";

//Handle data binding
export function handleConditionals(parent: Element) {
    forSelected(parent as HTMLElement, cc.attr.if, null, (b, settingsString)=> {
        const { storeName, ingressFunc } = breakOutSettings(settingsString);

        //Check for else statements
        let elseIfBlocks: HTMLElement[] = [];
        let elseBlock: HTMLElement | null = null;
        let sibling: HTMLElement | null;

        do {
            sibling = b.nextElementSibling as HTMLElement | null;
            if(sibling && sibling.hasAttribute(cc.attr.else)) {
                elseBlock = sibling;
            } else if(sibling && sibling.hasAttribute(cc.attr.elseif)) {
                elseIfBlocks.push(sibling);
            }
        } while(sibling);

        const store = storeFromName(storeName);
        // registerDomSubscription(b as HTMLElement, store, ingressFunc, isHTML ? "innerHTML" : "innerText");
    });
}
