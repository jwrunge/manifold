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
 * @property {{[key: string]: Store<any>}} st
 * @property {{[key: string]: Function}} fn
 * @property {Map<HTMLElement, { toRemove: Set<Store<any>>, observer: MutationObserver }>} mut
 * @property {any} [iface]
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
    let overrides = ops.profiles?.[el.dataset?.override || ""];
    let res = { ...ops, ...overrides };
    
    // ad hoc overrides
    for(let set in el.dataset) {
        console.log("SET", set)
        for(let key of ["fetch", "trans"]) {
            if(set.startsWith(`${ATTR_PREFIX}${key}_`)) {
                console.log("MATCH", `${ATTR_PREFIX}${key}_`)
                try {
                    let prop = set.split("_")[1];
                    /** @type {any} */
                    let val = el.dataset[set];
                    if(val?.match(/\{\[/)) val = JSON.parse(val);
                    if(parseInt(val)) val = parseInt(val);
                    res[key][prop] = val;
                    console.log("Got ", key, prop, val)
                }
                catch(e) {
                    console.error(e);
                }
            }
        }
    }

    console.log(res)
    return res;
}

/**
 * @param {string} condition 
 * @returns {{ func?: Function, as?: string[] }}
 */
export let _parseFunction = (condition)=> {
    let [fn, asStr] = condition?.split(/\s{1,}as\s{1,}/) || [condition, "value"],
        fnText = `let $fn = globalThis.MFLD.fn; let $st = globalThis.MFLD.st; console.log($el, $fn, $st); console.log($el.value); console.log($fn); return ${fn}`,    // Take $el as a reference to the element; assign global refs to $fn and $st
        as = asStr?.split?.(_commaSepRx)?.map?.(s=> s.trim()) || ["value"] || [],
        func = new Function("$el", fnText);

    return { func, as };
}

/**
 * @param {HTMLElement} el 
 * @param {Event} [ev]
 * @param {string} [href]
 */
export function _handlePushState(el, ev, href) {
    ev?.preventDefault();

    let pushState = el.dataset?.[`${ATTR_PREFIX}pushstate`];
    /** @type {string | undefined} */
    let push = href;
    switch(pushState) {
        case "": break;
        case undefined: return;
        default: push = `#${pushState}`
    }

    history.pushState(null, "", push);
}