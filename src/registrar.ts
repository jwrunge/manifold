import { _store } from "./store";
import { _scheduleUpdate } from "./updates";
import { _commaSepRx, _getOpOverrides, _id, _parseFunction, ATTR_PREFIX } from "./util";
import { _handleFetch } from "./fetch";
import { _handleSync } from "./bindsync";
import { _handleTemplates } from "./templates";
import type { MfldOps } from "./common_types";
import { RegisteredElement } from "./registered_element";

let _ops: Partial<MfldOps> = {};
let _modes = ["bind", "sync", "templ", "if", "elseif", "else", "each", "get", "head", "post", "put", "delete", "patch", "promote"];

export let _setOptions = (newops: Partial<MfldOps>, profileName?: string): void => {
    if(profileName) _ops.profiles = { ..._ops.profiles, [profileName]: newops };
    else _ops = { ..._ops, ...newops };
}

window.addEventListener("popstate", () => {
    location.reload();
});

export let _register = (parent?: HTMLElement | null): void => {
    if(parent?.nodeType == Node.TEXT_NODE) return;

    let els: NodeListOf<HTMLElement> = (parent || document.body).querySelectorAll(
        `[${ATTR_PREFIX}${_modes.join(`],[${ATTR_PREFIX}`)}],a,form`
    );

    for(let el of [parent, ...els].map(e=> new RegisteredElement({element: e as HTMLElement, ops: _ops}))) {
        let _op_overrides = _getOpOverrides(structuredClone(_ops), el);

        if(el._dataset?.("promote")) {
            let [mode, href, input, trigger] = el._el.tagName == "A" ?
                ["get", (el._el as HTMLAnchorElement).href, undefined, "click"] :
                [(el._el as HTMLFormElement).method.toLowerCase(), (el._el as HTMLFormElement).action, () => "$form", "submit"];

            if(href) {
                _handleFetch(el, trigger, _op_overrides, href, mode, input, (el: HTMLElement)=> _register(el));
                continue;
            }
        }

        for(let mode of _modes) {
            for(let setting of el._dataset(mode)?.split(";;") || []) {
                let isFetch = /get|head|post|put|delete|patch/.test(mode) ? true : false,
                    parts = setting?.split(/\s*->\s*/g),
                    href = isFetch ? parts.pop() || "" : "",
                    triggers = isFetch || /sync/.test(mode) ? parts.shift()?.match(/[^\(\)]{1,}/g)?.pop()?.split(_commaSepRx)?.map(s => s.trim()) : [] || [],
                    funcStr = parts?.[0] || "";

                let { func, as, dependencyList } = _parseFunction(funcStr);
                console.log("PARSED", funcStr, as, dependencyList)

                if(/each|templ|if|else/.test(mode)) _handleTemplates(el, mode, as || [], func, dependencyList || [], _op_overrides);
                else {
                    if(!triggers?.length) triggers = [""];
                    for(let trigger of triggers) {
                        // HANDLE BIND, SYNC, FETCH
                        if(/bind/.test(mode)) {
                            console.log(el, setting, dependencyList)
                            el._registerInternalStore(func, dependencyList);
                        }
                        else if(/sync/.test(mode)) _handleSync(el, trigger, func);
                        else _handleFetch(el, trigger, _op_overrides, href, mode.replace(ATTR_PREFIX, ""), func);
                    }
                }
            }
        }
    }
}