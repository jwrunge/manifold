import { _store } from "./store.js";

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

/**
 * @param {import(".").MfldOps} ops
 * @param {HTMLElement} el
 * @returns {import(".").MfldOps}
 */
export let _getOpOverrides = (ops, el)=> {
    let overrides = ops.profiles?.[el.dataset?.override || ""];
    let res = { ...ops, ...overrides };
    
    // ad hoc overrides
    for(let set in el.dataset) {
        for(let key of ["fetch", "trans"]) {
            if(set.startsWith(`${ATTR_PREFIX}${key}_`)) {
                try {
                    let prop = set.split("_")[1];
                    /** @type {any} */
                    let val = el.dataset[set];
                    if(val?.match(/\{\[/)) val = JSON.parse(val);
                    if(parseInt(val)) val = parseInt(val);
                    res[key][prop] = val;
                }
                catch(e) {
                    console.error(e);
                }
            }
        }
    }

    return res;
}

/**
 * @param {string} condition 
 * @param {string} [valArg] 
 * @param {string} [keyArg] 
 * @returns {{ func?: Function, as?: string[] }}
 */
export let _parseFunction = (condition, valArg, keyArg)=> {
    try {
        let [fnStr, asStr] = condition?.split(/\s{1,}as\s{1,}/) || [condition, "value"],
            fn = fnStr?.match(/^\s{0,}(function)?\(.{0,}\)(=>)?\s{0,}/) ? `(${fnStr})()` : fnStr,
            fnText = `let {$el, $st, $fn, ${valArg || "$val"}, ${keyArg || "$key"}, $body} = ops;return ${fn}`,    // Take $el as a reference to the element; assign global refs to $fn and $st
            as = asStr?.split?.(_commaSepRx)?.map?.(s=> s.trim()) || ["value"] || [];
        let func = new Function("ops", fnText);
        return { func, as };
    }
    catch(e) {
        console.error(e);
        return {};
    }
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