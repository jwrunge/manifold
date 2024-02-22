import { breakOutSettings, registerDomSubscription, registerChangeListener } from "./util";
import { Store } from "./store";

export function handleDataBindSync(el: HTMLElement, fn: string) {
    console.log("HANDLE DATA BIND SYNC")
    el?.dataset?.[fn]?.split(";").forEach(setting=> {
        console.log("Settings", setting)
        const { source, props, processFunc, triggers } = breakOutSettings(setting);
        console.log("FROM BREAKOUT", source, props, processFunc, triggers)
        const store = Store.box(source);

        console.log(`Setting up ${fn}`, el, setting)

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