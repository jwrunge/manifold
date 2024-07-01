import { $fn, $st } from ".";
import { MfldOps } from "./common_types";
import { RegisteredElement } from "./registered_element";
import { _store } from "./store";
export let ATTR_PREFIX = "data-mf-";
export let _commaSepRx = /, {0,}/g;

export let _id = ()=> {
    return `${Date.now()}.${Math.floor(Math.random() * 100_000)}`;
}

export let _getOpOverrides = (ops: Partial<MfldOps>, el: RegisteredElement)=> {
    let overrides = ops.profiles?.[el._attribute("override") || ""];
    let res = { ...ops, ...overrides };
    
    // ad hoc overrides
    for(let set of el._el?.attributes || []) {
        for(let key of ["fetch", "trans"]) {
            let name = set.name;
            if(name.startsWith(`${ATTR_PREFIX}${key}_`)) {
                try {
                    let prop = name.split("_")[2];
                    let val: any = set.value;
                    if(val?.match(/\{|\[/)) val = JSON.parse(val);
                    else if(parseInt(val || "")) val = parseInt(val);
                    if(Array.isArray(val)) val = val.map(v=> parseInt(v) || v);
                    if((res as any)?.[key]?.[prop]) (res as any)[key][prop] = val;
                }
                catch(e) {
                    console.error(e);
                }
            }
        }
    }

    return res;
}

export let _parseFunction = (condition: string, valArg = "$val", keyArg = "$key"): { func?: Function, as?: string[], dependencyList?: string[]}=> {
    try {
        let [fnStr, asStr] = condition?.split(/\s{1,}as\s{1,}/) || [condition, "value"],
            fn = fnStr?.match(/^\s{0,}(function)?\(.{0,}\)(=>)?\s{0,}/) ? `(${fnStr})()` : fnStr,
            fnText = `let {$cur, $el, $st, $fn, ${valArg}, ${keyArg}, $body} = ops;return ${fn}`,    // Take $el as a reference to the element; assign global refs to $fn and $st
            as = asStr?.split?.(_commaSepRx)?.map?.(s=> s.trim()) || ["value"] || [],
            dependencyList = Array.from(new Set([...fnStr?.matchAll(/\$st\.(\w{1,})/g)].map(m => m[1])));
    
    if(!fn) return {};
    let func: Function | undefined = new Function("ops", fnText);
        return { func, as, dependencyList };
    }
    catch(e) {
        console.error(e);
        return {};
    }
}

export function _handlePushState(el: RegisteredElement, ev?: Event, href?: string) {
    ev?.preventDefault?.();

    let pushState = el?._attribute("pushstate");
    let push = href;
    switch(pushState) {
        case "": break;
        case undefined: return;
        default: push = `#${pushState}`
    }

    history.pushState(null, "", push);
}

export function _registerInternalStore(el: HTMLElement, func?: Function, dependencyList?: string[], sub?: (val: any)=> void) {
    let id = _id();
    let S = _store(id, {
        updater: () => func?.({ $el: el, $st, $fn }),
        dependencyList,
        // scope: el,
    });

    if(sub) S.sub(sub);
    return S;
}