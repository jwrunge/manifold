import { copperConfig } from "./config";
import { Store } from "./store";

//Register subscriptions on the DOM (scopable in case an update needs run on a subset of the DOM)
export function registerSubs(parent?: Element) {
    if(!parent) parent = document.body;
    handleDataBinding(parent);
    handleEvals(parent);
}

function breakOutSettings(element: HTMLElement, attribute: string): {storeName: string, bindTo: string, remaining: string} | null {
    const subSettings = element?.getAttribute(attribute)?.trim()?.split(" ");
    if(!subSettings) return null;

    //Break out settings
    const nameAndBinding = subSettings[0].split(":");
    const storeName = nameAndBinding[0].trim();
    const bindTo = nameAndBinding[1].trim();
    const remaining = subSettings[1]?.trim();
    
    //Abort if no storeName or bindTo
    if(!storeName || !bindTo) return null;
    return {storeName, bindTo, remaining};
}

//Handle data binding
function handleDataBinding(parent: Element) {
    const subBlocks = parent.querySelectorAll(`[${copperConfig.bindAttr}]`);

    subBlocks.forEach((b)=> {
        let settings = breakOutSettings(b as HTMLElement, copperConfig.bindAttr);
        if(!settings) return;
        let {storeName, bindTo, remaining} = settings;
        let propogateOn = remaining?.replace("sync:", "")?.trim()?.split("|") || [];

        //@ts-ignore - Get store
        const store: Store<any> = window[storeName] as Store<any>;
        //Add or overwrite DOM subscription method
        store.addDomSubscription(
            b,
            (val)=> {
                //@ts-ignore - Update DOM value
                b.setAttribute(bindTo, val);
                //@ts-ignore
                b[bindTo] = val;

                //For each propogation event
                for(let eventName of propogateOn) {
                    const eventFunc = (e: Event)=> { 
                        store.update(
                            //@ts-ignore
                            e.currentTarget[bindTo]
                        );
                    }
                    //Clear previous event listener (preventing reassingment) and bind new one
                    b.removeEventListener(eventName, eventFunc);
                    b.addEventListener(eventName, eventFunc)
                }
            }
        );
    });
}

// Handle function evals
function handleEvals(parent: Element) {
    const subBlocks = parent.querySelectorAll(`[${copperConfig.evalAttr}]`);

    subBlocks.forEach((b)=> {
        let settings = breakOutSettings(b as HTMLElement, copperConfig.evalAttr);
        if(!settings) return;
        let {storeName, bindTo, remaining} = settings;
        const execFunc = window[remaining as any];

        console.log("eval", execFunc)

        if(!execFunc || typeof execFunc !== "function") return;

        //@ts-ignore - Get store
        const store: Store<any> = window[storeName] as Store<any>;
        //Add or overwrite DOM subscription method
        store.addDomSubscription(
            b,
            (val)=> {
                console.log("Running func", val)
                const newVal = (execFunc as Function)(val);
                console.log("Got", newVal)
                //@ts-ignore - Update DOM value
                b.setAttribute(bindTo, newVal);
                //@ts-ignore
                b[bindTo] = newVal;
            }
        );
    });
}
