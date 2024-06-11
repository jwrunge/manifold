export let ATTR_PREFIX = "mf_";
export let _inputNestSplitRx = /[\.\[\]\?]{1,}/g;
export let _commaSepRx = /, {0,}/g;

export function _randomEnoughId() {
    return `${Date.now()}.${Math.floor(Math.random() * 100_000)}`;
}

function _getOverride(name, el, ops, parse = true, def = "{}", as) {
    let override = el.dataset[`${ATTR_PREFIX}${name}`];
    if(!override) return undefined;
    if(name == "overrides") return ops.profiles?.[override || ""]?.fetch || JSON.parse(override || "{}");
    if(parse) return JSON.parse(override || def);
    if(as == "num") return parseInt(override) || undefined;
    if(as == "bool") return override == "true" ? true : override == "false" ? false : undefined;
    return override;
}

/**
 * Get or set nested store values
 * @param {import(".").MfldOps} ops
 * @param {HTMLElement} el
 * @returns {import(".").MfldOps}
 */
export function _getOpOverrides(ops, el) {
    let overrides = _getOverride("overrides", el, ops);

    let newops = {
        profiles: ops.profiles,
        fetch: {
            ...ops.fetch,
            ...{
                responseType: _getOverride("responsetype", el, ops, false) || ops.fetch?.responseType
            },
            ...(overrides?.fetch || {}),
            ...(_getOverride("fetch", el, ops) || {}),
        },
        trans: {
            ...ops.trans,
            ...{
                dur: _getOverride("transdur", el, ops, true, "[]", "num") || ops.trans?.dur,
                swap: _getOverride("transswap", el, ops, false, "", "num") || ops.trans?.swap,
                class: _getOverride("transclass", el, ops, false) || ops.trans?.class,
                smartTransition: _getOverride("transsmart", el, ops, false, undefined, "bool") || ops.trans?.smartTransition,
            },
            ...(overrides?.trans || {}),
            ...(_getOverride("trans", el, ops) || {}),
        },
    }

    return newops;
}

function _parseValues(values) {
    if(typeof values == "string") values = values.split(/\s{0,},\s{0,}/);
    return values.map(v=> v.split(_inputNestSplitRx)?.[0]) || [];
}

/**
 * @param {{el: HTMLElement, datakey: string} | string} condition 
 * @returns {{ valueList?: string[], func?: Function, as?: string[] }}
 */
export function _parseFunction(condition) {
    if(typeof condition != "string") {
        condition = condition?.el?.dataset?.[condition?.datakey] || "";
        if(!condition && /** @type {any}*/(condition)?.el?.dataset?.[`${ATTR_PREFIX}else`] != undefined) condition = "return true";
    }

    let [fstr, values] = condition?.split("=>")?.map(s=> s.trim())?.reverse() || ["", ""];
    let [fn, asStr] = fstr?.split(/\s{1,}as\s{1,}/) || [fstr, "value"];
    let as = asStr?.split?.(_commaSepRx)?.map?.(s=> s.trim()) || ["value"];

    // Set up function to evaluate store values
    let valueList = values?.split(",")?.map(s=> s.replace(/[()]/g, "").trim()) || [];
    // @ts-ignore
    let func = globalThis[fn] || MfFn[fn];
    if(!func) {
        // If function is not found, try to create it; account for implicit returns
        if(!valueList?.length && !fn.includes("=>")) {
            if(!fn.match(/\(|\)/)) {
                valueList = [fn];
                fn = `return ${fn}`;
            }
            else {
                valueList = fn.match(/\([^\)]{1,}\)/)?.[0]?.replace(/[\(\) ]/g, "").split(",").filter(s=> !s.match(/[\"\'\`]/)) || [];
            }
        }

        valueList = _parseValues(valueList);
        if(!fn.match(/^\s{0,}\{/) && !fn.includes("return")) fn = fn.replace(/^\s{0,}/, "return ");
        try {
            func = new Function(...valueList, fn);
        }
        catch(e) {
            console.error(e);
        }
    }

    return { valueList, func, as };
}

export function _evalInputs(inputs) {
    let values = [];
    for(let input of inputs) {
        // @ts-ignore
        let S = MfSt.get(input);
        values.push(S.value || globalThis.value);
    }
    return values;
}