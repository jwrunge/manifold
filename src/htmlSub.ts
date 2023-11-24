import { copperConfig } from "./config";
import { Store } from "./store";

//Register subscriptions on the DOM (scopable in case an update needs run on a subset of the DOM)
export function registerSubs(parent?: Element) {
    if(!parent) parent = document.body;
    handleDataBinding(parent);
    handleEvals(parent);
}

function breakOutSettings(element: HTMLElement, attribute: string, allowNullBinding = false): {storeName: string, bindings: string[], remaining: string} | null {
    const subSettings = element?.getAttribute(attribute)?.trim()?.split(" ");
    if(!subSettings) return null;

    //Break out settings
    const nameAndBinding = subSettings[0].split(":");
    const storeName = nameAndBinding[0].trim();
    const bindings = nameAndBinding[1]?.trim().split("|");
    const remaining = subSettings[1]?.trim();
    
    //Abort if no storeName or bindTo
    if(!storeName || (!allowNullBinding && !bindings)) return null;
    return {storeName, bindings, remaining};
}

//Handle data binding
function handleDataBinding(parent: Element) {
    const subBlocks = parent.querySelectorAll(`[${copperConfig.bindAttr}], [data-${copperConfig.bindAttr}]`);

    subBlocks.forEach((b)=> {
        let settings = breakOutSettings(b as HTMLElement, copperConfig.bindAttr);
        if(!settings) {
            console.warn("Copper: Data binding must have a store name and bindTo attribute. Bind aborted.", b);
            return;
        }
        let {storeName, bindings, remaining} = settings;
        let propogateOn = remaining?.replace("sync:", "")?.trim()?.split("|") || [];

        //@ts-ignore - Get store
        const store: Store<any> = window[storeName] as Store<any>;
        //Add or overwrite DOM subscription method
        for(let bindTo of bindings) {
            let attr = false;
            if(bindTo.includes("attr-")) {
                attr = true;
                bindTo = bindTo.replace("attr-", "");
            }

            store.addDomSubscription(
                b,
                (val)=> {
                    //@ts-ignore - Update DOM value
                    if(!attr) b[bindTo] = val;
                    else b.setAttribute(bindTo, val);

                    //For each propogation event
                    for(let eventName of propogateOn) {
                        const eventFunc = (e: Event)=> { 
                            store.update(
                                !attr ?
                                //@ts-ignore
                                e.currentTarget[bindTo] :
                                (e.currentTarget as HTMLElement)?.getAttribute(bindTo)
                            );
                        }
                        //Clear previous event listener (preventing reassingment) and bind new one
                        b.removeEventListener(eventName, eventFunc);
                        b.addEventListener(eventName, eventFunc)
                    }
                }
            );
        }
    });
}

// Handle function evals
function handleEvals(parent: Element) {
    const subBlocks = parent.querySelectorAll(`[${copperConfig.evalAttr}], [data-${copperConfig.evalAttr}]`);

    subBlocks.forEach((b)=> {
        let settings = breakOutSettings(b as HTMLElement, copperConfig.evalAttr, true);
        if(!settings) {
            console.warn("Copper: Eval binding must have a store name and can optionally have a bindTo attribute. Bind aborted.", b);
            return;
        }
        let {storeName, bindings, remaining} = settings;
        const execFunc = window[remaining as any];

        if(!execFunc || typeof execFunc !== "function") return;

        //@ts-ignore - Get store
        const store: Store<any> = window[storeName] as Store<any>;
        //Add or overwrite DOM subscription method
        for(let bindTo of bindings || [null]) {
            let attr = false;
            if(bindTo && bindTo.includes("attr-")) {
                attr = true;
                bindTo = bindTo.replace("attr-", "");
            }

            store.addDomSubscription(
                b,
                (val)=> {
                    const newVal = (execFunc as Function)(val, b);

                    //Optionally update binding (may not be provided for eval)
                    if(bindTo) {
                        //@ts-ignore - Update DOM value
                        if(!attr) b[bindTo] = newVal;
                        else b.setAttribute(bindTo, newVal);
                    }
                }
            );
        }
    });
}
