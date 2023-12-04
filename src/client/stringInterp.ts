import {breakOutSettings, forSelected, registerDomSubscription, storeFromName} from "./clientRoot";
import { copperDefaults as cd } from "../general/config";

export function handleStringInterpolation(parent: Element) {
    forSelected(parent as HTMLElement, cd.attr.value, null, (b, settingsString)=> {
        const { storeName, ingressFunc } = breakOutSettings(settingsString);
        const isHTML = (b as HTMLElement).getAttribute(cd.attr.html) !== null;
        console.log(b, isHTML, cd.attr.html)
        registerDomSubscription(
            b as HTMLElement, 
            storeFromName(storeName), 
            ingressFunc, 
            isHTML ? "innerHTML" : "innerText"
        );
    });
}
