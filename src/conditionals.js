import { _registerSubs } from "./registrar";
import { _store } from "./store";
import { _applyTransition, _scheduleUpdate } from "./updates";
import { _getStorePathFromKey, _parseFunction, ATTR_PREFIX } from "./util";

/**
 * @param {HTMLElement} el
 * @returns {HTMLElement}
 */
function _ensureTemplate(el) {
    // Make sure this is a template
    if(el.tagName != "TEMPLATE") {
        let newEl = document.createElement("template");
        newEl.innerHTML = el.innerHTML;                
        for(let attr of el.attributes) {
            newEl.setAttribute(attr.name, attr.value);
        }
        el.replaceWith(newEl);

        // If not, it's default content
        return newEl;
    }
    return el;
}

/**
 * @param {any} obj 
 * @param {(value: any, index: any, array?: any)=> void} cb 
 */
function _iterable(obj, cb) {
    if(obj instanceof Map) for(const [key, value] of obj.entries()) cb(key, value);
    else {
        try { 
            let arr = Array.from(obj);
            if(arr?.length) arr.forEach(cb);
            else for(let key in obj) cb(key, obj[key]);
        }
        catch(e) { console.error(`${obj} is not iterable`); }
    }
}

// Returns the sibling that fails the condition
/**
 * @param {HTMLElement | null} [sib] 
 * @param {Function} [breakFn] 
 * @param {Function} [cb] 
 * @returns {HTMLElement | null}
 */
function _iterateSiblings(sib, breakFn, cb) {
    if(breakFn(sib)) return sib;
    sib = cb?.(sib) || sib;
    return _iterateSiblings(sib?.nextElementSibling, breakFn, cb);
}

/**
 * @param {string} [storeName] 
 * @param {string[]} [storeList] 
 * @param {any[]} [conditionChain] 
 * @param {number} [upstreamConditionsLen] 
 * @param {Function} [func] 
 * @returns 
 */
function _registerConditionStore(storeName, storeList, conditionChain, upstreamConditionsLen, func) {
    // Register new store (to prevent excess evaluations)
    return _store(storeName || "", {
        upstream: [...storeList || [], ...conditionChain || []],
        updater: (list)=> {
            if(upstreamConditionsLen) {
                for(let condition of list.slice(storeList?.length || 0) || []) {
                    if(condition) return false;
                }
            }
            let res = func?.(...list);
            if(res) for(let condition of conditionChain || []) {
                console.log("Clearing condition for", condition)
                _store(condition)?.clearHash?.();
            }
            return res;
        }
    });
}

/**
 * Handle conditional and loop elements
 * @param {HTMLElement} el 
 * @param {string} mode 
 * @param {import("./index.module").MfldOps} ops 
 */
export function _handleConditionals(el, mode, ops) {
    let startElement = document.createElement("template");
    let endElement = document.createElement("template");
    startElement.classList.add("mfld-start");
    endElement.classList.add("mfld-end");
    el.before(startElement);

    if(mode == `${ATTR_PREFIX}if`) {
        // Set up conditions
        let conditionChain = [];
        let upstreamConditionsLen = conditionChain.length;

        // Iterate siblings to add implicit else
        let breakSibling = _iterateSiblings(
            startElement?.nextElementSibling,
            (sib)=> sib?.dataset[`${ATTR_PREFIX}if`] == undefined && sib?.dataset[`${ATTR_PREFIX}elseif`] == undefined && sib?.dataset[`${ATTR_PREFIX}else`] == undefined,
        );

        if(breakSibling?.previousElementSibling?.dataset[`${ATTR_PREFIX}else`] == undefined) {
            // Register implicit else
            let implElse = document.createElement("template");
            implElse.dataset[`${ATTR_PREFIX}else`] = "()=> true";
            implElse.innerHTML = "<div>VISIBLE IF NO CONDITIONS</div>"
            sib.after(implElse);
        }
        
        // Iterate siblings to get condition branches
        _iterateSiblings(
            startElement?.nextElementSibling,
            (sib)=> {
                let end = 0;
                for(let i of ["if", "elseif", "else"]) if(sib?.dataset[`${ATTR_PREFIX}${i}`] == undefined) end++;
                if(end < 3) return false;
                sib?.before(endElement);
                return true;
            },
            (sib)=> {
                let { storeList, func, storeName } = _parseFunction({
                    el: sib, 
                    datakey: conditionChain.length ? sib.dataset?.[`${ATTR_PREFIX}elseif`] ? `${ATTR_PREFIX}elseif` : `${ATTR_PREFIX}else` : mode
                });
                if(!storeList && !func) {
                    console.error("Early condition abort on", storeName, sib);
                    return;
                }
    
                // Ensure template
                sib = _ensureTemplate(sib);
    
                // Register condition store
                let conditionStore = _registerConditionStore(storeName, storeList, conditionChain, upstreamConditionsLen, func);
                conditionChain.push(conditionStore.name);
    
                // Subscribe
                conditionStore?.sub(val=> {
                    if(!val) {
                        return;
                    }
    
                    _scheduleUpdate(()=> {
                        _iterateSiblings(
                            startElement?.nextElementSibling, 
                            (sib)=> sib?.classList?.contains("mfld-end"),
                            (sib)=> { 
                                if(sib?.nodeName != "TEMPLATE") _applyTransition(/** @type {HTMLElement}*/(sib), "out", ops, ()=> sib?.remove()); 
                            }
                        );
                    });
    
                    // Replace values
                    _scheduleUpdate(()=> {
                        let sibClone = sib.cloneNode(true);
                        for(let element of /** @type {HTMLTemplateElement}*/(sibClone).content.children) {
                            endElement.before(element);
                            _applyTransition(/** @type {HTMLElement}*/(element), "in", ops, ()=> _registerSubs(/** @type {HTMLElement}*/(element)));
                        }
                    });
                });  
                
                return sib;
            },
        );
    }

    if(mode == `${ATTR_PREFIX}each`) {
        el.before(endElement);

        let [ funcStr, aliases ] = el.dataset[`${ATTR_PREFIX}each`]?.split("as")?.map(s=> s.trim()) || [];
        let [ valueName, keyName ] = aliases.split(/\s{0,},\s{0,}/)?.map(s=> s.trim()) || ["value", "key"];
        let { storeList, func, storeName } = _parseFunction(funcStr);  
        
        // Ensure template
        el = _ensureTemplate(el);

        // Register condition store
        let conditionStore = _registerConditionStore(`LOOP:${storeName}`, storeList, [], 0, func);
        conditionStore?.sub(val=> {
            _scheduleUpdate(()=> {
                _iterateSiblings(
                    startElement?.nextElementSibling, 
                    (sib)=> sib?.classList?.contains("mfld-end"),
                    (sib)=> _applyTransition(/** @type {HTMLElement}*/(sib), "out", ops, ()=> sib?.remove()), 
                );
            });
            _scheduleUpdate(()=> {
                _iterable(val || [], (key, value)=> {
                    let html = el.innerHTML;

                    // Get all logical bindings and replace values
                    let replacements = el.innerHTML.match(/\${[^}]*}/g) || [];
                    for(let rep of replacements) {
                        let repClean = rep.replace(/^\$\{|\}$/g, "");

                        try {
                            let fn = _parseFunction(`(${keyName}, ${valueName})=> ${repClean}`)?.func;
                            html = html.replace(rep, fn?.(value, key) || "");
                        }
                        catch(e) {
                            console.error("Syntax error in loop function", e);
                        }
                    }

                    let item = /** @type {HTMLTemplateElement}*/(el.cloneNode(true));
                    item.innerHTML = html;

                    // Replace values
                    for(let element of item.content.children) {
                        endElement.before(element);
                        _applyTransition(/** @type {HTMLElement}*/(element), "in", ops, ()=> _registerSubs(/** @type {HTMLElement}*/(element)));
                    }
                });
            });
        })
    }
}