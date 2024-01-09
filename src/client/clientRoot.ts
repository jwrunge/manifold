import { handleConditionals } from "./conditionals";
import { handleDataBinding } from "./bindSync";
import { copperConfig as cc } from "../general/config";

//Register subscriptions on the DOM (scopable in case an update needs run on a subset of the DOM)
export function registerSubs(parent?: Element) {
    const selectors = [`[${cc.attr.if}]`, `[data-${cc.attr.if}]`, `[${cc.attr.bind}]`, `[data-${cc.attr.bind}]`];

    (parent || document.body)?.querySelectorAll(selectors.join(",")).forEach(el=> {
        if(el.hasAttribute(cc.attr.if) || el.hasAttribute(`data-${cc.attr.if}`)) handleConditionals(el as HTMLElement);
        else if(el.hasAttribute(cc.attr.bind) || el.hasAttribute(`data-${cc.attr.bind}`)) handleDataBinding(el as HTMLElement);
    });
}
