import { $fn, $st } from ".";
import { MfldOps } from "./common_types";
import { RegisteredElement } from "./registered_element";
import { _store, Store } from "./store";
export let ATTR_PREFIX = "mf_";
export let _commaSepRx = /, {0,}/g;

export let _id = ()=> {
    return `${Date.now()}.${Math.floor(Math.random() * 100_000)}`;
}

export let _getOpOverrides = (ops: Partial<MfldOps>, el: RegisteredElement)=> {
    let overrides = ops.profiles?.[el._dataset("override") || ""];
    let res = { ...ops, ...overrides };
    
    // ad hoc overrides
    for(let set in el._el.dataset) {
        for(let key of ["fetch", "trans"]) {
            if(set.startsWith(`${ATTR_PREFIX}${key}_`)) {
                try {
                    let prop = set.split("_")[2];
                    let val: any = el._el.dataset[set];
                    if(val?.match(/\{|\[/)) val = JSON.parse(val);
                    else if(parseInt(val || "")) val = parseInt(val);
                    if(Array.isArray(val)) val = val.map(v=> parseInt(v) || v);
                    (res as any)[key][prop] = val;
                }
                catch(e) {
                    console.error(e);
                }
            }
        }
    }

    return res;
}

export let _parseFunction = (condition: string, valArg = "$val", keyArg = "$key"): { func?: Function, as?: string[]}=> {
    try {
        let [fnStr, asStr] = condition?.split(/\s{1,}as\s{1,}/) || [condition, "value"],
            fn = fnStr?.match(/^\s{0,}(function)?\(.{0,}\)(=>)?\s{0,}/) ? `(${fnStr})()` : fnStr,
            fnText = `let {$el, $st, $fn, ${valArg}, ${keyArg}, $body} = ops;return ${fn}`,    // Take $el as a reference to the element; assign global refs to $fn and $st
            as = asStr?.split?.(_commaSepRx)?.map?.(s=> s.trim()) || ["value"] || [];
        let func: Function | undefined = new Function("ops", fnText);
        return { func, as };
    }
    catch(e) {
        console.error(e);
        return {};
    }
}

export function _handlePushState(el: RegisteredElement, ev?: Event, href?: string) {
    ev?.preventDefault();

    let pushState = el._dataset("pushstate");
    let push = href;
    switch(pushState) {
        case "": break;
        case undefined: return;
        default: push = `#${pushState}`
    }

    history.pushState(null, "", push);
}

// Iterates over an iterable object or an object's properties
export let _iterable = <T>(obj: Iterable<T> | { [key: string]: T }, cb: (value: T, key: string | number) => void): void => {
    if(obj instanceof Map) {
        for (let[key, value] of obj.entries()) cb(value, key);
    } else {
        try {
            let arr = Array.isArray(obj) ? obj : Array.from(obj as Array<any>);
            if(arr.length) arr.forEach(cb);
            else for (let key in obj) cb((obj as any)[key], key);
        } catch (e) {
            console.error(`${obj} is not iterable`);
        }
    }
};

// Iterates over an element's siblings until a condition is met
export let _iterateSiblings = (
    sib?: HTMLElement | null, 
    breakFn?: ((sib?: HTMLElement | null) => boolean | undefined) | null, 
    cb?: ((sib?: HTMLElement | null) => void) | null, 
    reverse: boolean = false
): HTMLElement | null | undefined => {
    let dir = reverse ? "previousElementSibling" : "nextElementSibling";
    return breakFn?.(sib) ? sib : _iterateSiblings(cb?.(sib) || sib?.[dir as keyof typeof sib] as HTMLElement, breakFn, cb, reverse);
};

// Registers an internal store with given options
export let _registerInternalStore = (upstream?: string[], func?: Function, $el?: RegisteredElement): Store<any> => {
    let id = _id();
    $el?._dataset("cstore", id);

    return _store(_id(), {
        upstream,
        updater: () => func?.({ $el, $st, $fn }),
        // scope: $el,
    });
};