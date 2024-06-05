export let ATTR_PREFIX = "mf";
export let _inputNestSplitRx = /[\.\[\]\?]{1,}/g;

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

export function _getStorePathFromKey(s) {
    let [storeName, ...path] = (s)?.split(_inputNestSplitRx);
    return [storeName, path?.map(sp=> !isNaN(parseInt(sp)) ? parseInt(sp) : sp).filter(sp=> sp) || []];
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

/**
 * @param {{el: HTMLElement, datakey: string} | string} data 
 * @returns {{ storeList?: string[], func?: Function, storeName?: string}}
 */
export function _parseFunction(data) {
    let condition = "";
    let storeName = "";
    if(typeof data === "string") {
        condition = data;
    }
    else {
        condition = data?.el?.dataset?.[data?.datakey] || "";
        storeName = condition;

        if(!condition && data?.el?.dataset?.[`${ATTR_PREFIX}else`] !== undefined) {
            condition = "return true";
            storeName = `ELSE:${data?.el?.dataset?.[data?.datakey] || ""}`;
        }
    }

    if(!condition) return {};

    let [stores, fn] = condition?.split("=>")?.map(s=> s.trim()) || ["", ""];
    if(!fn) {
        fn = stores.slice();
        stores = "";
    }

    // Set up function to evaluate store values
    let storeList = stores?.split(",")?.map(s=> s.replace(/[()]/g, "").trim());
    // @ts-ignore
    let func = globalThis[fn] || MfFn?.get(fn) || new Function(...storeList, fn);

    return { storeList, func, storeName };
}