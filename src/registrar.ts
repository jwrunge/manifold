import { _commaSepRx, _getOpOverrides, _handlePushState, _parseFunction, ATTR_PREFIX } from "./util";
import { _handleFetch } from "./fetch";
import { MfldOps, $fn, $st } from "./common_types";
import { _registerElement } from "./registered_element";

let _ops: Partial<MfldOps> = {};
let _modes = ["bind", "sync", "templ", "if", "elseif", "else", "each", "get", "head", "post", "put", "delete", "patch", "promote"];

export let _setOptions = (newops: Partial<MfldOps>, profileName?: string): void => {
    if(profileName) _ops.profiles = { ..._ops.profiles, [profileName]: newops };
    else _ops = { ..._ops, ...newops };
}

window.addEventListener("popstate", () => {
    location.reload();
});

export let _register = (parent?: HTMLElement | null, noparent = false): void => {
    if(!parent || parent?.nodeType == Node.TEXT_NODE) return;

    let suffix = ":not(._mfld)";
    let els: NodeListOf<HTMLElement> = (parent).querySelectorAll(
        `[${ATTR_PREFIX}${_modes.join(`]${suffix},[${ATTR_PREFIX}`)}]${suffix}`
    );

    for(let el of (noparent ? [...els] : [parent, ...els]).map(e=> _registerElement(e as HTMLElement, _ops))) {
        let _op_overrides = _getOpOverrides(structuredClone(_ops), el);

        for(let mode of _modes) {
            // Early exit
            if(el._attribute(mode) === null) continue;

            // Handle promote
            if(mode == "promote") {
                let [mode, href, input, trigger] = el._el.tagName == "A" ?
                    ["get", (el._el as HTMLAnchorElement).href, undefined, "click"] :
                    [(el._el as HTMLFormElement).method?.toLowerCase(), (el._el as HTMLFormElement).action, () => "$form", "submit"];
                if(href) _handleFetch(el, trigger, _op_overrides, href, mode, input, (el: HTMLElement)=> _register(el));
                continue;
            }

            // Handle attribute parsing
            for(let setting of el._attribute(mode)?.split(";;") || [""]) {
                let isFetch = /get|head|post|put|delete|patch/.test(mode) ? true : false,
                    parts = setting?.split(/\s*->\s*/g),
                    href = isFetch ? parts.pop() || "" : "",
                    triggers = (isFetch || mode == "sync") ? (parts.shift()?.match(/[^\(\)]{1,}/g)?.pop()?.split(_commaSepRx)?.map(s => s.trim()) || []) : null,
                    funcStr = parts?.[0] || "";

                let { func, as, dependencyList } = _parseFunction(funcStr);
                el._addFunc(func);

                if(!triggers) {
                    if(mode == "bind") el._registerInternalStore(func, dependencyList);
                    continue;
                }

                // Handle triggered events (sync, fetch)
                for(let trigger of triggers) {
                    if(mode == "sync") {
                        let ev = (e?: Event): void => {
                            func?.({$el: el._el, $st, $fn});
                            _handlePushState(el, e);
                        }

                        if(trigger === "$mount") ev();
                        else el._addListener(trigger, ev);
                    }
                    else _handleFetch(el, trigger, _op_overrides, href, mode.replace(ATTR_PREFIX, ""), func);
                }
            }
        }
    }
}