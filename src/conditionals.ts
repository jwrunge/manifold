import {breakOutSettings, registerDomSubscription, storeFromName} from "./util";

function getConditionalElement(el: HTMLElement) {
    for(let asType of [cc.attr.if, cc.attr.elseif]) {
        const settings = el?.getAttribute(asType) || el?.getAttribute(`data-${asType}`);
        if(settings) {
            const { storeName, ingressFunc } = breakOutSettings(settings);
            return { asType, storeName, ingressFunc };
        }
    }
    if(el?.hasAttribute(cc.attr.else)) {
        return { asType: cc.attr.else };
    }
}

//Handle data binding
export function handleConditionals(el: Element) {
    while(el) {
        const { asType, storeName, ingressFunc } = getConditionalElement(el as HTMLElement) || {};

        if(!asType) {
            el = el.nextElementSibling as HTMLElement;
        }
        else {
            //Promote all <template> tags to visible elements
            if(el.tagName == "TEMPLATE") {
                const innerHTML = el.innerHTML;
                const promoteAttr = el.getAttribute("cu-promote") || el.getAttribute("data-cu-promote") || "div";
                let newEl = document.createElement(promoteAttr);
                newEl.innerHTML = innerHTML;
                for(const attr of el.attributes) {
                    newEl.setAttribute(attr.name, attr.value);
                }
                el.replaceWith(newEl);
                el = newEl;
            }

            //Set callback to be called on store updates
            const cb = ({val, el}: { val: boolean, el: HTMLElement })=> {
                el.style.display = val ? "" : "none";
            };

            registerDomSubscription(el as HTMLElement, storeFromName(storeName), storeName || "", ingressFunc, null, null, cb);

            el = el.nextElementSibling as HTMLElement;
        }
    }
}
