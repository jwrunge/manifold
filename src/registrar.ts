import { _commaSepRx, _getOpOverrides, _handlePushState, _parseFunction, _registerInternalStore, ATTR_PREFIX } from "./util";
import { _handleFetch } from "./fetch";
import { MfldOps, $fn, $st } from "./common_types";

let _ops: Partial<MfldOps> = {};
let _modes = ["bind", "sync", "get", "head", "post", "put", "delete", "patch", "promote"];

export let _setOptions = (newops: Partial<MfldOps>, profileName?: string): void => {
    if(profileName) _ops.profiles = { ..._ops.profiles, [profileName]: newops };
    else _ops = { ..._ops, ...newops };
}

window.addEventListener("popstate", () => {
    location.reload();
});

export let _register = (parent?: HTMLElement | null, noparent = false): void => {
    console.log("Registering", parent);
    if(!parent || parent?.nodeType == Node.TEXT_NODE) return;
    if(parent?.classList.contains("_mfld")) noparent = true;

    let suffix = ":not(._mfld)";
    let els: NodeListOf<HTMLElement> = (parent).querySelectorAll(
        `[${ATTR_PREFIX}${_modes.join(`]${suffix},[${ATTR_PREFIX}`)}]${suffix}`
    );

    for(let el of (noparent ? [...els] : [parent, ...els])) {
        console.log("Registering", el);
        let _op_overrides = _getOpOverrides(structuredClone(_ops), el);

        console.log(el.attributes)
        for(let attr of el.attributes) {
            if(!attr.name.startsWith(ATTR_PREFIX) || attr.value === null) continue;
            let _strippedMode = attr.name.replace(ATTR_PREFIX, "");

            // Handle promote
            if(_strippedMode == "promote") {
                let [mode, href, input, trigger] = el.tagName == "A" ?
                    ["get", (el as HTMLAnchorElement).href, undefined, "click"] :
                    [(el as HTMLFormElement).method?.toLowerCase(), (el as HTMLFormElement).action, () => "$form", "submit"];
                if(href) _handleFetch(el, trigger, _op_overrides, href, mode, input, (el: HTMLElement)=> _register(el));
                continue;
            }

            // Handle attribute parsing
            for(let setting of el.getAttribute(attr.name)?.split(";;") || [""]) {
                let isFetch = !/bind|sync/.test(attr.name) ? true : false,
                    parts = setting?.split(/\s*->\s*/g),
                    href = isFetch ? parts.pop() || "" : "",
                    triggers = (isFetch || _strippedMode == "sync") ? (parts.shift()?.match(/[^\(\)]{1,}/g)?.pop()?.split(_commaSepRx)?.map(s => s.trim()) || []) : null,
                    funcStr = parts?.[0] || "";

                console.log(_strippedMode, "SETTING:", setting, "TRIGGERS:", triggers, "FUNCSTR:", funcStr, "HREF:", href)
                let { func, as, dependencyList } = _parseFunction(funcStr);
                console.log("FUNC FROM STR", funcStr, func)
                // el._addFunc(func);

                if(!triggers) { 
                    _registerInternalStore(el, func, dependencyList); 
                    continue;
                }

                // Handle triggered events (sync, fetch)
                for(let trigger of triggers) {
                    console.log("HANDLING TRIGGERS", _strippedMode)
                    if(_strippedMode == "sync") {
                        console.log(el, $st, $fn, func)
                        let ev = (e?: Event): void => {
                            func?.({$el: el, $st, $fn});
                            _handlePushState(el, e);
                        }

                        if(trigger === "$mount") ev();
                        else el.addEventListener(trigger, ev);
                    }
                    else _handleFetch(el, trigger, _op_overrides, href, _strippedMode, func);
                }
            }
        }
    }
}

_register(document.body);