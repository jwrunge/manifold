export let ATTR_PREFIX = "mf_";
export let _inputNestSplitRx = /[\.\[\]\?]{1,}/g;
export let _commaSepRx = /, {0,}/g;

export let _id = ()=> {
    return `${Date.now()}.${Math.floor(Math.random() * 100_000)}`;
}

/** 
 * @template T
 * @typedef {import("./store.js").Store<T>} Store 
 */

/**!
 * @typedef {object} MFLDGlobal
 * @property {Map<string, Store<any>>} st
 * @property {Object} fn
 * @property {Map<HTMLElement, { toRemove: Set<Store<any>>, observer: MutationObserver }>} mut
 */

/**!
 * @typedef {Window & { MFLD: MFLDGlobal }} MFLDWindowObj
 * @property {MFLDGlobal} MFLD
 */
// @ts-ignore
export let _glob = /** @type {MFLDWindowObj}*/(window);

/**
 * Get or set nested store values
 * @param {import(".").MfldOps} ops
 * @param {HTMLElement} el
 * @returns {import(".").MfldOps}
 */
export let _getOpOverrides = (ops, el)=> {
    let override = el.dataset?.override || "";
    let overrides = ops.profiles?.[override] || {}// || JSON.parse(override || {});
    
    let res = { ...ops, ...overrides };
    // Get per-value overrides

    return res;
}

/**
 * @param {{el: HTMLElement, datakey: string} | string} condition 
 * @returns {{ paramList: any[], func?: Function, as?: string[] }}
 */
export let _parseFunction = (condition)=> {
    if(typeof condition != "string") {
        condition = condition?.el?.dataset?.[condition?.datakey] || "";
        if(!condition && /** @type {any}*/(condition)?.el?.dataset?.[`${ATTR_PREFIX}else`] != undefined) condition = "return true";
    }

    let [fstr, values] = condition?.split("=>")?.map(s=> s.trim())?.reverse() || ["", ""],
        [fn, asStr] = fstr?.split(/\s{1,}as\s{1,}/) || [fstr, "value"],
        as = asStr?.split?.(_commaSepRx)?.map?.(s=> s.trim()) || ["value"],
        paramList = values?.split(",")?.map(s=> s.replace(/[()]/g, "").trim()) || [],    // Set up function to evaluate store values
        func = _glob[fn] || _glob.MFLD.fn[fn];

    if(!func) {
        // If function is not found, try to create it; account for implicit returns
        if(!paramList?.length && !fn.includes("=>")) {
            if(!fn.match(/\(|\)/)) {
                paramList = [fn];
                fn = `return ${fn}`;
            }
            else {
                paramList = fn.match(/\([^\)]{1,}\)/)?.[0]?.replace(/[\(\) ]/g, "").split(",").filter(s=> !s.match(/[\"\'\`]/)) || [];
            }
        }

        paramList = (typeof paramList == "string" ? /** @type {string}*/(paramList).split(/\s*,\s*/) || [] : paramList).map(v => v.split(_inputNestSplitRx)[0]) || [];
        if(!fn.match(/^\s{0,}\{/) && !fn.includes("return")) fn = fn.replace(/^\s{0,}/, "return ");
        try {
            func = new Function(...paramList, fn);
        }
        catch(e) {
            console.error(e);
        }
    }

    return { paramList, func, as };
}