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
    let overrides = ["overrides", "fetch", "trans", "transdur", "transswap", "transclass", "responseType"].map(o=> {
        if(o == "overrides") return ops.profiles?.[overrides]?.fetch || JSON.parse(overrides);
        return JSON.parse(el.dataset[`${ATTR_PREFIX}${o}`] || "{}")
    })

    return {
        profiles: ops.profiles,
        fetch: {
            ...ops.fetch,
            ...{
                responseType: overrides?.[6]
            },
            ...(overrides?.[0]?.fetch || {}),
            ...(overrides?.[1] || {}),
        },
        trans: {
            ...ops.trans,
            ...{
                duration: overrides?.[3],
                swap: overrides?.[4],
                class: overrides?.[5],
            },
            ...(overrides?.[0]?.trans || {}),
            ...(overrides?.[2] || {}),
        },
    }
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
        storeName = data;
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
    let func = globalThis[fn] || MfFn?.get(fn);

    // If function is not found, try to create it; account for implicit returns
    if(!func) {
        if(!fn.match(/^\s{0,}\{/) && !fn.includes("return")) fn = fn.replace(/^\s{0,}/, "return ");
        func = new Function(...storeList, fn);
    }

    console.log(func)

    return { storeList, func, storeName };
}