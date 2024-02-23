import { handleDataBindSync } from "./bindSync";

//Register subscriptions on the DOM (scopable in case an update needs run on a subset of the DOM)
export function registerSubs(parent?: Element) {
    for(const el of (parent || document.body)?.querySelectorAll("[data-bind],[data-sync]")) {
        if(!el.id) el.id = `cu-${Math.random().toString(36)}`;
        for(const attr of Object.keys((el as HTMLElement).dataset)) {
            if(attr == "bind") handleDataBindSync(el as HTMLElement, "bind");
            else if(attr == "sync") handleDataBindSync(el as HTMLElement, "sync");
            // if(attr == "if") handleConditionals(el as HTMLElement);
        }
    };
}
