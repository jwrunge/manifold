function getConditionalElement(el) {
    for(let asType of [cc.attr.if, cc.attr.elseif]) {
        let settings = el?.getAttribute(asType) || el?.getAttribute(`data-${asType}`);
        if(settings) {
            let { storeName, ingressFunc } = breakOutSettings(settings);
            return { asType, storeName, ingressFunc };
        }
    }
    if(el?.hasAttribute(cc.attr.else)) {
        return { asType: cc.attr.else };
    }
}

//Handle data binding
/**
 * @param {Element} el
 */
export function handleConditionals(el) {
    while(el) {
        let { asType, storeName, ingressFunc } = getConditionalElement(/** @type {HTMLElement} */ el) || {};

        if(!asType) {
            el = /** @type {HTMLElement} */ (el.nextElementSibling);
        }
        else {
            //Promote all <template> tags to visible elements
            if(el.tagName == "TEMPLATE") {
                let innerHTML = el.innerHTML;
                let promoteAttr = el.getAttribute("mf-promote") || el.getAttribute("data-mf-promote") || "div";
                let newEl = globalThis.document?.t(promoteAttr);
                newEl.innerHTML = innerHTML;                for(let attr of el.attributes) {
                    newEl.setAttribute(attr.name, attr.value);
                }
                el.replaceWith(newEl);
                el = newEl;
            }

            //Set callback to be called on store updates
            let cb = ({val, el}: { val: boolean, el: HTMLElement })=> {
                el.style.display = val ? "" : "none";
            };

            registerDomSubscription(el as HTMLElement, storeFromName(storeName), storeName || "", ingressFunc, null, null, cb);

            el = el.nextElementSibling as HTMLElement;
        }
    }
}
