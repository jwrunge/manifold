import { breakOutSettings, registerDomSubscription, unNestedSourceName, nestedValue } from "./util";
import { Store } from "./store";

export function handleDataBindSync(el: HTMLElement, fn: string) {
    el?.dataset?.[fn]?.split(";").forEach(setting=> {
        const { source, props, processFunc, triggers } = breakOutSettings(setting, fn);
        const { sourceName, sourcePath } = unNestedSourceName(source);
        const store = Store.box(sourceName);

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
                    const oldEv = Store._evs?.get({el, target: sourcePath || ""})
                    if(oldEv) el.removeEventListener(eventName, oldEv);

                    //Create new listener
                    const eventFunc = (e: Event)=> { 
                        //@ts-ignore
                        let value = bindType === "style" ? el.style.getPropertyValue(bindTo as string) : bindType === "attr" ? el.getAttribute(bindTo as string) : el[bindTo];
                        value = Store.func(processFunc || "")?.({val: value, el: el as HTMLElement}) || value;    //If egress function, run it
                        
                        if(sourcePath) {
                            store?.update((curVal: any)=> {
                                if(!sourcePath) return curVal;

                                if(curVal == undefined) {
                                    if(sourcePath.startsWith("[")) curVal = new Array();
                                    else curVal = new Object();
                                }
                                nestedValue(curVal, sourcePath, value);
                                return curVal;
                            })
                        }
                        else store?.update(value);
                    }

                    Store._evs.set({el, target: sourcePath || ""}, eventFunc);
                    el.addEventListener(eventName, eventFunc);
                }
            }
        }
    });
}