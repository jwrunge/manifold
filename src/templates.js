import { _ensureNodeName, _iterable, _iterateSiblings, _registerInternalStore } from "./domutil";
import { _register } from "./registrar";
import { _store } from "./store";
import { _applyTransition, _scheduleUpdate } from "./updates";
import { _parseFunction, _randomEnoughId, ATTR_PREFIX } from "./util";

/**
 * Handle conditional and loop elements
 * @param {HTMLElement} el 
 * @param {string} mode 
 * @param {string[]} as 
 * @param {Function | undefined} func
 * @param {any[]} valueList
 * @param {import(".").MfldOps} ops 
 */
export function _handleTemplates(el, mode, as, func, valueList, ops) {
    let startElement = document.createElement("template");
    let templ = /** @type {HTMLTemplateElement}*/(_ensureNodeName(/** @type {HTMLElement}*/(el.cloneNode(true)), "TEMPLATE"));
    startElement.classList.add(`${mode}-start`);
    templ.classList.add(`${mode}-end`);

    templ.dataset.nodeName = el.nodeName;
    el.before(startElement);
    el.after(templ);
    el.remove();

    let templStore = _registerInternalStore(
        _randomEnoughId(),
        valueList, 
        { func, observeEl: templ }
    );

    // Clear old elements
    templStore.sub(val=> {
        _scheduleUpdate(()=> {
            _iterateSiblings(
                startElement?.nextElementSibling, 
                (sib)=> sib?.classList?.contains(`${mode}-end`),
                (sib)=> _applyTransition(/** @type {HTMLElement}*/(sib), "out", ops, ()=> sib?.remove()), 
            );

            let it = mode.match(/each/) ? _iterable : (object, cb)=> cb(object || "");

            it(val, (val, key)=> {
                if(val == undefined) return;
                let html = templ?.innerHTML || templ?.textContent?.replace(/^\n{0,}|\n{0,}$/, "") || "";

                // Get all logical bindings and replace values
                let replacements = html.match(/\${[^}]*}/g) || [];
                for(let rep of replacements) {
                    try {
                        let fn = _parseFunction(`(${as.join(",")})=> ${rep.slice(2, rep.length-1)}`)?.func;
                        html = html.replace(rep, fn?.(val, key) || "");
                    }
                    catch(e) {
                        html = "Error in template. Check console for details."
                        console.error(e);
                    }
                }

                let elms;
                if(mode.match(/each/)) {
                    let item = /** @type {HTMLTemplateElement}*/(templ.cloneNode(true));
                    item.innerHTML = html || val;
                    elms = item.content.children;
                }
                else {
                    let item = /** @type {HTMLTemplateElement}*/(_ensureNodeName(/** @type {HTMLElement}*/(templ.cloneNode(true)), templ.dataset.nodeName, ["data-node-name", `data-${ATTR_PREFIX}`], [`${mode}-end`]));
                    item.innerHTML = html || val;
                    elms = [item];
                }

                // Replace values
                for(let element of elms) {
                    templ.before(element);
                    _applyTransition(/** @type {HTMLElement}*/(element), "in", ops, ()=> _register(/** @type {HTMLElement}*/(element)));
                }
            });
        });
    });
}