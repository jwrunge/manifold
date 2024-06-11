import { _store } from "./store";

/**
 * @param {HTMLElement} el
 * @returns {HTMLElement}
 */
export function _ensureNodeName(el, nodeName, skipAttributes = [], removeClasses = []) {
    // Make sure this is a template
    if(el.tagName != nodeName) {
        let newEl = document.createElement(nodeName);
        newEl.innerHTML = el.innerHTML;       
        for(let attr of el.attributes) {
            if(!skipAttributes.includes(attr.name)) newEl.setAttribute(attr.name, attr.value);
        }
        for(let cls of removeClasses) {
            newEl.classList.remove(cls);
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
export function _iterable(obj, cb) {
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
 * @param {Element | null} [sib] 
 * @param {Function} [breakFn] 
 * @param {Function} [cb] 
 * @returns {Element | null | undefined}
 */
export function _iterateSiblings(sib, breakFn, cb) {
    if(breakFn?.(sib)) return sib;
    sib = cb?.(sib) || sib;
    return _iterateSiblings(sib?.nextElementSibling, breakFn, cb);
}

/**
 * @typedef InternalStoreOptions
 * @property {Function} [func]
 * @property {HTMLElement} [observeEl]
 * @property {boolean} [allowFalse]
 */

/**
 * @param {string} [storeName] 
 * @param {string[]} [storeList] 
 * @param {InternalStoreOptions} [options]
 * @returns 
 */
export function _registerInternalStore(storeName, storeList, options) {
    // Register new store (to prevent excess evaluations)
    return _store(storeName || "", {
        upstream: [...storeList || []],
        updater: (list)=> {
            try {
                return options?.func?.(...list) || list[0];
            }
            catch(_) {
                return;
            }
        },
        scope: options?.observeEl,
    });
}
