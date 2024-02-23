import { breakOutSettings, registerDomSubscription, unNestedSourceName } from "./util";
import { Store } from "./store";

export function handleDataBindSync(el: HTMLElement, fn: string) {
    el?.dataset?.[fn]?.split(";").forEach(setting=> {
        const { source, props, processFunc, triggers } = breakOutSettings(setting, fn);
        const { sourceName, sourcePath } = unNestedSourceName(source);
        const store = Store.box(sourceName);

        if(el.classList.contains("trans")) {
            console.log("TRANS", sourceName, store, processFunc, props, triggers, fn, el, setting)
        }

        //Add or overwrite DOM subscription method
        for(let bindTo of props?.length ? props : [null]) {
            const bindType = bindTo?.includes("style-") ? "style" : bindTo?.includes("attr-") ? "attr" : "";
            if(bindType) bindTo = bindTo?.replace(`${bindType}-`, "") || null;

            //If bind, bind store to prop
            if(fn === "bind") registerDomSubscription(el, store, sourcePath || "", processFunc, bindTo, bindType);
            else {
                //If sync, bind prop to event
                for(const eventName of triggers || []) {
                    //Clear previous event listener (preventing reassingment) and bind new one
                    const oldEv = Store._evs?.get(el)
                    if(oldEv) el.removeEventListener(eventName, oldEv);

                    //Create new listener
                    const eventFunc = (e: Event)=> { 
                        //@ts-ignore
                        let value = bindType === "style" ? el.style.getPropertyValue(bindTo as string) : bindType === "attr" ? el.getAttribute(bindTo as string) : el[bindTo];
                        value = Store.func(processFunc || "")?.({val: value, el: el as HTMLElement}) || value;    //If egress function, run it
                        
                        if(sourcePath) {
                            store?.update((curVal: any)=> {
                                alert("Unsupported")
                            })
                        }
                        else store?.update(value);
                    }

                    Store._evs.set(el, eventFunc);
                    el.addEventListener(eventName, eventFunc);
                }
            }
        }
    });
}