import { handleDataBindSync } from "./bindSync";

//Register subscriptions on the DOM (scopable in case an update needs run on a subset of the DOM)
export function registerSubs(parent?: Element) {
    console.log("REGISTERING SUBS", (parent || document.body)?.querySelectorAll("[data-bind],[data-sync]"))
    for(const el of (parent || document.body)?.querySelectorAll("[data-bind],[data-sync]")) {
        for(const attr of Object.keys((el as HTMLElement).dataset)) {
            console.log(attr, "ATTR")
            if(attr == "bind") handleDataBindSync(el as HTMLElement, "bind");
            else if(attr == "sync") handleDataBindSync(el as HTMLElement, "sync");
            // if(attr == "if") handleConditionals(el as HTMLElement);
        }
    };
}
