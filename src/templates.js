import { _ensureTemplate, _iterable, _iterateSiblings, _registerInternalStore } from "./domutil";
import { _register } from "./registrar";
import { _store } from "./store";
import { _applyTransition, _scheduleUpdate } from "./updates";
import { _id, _parseFunction, ATTR_PREFIX } from "./util";

/**
 * Handle conditional and loop elements
 * @param {HTMLElement} el 
 * @param {string} mode 
 * @param {string[]} as 
 * @param {Function | undefined} func
 * @param {any[]} paramList
 * @param {import(".").MfldOps} ops 
 */
export let _handleTemplates = (el, mode, as, func, paramList, ops)=> {
    let startElement = document.createElement("template"),
        templ = /** @type {HTMLTemplateElement}*/(_ensureTemplate(/** @type {HTMLElement}*/(el.cloneNode(true)))),
        templStore,
        conditional = mode.match(/if|else/), 
        conditionalSub = mode.match(/(else|elseif)(\s|$)/), // Whole word match to allow for exact checks later on (otherwise else is greedy)
        newFunc = undefined,
        prevConditions = [];

    startElement.classList.add(`${mode}-start`);
    templ.classList.add(`${mode}-end`);

    el.before(startElement);
    el.after(templ);
    el.remove();

    // Handle conditional elements
    if(conditional) {
        // Get upstream conditions
        if(conditionalSub) {
            let first = _iterateSiblings(startElement, (sib)=> sib?.classList?.contains(`${ATTR_PREFIX}if-end`), null, true);
            _iterateSiblings(
                first, 
                sib=> sib == templ, 
                sib=> { if(sib?.dataset?.[`${ATTR_PREFIX}cstore`]) prevConditions.push(sib?.dataset?.[`${ATTR_PREFIX}cstore`]) }
            );

            if(!paramList || conditionalSub[0] == "else") paramList = prevConditions;
            else paramList = [...paramList, ...prevConditions];
        }

        // Create function
        newFunc = (...list)=> {
            if(conditionalSub) for(let res of list.slice(-prevConditions.length)) if(res == true) return false;
            return conditionalSub?.[0] == "else" ? true : func?.(...list) == true;
        }
    }

    templStore = _registerInternalStore(
        paramList, 
        { func: conditional ? newFunc : func, observeEl: templ }
    );
    
    if(conditional) templ.dataset[`${ATTR_PREFIX}cstore`] = templStore.name;

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