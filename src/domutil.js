import { _store } from "./store";
import { _id } from "./util";

/**
 * @param {HTMLElement} el
 * @returns {HTMLTemplateElement}
 */
export let _ensureTemplate = (el)=> {
    let nodeName = "TEMPLATE";
    if(el.tagName == nodeName) return /** @type {HTMLTemplateElement}*/(el);

    let newEl = /** @type {HTMLTemplateElement}*/(document.createElement(nodeName));
    newEl.content.appendChild(el.cloneNode(true));
    el.replaceWith(newEl);

    return newEl;
}

/**
 * @param {any} obj 
 * @param {(value: any, index: any)=> void} cb 
 */
export let _iterable = (obj, cb)=> {
    if(obj instanceof Map) for(const [key, value] of obj.entries()) cb(key, value);
    else {
        try { 
            let arr = Array.from(obj || []);
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
    return breakFn?.(sib) ? sib : _iterateSiblings((cb?.(sib) || sib)?.nextElementSibling, breakFn, cb);
}

/**
 * @typedef InternalStoreOptions
 * @property {Function} [func]
 * @property {HTMLElement} [observeEl]
 * @property {boolean} [allowFalse]
 */

/**
 * @param {string[]} [storeList] 
 * @param {InternalStoreOptions} [options]
 * @returns 
 */
export let _registerInternalStore = (storeList = [], options)=> {
    // Register new store (to prevent excess evaluations)
    return _store(_id(), {
        upstream: [...storeList],
        updater: (list)=> {
            try {
                return options?.func?.(...list) ?? list[0];
            }
            catch(_) {
                return;
            }
        },
        scope: options?.observeEl,
    });
}