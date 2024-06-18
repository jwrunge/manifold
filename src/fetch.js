import { _glob, _handlePushState, _parseFunction, ATTR_PREFIX } from "./util.js";
import { _scheduleUpdate } from "./updates";
import { _register } from "./registrar.js";
import { _store } from "./store.js";

/** @typedef {import("./index.js").MfldOps} MfldOps */

/**
 * @param {HTMLElement} el 
 * @param {string} trigger 
 * @param {MfldOps} fetchOps
 * @param {string} href
 * @param {string} [method] 
 * @param {Function} [processFunc]
 */
export let _handleFetch = (el, trigger, fetchOps, href, method, processFunc)=> {
    /**
     * @param {Event} [e]
     */
    let ev = async e=> {  
        e?.preventDefault();
        e?.stopPropagation();

        // Set from target element if relevant; fall back to "get"
        if(!method) method = /** @type {any}*/(e?.target)?.method || "get";
    
        //Make sure we're allowed to fetch
        let externalPermissions = fetchOps?.fetch?.externals?.find(allowed=> href?.startsWith(allowed.domain)) || 
            !href.match(/^https?:\/\//) || href.includes(location.origin) ? {
                scripts: true,
                styles: true,
        } : undefined;

        // Parse input
        let input = processFunc?.(...(paramList || [])) || paramList;
        let body = Array.isArray(input) ? input[0] : input == "$form" ? new FormData(/** @type {HTMLFormElement}*/(el)) : input;
        if(processFunc) {
            let toFunc = Array.isArray(input) ? (input?.map(s=> _store(s).value) || []) : [body];
            body = processFunc?.(...toFunc)
        }

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

            if(fullMarkup) {
                if(!externalPermissions?.styles) fullMarkup.querySelectorAll("style").forEach(s=> s.parentNode?.removeChild(s));
                if(externalPermissions?.scripts) {
                    fullMarkup.querySelectorAll("script").forEach(s=> {
                        let script = document.createElement("script");
                        script.src = s.src;
                        document.head.appendChild(script);
                    });
                }

                _scheduleUpdate({
                    in: /** @type {HTMLElement} */ (fullMarkup.querySelector(selector || "body")),
                    out: /** @type {HTMLElement} */ (toReplace ? document.querySelector(toReplace) : el),
                    relation: /** @type {"append" | "prepend" | "inner" | "outer"}*/(instruction),
                    ops: fetchOps,
                    done: (el)=> {
                        _register(el)
                    },
                });
            }
        }

        let resolveTxt = el.dataset?.[`${ATTR_PREFIX}resolve`];
        let resolveFunc = _parseFunction(resolveTxt || "")?.func;
        resolveFunc?.(resp);

        _handlePushState(el, e, href);
    }

    if(trigger == "$mount") ev();
    else el.addEventListener(trigger, ev);
}