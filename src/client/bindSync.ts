import { breakOutSettings, registerDomSubscription, registerPropagationListeners, storeFromName } from "./clientRoot";
import { copperDefaults as cd } from "../general/config";

export function handleDataBinding(el: Element) {
    el?.getAttribute(cd.attr.bind)?.split(";").forEach(setting=> {
        const { storeName, bindings, ingressFunc, propagations, egressFunc } = breakOutSettings(setting);

        //Add or overwrite DOM subscription method
        for(let bindTo of bindings || [null]) {
            let attr = bindTo?.includes("attr-") || false;
            bindTo = bindTo?.replace("attr-", "") || null;

            const store = storeFromName(storeName);
            registerDomSubscription(el as HTMLElement, store, ingressFunc, bindTo, attr);
            registerPropagationListeners(el as HTMLElement, store, propagations || [], egressFunc, bindTo, attr);
        }
    })
}
