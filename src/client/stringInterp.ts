import {breakOutSettings, registerDomSubscription, storeFromName} from "./clientRoot";
import { copperDefaults as cd } from "../general/config";

export function handleStringInterpolation(el: HTMLElement) {
    const settings = el?.getAttribute(cd.attr.value);
    const { storeName, ingressFunc } = breakOutSettings(settings);
    registerDomSubscription(
        el as HTMLElement, 
        storeFromName(storeName), 
        ingressFunc, 
        (el as HTMLElement).getAttribute(cd.attr.html) !== null ? "innerHTML" : "innerText"
    );
}
