export let ATTR_PREFIX = "mf";

/**
 * Get or set nested store values
 * @param {any} obj 
 * @param {(string | number)[]} path 
 * @param {any} [newval] 
 * @returns 
 */
export function _nestedValue(obj, path, newval) {
    let ptr = obj;

    for(let key of path) {
        //Dynamically letruct object if it doesn't exist
        if(ptr == undefined) ptr = typeof key == "number" ? [] : {};

        //Set or get value
        if(newval == undefined || path[path.length - 1] !== key) ptr = ptr instanceof Map ? ptr?.get(key) : ptr?.[key];
        else ptr instanceof Map ? ptr.set(key, newval) : ptr[key] = newval;
    }

    return ptr;
}

/**
 * Get or set nested store values
 * @param {import("./index.module").MfldOps} ops
 * @param {HTMLElement} el
 * @returns {import("./index.module").MfldOps}
 */
export function _getOpOverrides(ops, el) {
    let overrides = el.dataset[`${ATTR_PREFIX}overrides`] || "{}";
    let overrideOps = ops.profiles?.[overrides]?.fetch || JSON.parse(overrides);

    /** @type {import("./index.module").MfldOps} */
    return overrideOps ? {
        ...ops,
        ...overrideOps,
    } : ops;
}