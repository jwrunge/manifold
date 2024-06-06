import { _registerSubs } from "./registrar";
import { _store } from "./store";
import { _scheduleUpdate } from "./updates";
import { _getOpOverrides, _getStorePathFromKey, _parseFunction, ATTR_PREFIX } from "./util";

/**
 * @param {HTMLElement} el
 * @param {HTMLElement} rootElement 
 * @returns {HTMLElement}
 */
function _ensureTemplate(el, rootElement) {
    // Make sure this is a template
    if(el.tagName != "TEMPLATE") {
        let newEl = document.createElement("template");
        newEl.innerHTML = el.innerHTML;                
        for(let attr of el.attributes) {
            newEl.setAttribute(attr.name, attr.value);
        }
        el.replaceWith(newEl);

        // If not, it's default content
        rootElement.innerHTML = el.innerHTML;
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
                for(let condition of list.slice(-upstreamConditionsLen) || []) {
                    if(condition) return false;
                }
            }
            return func?.(...list);
        }
    });
}

/**
 * Handle conditional and loop elements
 * @param {HTMLElement} el 
 * @param {string} mode 
 * @param {import("./index.module").MfldOps} _ops 
 */
export function _handleConditionals(el, mode, _ops) {
    let ops = _getOpOverrides(_ops, el);
    let rootElement = document.createElement("div");
    el.before(rootElement);

    if(mode == `${ATTR_PREFIX}if`) {
        rootElement.classList.add("mfld-active-condition");

        // Set up conditions
        let siblingPtr = el;
        let conditionChain = [];
        while(siblingPtr) {
            if(!siblingPtr) break;
            let { storeList, func, storeName } = _parseFunction({
                el: siblingPtr, 
                datakey: conditionChain.length ? `${ATTR_PREFIX}elseif`: mode
        });
            if(!storeList && !func) break;

            // Ensure template
            siblingPtr = _ensureTemplate(siblingPtr, rootElement);

            // Register condition store
            let upstreamConditionsLen = conditionChain.length;
            let conditionStore = _registerConditionStore(storeName, storeList, conditionChain, upstreamConditionsLen, func);
            conditionChain.push(conditionStore.name);

            // Subscribe
            let siblingClone = /** @type {HTMLElement}*/(siblingPtr.cloneNode(true));
            conditionStore?.sub(val=> {
                if(!val) return;
                let sib = document.createElement("div");
                sib.innerHTML = siblingClone.innerHTML;
                if(siblingClone?.tagName == "TEMPLATE") {
                    _scheduleUpdate({
                        in: sib,
                        out: rootElement,
                        relation: "swapinner",
                        ops,
                        done: ((el) => _registerSubs(el)),
                    })
                }
            });

            siblingPtr = /** @type {HTMLElement} */(siblingPtr?.nextElementSibling);
        }
    }

    if(mode == `${ATTR_PREFIX}each`) {
        rootElement.classList.add("mfld-loop-result");

        let [ funcStr, aliases ] = el.dataset[`${ATTR_PREFIX}each`]?.split("as")?.map(s=> s.trim()) || [];
        let [ valueName, keyName ] = aliases.split(/\s{0,},\s{0,}/)?.map(s=> s.trim()) || ["value", "key"];
        let { storeList, func, storeName } = _parseFunction(funcStr);  
        
        // Ensure template
        el = _ensureTemplate(el, rootElement);

        // Register condition store
        let conditionStore = _registerConditionStore(`LOOP:${storeName}`, storeList, [], 0, func);
        conditionStore?.sub(val=> {
            _scheduleUpdate(()=> rootElement.replaceChildren());
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

                // Replace values
                let item = document.createElement("div");
                item.innerHTML = html;
                
                _scheduleUpdate({
                    in: item,
                    out: rootElement,
                    relation: "append",
                    ops,
                    done: ((el) => _registerSubs(el))
                });
            });
        })
    }
}