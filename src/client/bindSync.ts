import { copperConfig } from "../general/config";
import { breakOutSettings, forSelected, registerDomSubscription, registerPropagationListeners, storeFromName } from "./clientRoot";

//Handle data binding
export function handleDataBinding(el: Element) {
    forSelected(el as HTMLElement, copperConfig.attr.bind, ";", (el, setting)=> {
        const { storeName, bindings, ingressFunc, propagations, egressFunc } = breakOutSettings(setting);

        //Add or overwrite DOM subscription method
        for(let bindTo of bindings || [null]) {
            let attr = bindTo?.includes("attr-") || false;
            bindTo = bindTo?.replace("attr-", "") || null;

            const store = storeFromName(storeName);
            registerDomSubscription(el, store, ingressFunc, bindTo, attr);
            registerPropagationListeners(el, store, propagations || [], egressFunc, bindTo, attr);
        }
    });
}
