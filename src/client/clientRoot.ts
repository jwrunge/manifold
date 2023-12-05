import { handleDataBinding } from "./bindSync";
import { Store } from "./store";
import { handleStringInterpolation } from "./stringInterp";
import { copperConfig as cc } from "../general/config";

//Register subscriptions on the DOM (scopable in case an update needs run on a subset of the DOM)
export function registerSubs(parent?: Element) {
    const selectors = [cc.el.str, `[${cc.attr.bind}]`, `[data-${cc.attr.bind}]`];

    (parent || document.body)?.querySelectorAll(selectors.join(",")).forEach(el=> {
        if(el.tagName == cc.el.str.toUpperCase()) {
            handleStringInterpolation(el as HTMLElement);
        }
        else if(el.hasAttribute(cc.attr.bind) || el.hasAttribute(`data-${cc.attr.bind}`)) handleDataBinding(el as HTMLElement);
    });
}