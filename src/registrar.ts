import { _store } from "./store";
import { _scheduleUpdate } from "./updates";
import { _commaSepRx, _getOpOverrides, _id, _parseFunction, ATTR_PREFIX } from "./util";
import { _handleFetch } from "./fetch";
import { _handleBind, _handleSync } from "./bindsync";
import { _handleTemplates } from "./templates";
import type { MfldOps } from "./common_types";

let _ops: Partial<MfldOps> = {};
let _modes = ["bind", "sync", "templ", "if", "elseif", "else", "each", "get", "head", "post", "put", "delete", "patch", "promote"].map(m => `${ATTR_PREFIX}${m}`);

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
        `[data-${_modes.join(`],[data-`)}],a,form`
    );

    for (let el of [parent, ...els] as HTMLElement[]) {
        let _op_overrides = _getOpOverrides(structuredClone(_ops), el);
        if(!el.id) el.id = _id();

        if(el.dataset?.[`${ATTR_PREFIX}promote`] !== undefined) {
            let [mode, href, input, trigger] = el.tagName == "A" ?
                ["get", (el as HTMLAnchorElement).href, undefined, "click"] :
                [(el as HTMLFormElement).method.toLowerCase(), (el as HTMLFormElement).action, () => "$form", "submit"];

            if(href) {
                _handleFetch(el, trigger, _op_overrides, href, mode, input, (el: HTMLElement)=> _register(el));
                continue;
            }
        }

        for (let mode in el.dataset) {
            if(!_modes.includes(mode)) continue;

            for (let setting of el.dataset?.[mode]?.split(";;") || []) {
                let isFetch = /get|head|post|put|delete|patch/.test(mode) ? true : false,
                    parts = setting?.split(/\s*->\s*/g),
                    href = isFetch ? parts.pop() || "" : "",
                    triggers = isFetch || /sync/.test(mode) ? parts.shift()?.match(/[^\(\)]{1,}/g)?.pop()?.split(_commaSepRx)?.map(s => s.trim()) : [] || [],
                    funcStr = parts?.[0] || "",
                    dependencyList = Array.from(new Set([...funcStr?.matchAll(/\$st\.(\w{1,})/g)].map(m => m[1])));

                let { func, as } = _parseFunction(funcStr);

                if(/each|templ|if|else/.test(mode)) _handleTemplates(el, mode, as || [], func, dependencyList, _op_overrides);
                else {
                    if(!triggers?.length) triggers = [""];
                    for (let trigger of triggers) {
                        if(/bind/.test(mode)) _handleBind(el, func, dependencyList);
                        else if(/sync/.test(mode)) _handleSync(el, trigger, func);
                        else _handleFetch(el, trigger, _op_overrides, href, mode.replace(ATTR_PREFIX, ""), func);
                    }
                }
            }
        }
    }
}