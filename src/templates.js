import { _ensureTemplate, _iterable, _iterateSiblings, _registerInternalStore } from "./domutil";
import { _register } from "./registrar";
import { _store } from "./store";
import { _applyTransition, _scheduleUpdate } from "./updates";
import { _id, _parseFunction } from "./util";

/**
 * Handle conditional and loop elements
 * @param {HTMLElement} el 
 * @param {string} mode 
 * @param {string[]} as 
 * @param {Function | undefined} func
 * @param {any[]} valueList
 * @param {import(".").MfldOps} ops 
 */
export let _handleTemplates = (el, mode, as, func, valueList, ops)=> {
    let startElement = document.createElement("template");
    let templ = /** @type {HTMLTemplateElement}*/(_ensureTemplate(/** @type {HTMLElement}*/(el.cloneNode(true))));
    startElement.classList.add(`${mode}-start`);
    templ.classList.add(`${mode}-end`);

    el.before(startElement);
    el.after(templ);
    el.remove();

    // Handle conditional elements
    let conditional = mode.match(/if|elseif|else/);
    let newFunc = undefined;
    if(conditional) {
        // Get upstream conditions
        let previousConditionStore;
        if(!mode.match(/if/)) {
            let lastEl = /** @type {HTMLElement}*/(startElement?.previousElementSibling?.previousElementSibling);
            let lastStore = lastEl?.dataset?.[`${mode}-cstore`];
            previousConditionStore = lastStore ? _store(lastStore) : undefined;
        }

        // Create funciton
        newFunc = (list)=> {
            if(!func) return true;
            return func?.(list) == true;
        }
    }

    let templStore = _registerInternalStore(
        valueList, 
        { func: conditional ? newFunc : func, observeEl: templ }
    );

    el.dataset[`${mode}-cstore`] = templStore.name;

    // Clear old elements
    templStore.sub(val=> {
        if(val === undefined) return;
        _scheduleUpdate(()=> {
            _iterateSiblings(
                startElement?.nextElementSibling, 
                (sib)=> sib?.classList?.contains(`${mode}-end`),
                (sib)=> _applyTransition(/** @type {HTMLElement}*/(sib), "out", ops, ()=> sib?.remove()), 
            );

            if(conditional && !val) return;

            _iterable(mode.match(/each/) ? val : [val], (val, key)=> {
                // Get all logical bindings and replace values
                let item = /** @type {HTMLTemplateElement}*/ (templ.cloneNode(true));
                if(!conditional) {
                    let rx = new RegExp("\\$:{([^}]*)}", "g");
                    let html = templ?.innerHTML?.replace(rx, (_, cap)=> _parseFunction(`(${as.join(",")})=> ${cap}`)?.func?.(val, key) || "") || "";
                    if(item?.innerHTML) item.innerHTML = html;
                }

                // Replace values
                for(let element of item.content.children) {
                    if(!element?.innerHTML) element.innerHTML = val;
                    templ.before(element);
                    _applyTransition(/** @type {HTMLElement}*/(element), "in", ops, ()=> _register(/** @type {HTMLElement}*/(element)));
                }
            });
        });
    });
}