import { breakOutSettings, registerDomSubscription, registerChangeListener } from "./util";
import { Store } from "./store";

export function handleDataBindSync(el: HTMLElement, fn: string) {
    el?.dataset?.[fn]?.split(";").forEach(setting=> {
        const { source, props, processFunc, triggers } = breakOutSettings(setting);
        const store = Store.box(source);

        //Add or overwrite DOM subscription method
        for(let bindTo of props || [null]) {
            const bindType = bindTo.includes("style-") ? "style" : "attr";
            bindTo = bindTo.replace(`${bindType}-`, "");

            //If bind, bind store to prop
            if(fn === "bind") registerDomSubscription(el, store, source || "", processFunc, bindTo, bindType);
            else registerChangeListener(el, store, processFunc, bindTo, bindType, triggers);
        }
    });
}