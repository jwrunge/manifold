import {breakOutSettings, registerDomSubscription, storeFromName} from "./clientRoot";
import { copperConfig as cc } from "../general/config";

export function handleStringInterpolation(el: HTMLElement) {
    const settings = el?.getAttribute(cc.attr.value);
    const { storeName, ingressFunc } = breakOutSettings(settings);
    registerDomSubscription(
        el as HTMLElement, 
        storeFromName(storeName), 
        ingressFunc, 
        (el as HTMLElement).getAttribute(cc.attr.html) !== null ? "innerHTML" : "innerText"
    );
}
