import {breakOutSettings, forSelected, registerDomSubscription, storeFromName} from "./clientRoot";

//Handle data binding
export function handleStringInterpolation(parent: Element) {
    forSelected(parent as HTMLElement, "cp-value", null, (b, settingsString)=> {
        const { storeName, ingressFunc } = breakOutSettings(settingsString);
        const isHTML = (b as HTMLElement).getAttribute("cp-html") !== null;
        registerDomSubscription(
            b as HTMLElement, 
            storeFromName(storeName), 
            ingressFunc, 
            isHTML ? "innerHTML" : "innerText"
        );
    });
}
