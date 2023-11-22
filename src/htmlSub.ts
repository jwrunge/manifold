import { copperConfig } from "./config";
import { Store } from "./store";

//Register subscriptions on the DOM (scopable in case an update needs run on a subset of the DOM)
export function registerSubs(parent?: Element) {
    if(!parent) parent = document.body;
    const subBlocks = parent.querySelectorAll(`[${copperConfig.subAttr}]`);

    subBlocks.forEach((b)=> {
        //subSettings should be something like "storeName:DependencyType.DependencyOption"
        const subSettings = (b as HTMLElement)?.getAttribute(copperConfig.subAttr)?.trim()?.split(" ");
        if(!subSettings) return;

        //Break out settings
        const nameAndBinding = subSettings[0].split(":");
        const storeName = nameAndBinding[0].trim();
        const bindTo = nameAndBinding[1].trim();
        let propogateOn = subSettings[1]?.replace("sync:", "")?.trim().split("|");

        //Abort if no storeName or bindTo
        if(!storeName || !bindTo) return;

        //Ensure propogateOn is an array and has intended default value
        if(!propogateOn) propogateOn = [];

        console.log(storeName, bindTo, propogateOn)

        //@ts-ignore - Get store
        const store: Store<any> = window[storeName] as Store<any>;
        //Add or overwrite DOM subscription method
        if((b as HTMLInputElement)) {
            store.addDomSubscription(
                b,
                (val)=> {
                    //@ts-ignore - Update DOM value
                    (b as HTMLInputElement).setAttribute(bindTo, val);
                    //@ts-ignore
                    (b as HTMLInputElement)[bindTo] = val;

                    //For each propogation event
                    for(let eventName of propogateOn) {
                        const eventFunc = (e: Event)=> { 
                            store.update(
                                //@ts-ignore
                                (e.currentTarget as HTMLInputElement)[bindTo]
                            );
                        }
                        //Clear previous event listener (preventing reassingment) and bind new one
                        b.removeEventListener(eventName, eventFunc);
                        b.addEventListener(eventName, eventFunc)
                    }
                }
            );
        }
    })
}

