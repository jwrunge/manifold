import {copperConfig as cc} from "../general/config";
import {breakOutSettings, registerDomSubscription, storeFromName} from "./util";

//Handle data binding
export function handleConditionals(el: Element) {
    const settings = el?.getAttribute(cc.attr.if);
    const { storeName, ingressFunc } = breakOutSettings(settings);
    
}
