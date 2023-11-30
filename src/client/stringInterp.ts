import {copperConfig} from "../general/config";
import {breakOutSettings, forSelected, registerDomSubscription, storeFromName} from "./clientRoot";

//Handle data binding
export function handleStringInterpolation(parent: Element) {
    forSelected(parent as HTMLElement, copperConfig.attr.interpValue, null, (b, settingsString)=> {
        const { storeName, ingressFunc } = breakOutSettings(settingsString);
        const store = storeFromName(storeName);
        const isHTML = (b as HTMLElement).getAttribute(copperConfig.attr.htmlFlag) !== null;
        registerDomSubscription(b as HTMLElement, store, ingressFunc, isHTML ? "innerHTML" : "innerText");
    });
}
