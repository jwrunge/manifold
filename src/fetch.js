import { _handlePushState, _parseFunction, ATTR_PREFIX } from "./util.js";
import { _scheduleUpdate } from "./updates";
import { _register } from "./registrar.js";
import { _store } from "./store.js";
import { $fn, $st } from "./index.js";

/** @typedef {import("./index.js").MfldOps} MfldOps */

/**
 * @param {HTMLElement} el 
 * @param {string} trigger 
 * @param {MfldOps} fetchOps
 * @param {string} href
 * @param {string} [method] 
 * @param {Function} [func]
 */
export let _handleFetch = (el, trigger, fetchOps, href, method, func)=> {
    /**
     * @param {Event} [e]
     */

    let ev = async e=> {  
        e?.preventDefault();
        e?.stopPropagation();

        // Set from target element if relevant; fall back to "get"
        if(!method) method = /** @type {any}*/(e?.target)?.method || "get";
    
        //Make sure we're allowed to fetch
        /** @type {import("./index.js").ExternalOptions | undefined} */
        let externalPermissions = fetchOps?.fetch?.externals?.find(allowed=> {
            return (allowed.domain == "$origin" && href.startsWith(location.origin)) || href?.startsWith(allowed.domain)
        });
        if(!externalPermissions) externalPermissions = href.startsWith(location.origin) ? { domain: "$origin", scripts: "selected", styles: "selected" } : undefined;

        // Parse input
        let input = func?.({$el: el, $st, $fn});
        let body = input == "$form" ? new FormData(/** @type {HTMLFormElement}*/(el)) : input;

        //Fetch data
        let data = await fetch(href, {
            ...(fetchOps?.fetch?.request || {}),
            headers: {
                ...fetchOps?.fetch?.request?.headers,
                "MFLD": "true",
            },
            method,
            body: input == "$form" || typeof body == "string" ? body : JSON.stringify(body),
        })
        .catch(error=> {
            fetchOps?.fetch?.err?.(error);
        });

        //Handle onCode callback
        let code = data?.status;
        if(code && fetchOps?.fetch?.onCode?.(code, data) == false) return;

        //Return JSON or text in callback
        let resp = await data?.[fetchOps?.fetch?.resType || "text"]();

        // Handle resolutions
        /** @type {import("./updates").DomWorkOrder | undefined} */
        for(let instruction of ["append", "prepend", "inner", "outer"]) {
            let ds = el.dataset[`${ATTR_PREFIX}${instruction}`];
            if(ds === undefined) continue;
            let [selector, toReplace] = ds?.split("->").map(s=> s.trim()) || [];

            //Extract content and schedule a DOM update
            let fullMarkup = (new DOMParser())?.parseFromString?.(resp, 'text/html');
            let inEl = /** @type {HTMLElement} */ (fullMarkup.querySelector(selector || "body"));

            if(fullMarkup) {
                let scripts = [];
                if(!externalPermissions?.styles) fullMarkup.querySelectorAll("style").forEach(s=> s.parentNode?.removeChild(s));
                (externalPermissions?.scripts == "all" ? fullMarkup : inEl).querySelectorAll("script")?.forEach(s=> {
                    if(["all", "selected"].includes(externalPermissions?.scripts || "")) scripts.push(s);
                    s.parentNode?.removeChild(s);
                });

                _scheduleUpdate({
                    in: inEl,
                    out: /** @type {HTMLElement} */ (toReplace ? document.querySelector(toReplace) : el),
                    relation: /** @type {"append" | "prepend" | "inner" | "outer"}*/(instruction),
                    ops: fetchOps,
                    done: (el)=> {
                        _register(el);
                        for(let s of scripts) {
                            let n = document.createElement("script");
                            n.textContent = s.textContent;
                            el.appendChild(n);
                        }
                    },
                });
            }
        }

        let resolveTxt = el.dataset?.[`${ATTR_PREFIX}resolve`];
        let resolveFunc = _parseFunction(resolveTxt || "")?.func;
        resolveFunc?.({$el: el, $st, $fn, $body: resp});

        _handlePushState(el, e, href);
    }

    if(trigger == "$mount") ev();
    else el.addEventListener(trigger, ev);
}