import { copperConfig } from "./config";
import { Store } from "./store";

type DependencyType = "value" | "html" | "class" | "style" | "if" | "iterative";
type DependencyOption = "not" | undefined

//Register subscriptions on the DOM (scopable in case an update needs run on a subset of the DOM)
export function registerSubs(parent?: Element) {
    if(!parent) parent = document.body;
    const subBlocks = parent.querySelectorAll(copperConfig.subSelector);

    subBlocks.forEach((b)=> {
        //subSettings should be something like "storeName:DependencyType.DependencyOption"
        const subSettings = (b as HTMLElement)?.dataset?.sub?.split(":");
        if(!subSettings) return;

        //Break out settings
        const storeName = subSettings[0];
        const dependencyData = subSettings[1].split(".");
        const dependencyType = dependencyData[0] as DependencyType;
        const dependencyOption = dependencyData[1] as DependencyOption;

        //@ts-ignore - Get store
        let store: Store<any> = window[storeName as any] as Store<any>;

        switch(dependencyType) {
            case "value": {
                store.addDomSubscription(
                    b,
                    (val)=> {
                        (b as HTMLInputElement).value = val
                        b.addEventListener("change", (e)=> { if((e.currentTarget as HTMLInputElement)?.value) store.update((e.currentTarget as HTMLInputElement).value) })
                    }
                );
                break;
            }
        }
        console.log("VALUE", store.value)
    })
}

