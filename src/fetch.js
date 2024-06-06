import { _getOpOverrides, _parseFunction, ATTR_PREFIX } from "./util.js";
import { _scheduleUpdate } from "./updates";
import { _registerSubs } from "./registrar.js";
import { _store } from "./store.js";

/** @typedef {import("./index.module.js").MfldOps} MfldOps */

/**
 * @param {HTMLElement} el 
 * @param {string} trigger 
 * @param {MfldOps} _ops
 * @param {string} href
 * @param {string} [method] 
 * @param {string[]} [input]
 * @param {Function} [processFunc]
 */
export function _handleFetch(el, trigger, _ops, href, method, input, processFunc) {
    /**
     * @param {Event} [e]
     */
    let ev = async e=> {  
        e?.preventDefault();
        e?.stopPropagation();

        let fetchOps = _getOpOverrides(_ops, el);

        // Set from target element if relevant; fall back to "get"
        if(!method) method = /** @type {any}*/(e?.target)?.method || "get";

        // if(["click", "submit"].includes(trigger) || ["A", "FORM"].includes(target?.nodeName)) {
        //     history.pushState(
        //         {fetchData, elId: el.id}, 
        //         "", 
        //         target?.href || target?.action || ""
        //     );
        // }
    
        //Make sure we're allowed to fetch
        let externalPermissions = fetchOps?.fetch?.externals?.find(allowed=> href?.startsWith(allowed.domain)) || 
            !href.match(/^https?:\/\//) || href.includes(location.origin) ? {
                scripts: true,
                styles: true,
        } : undefined;

        // Parse input
        let body = input;
        if(processFunc) {
            body = processFunc?.(
                ...(input?.map(s=> _store(s).value) || [])
            )
        }

        //Fetch data
        let data = await fetch(href, {
            ...(fetchOps?.fetch?.request || {}),
            headers: {
                ...fetchOps?.fetch?.request?.headers,
                "Manifold-App-Fetch": "true",
            },
            method,
            body: typeof body == "string" ? body : JSON.stringify(body),
        })
        .catch(error=> {
            fetchOps?.fetch?.err?.(error) || console.error("FETCH ERROR", error);
        });

        //Handle onCode callback
        let code = data?.status;
        if(code && fetchOps?.fetch?.onCode?.(code, data) == false) return;

        //Return JSON or text in callback
        let resp = await data?.[fetchOps?.fetch?.responseType || "text"]();

        // Handle resolutions
        for(let instruction of ["append", "prepend", "swapinner", "swapouter"]) {
            let ds = el.dataset[`${ATTR_PREFIX}${instruction}`];
            if(ds === undefined) continue;
            let [selector, toReplace] = ds?.split("->").map(s=> s.trim()) || [];

            //Extract content and schedule a DOM update
            let fullMarkup = (new DOMParser())?.parseFromString?.(resp, 'text/html');
            if(fullMarkup) {
                _scheduleUpdate({
                    in: /** @type {HTMLElement} */ (fullMarkup.querySelector(selector || "body")),
                    out: /** @type {HTMLElement} */ (toReplace ? document.querySelector(toReplace) : el),
                    relation: /** @type {"append" | "prepend" | "swapinner" | "swapouter"}*/(instruction),
                    ops: fetchOps,
                    done: (el)=> {
                        _registerSubs(el)
                    },
                })
            }
        }

        let resolveTxt = el.dataset?.[`${ATTR_PREFIX}resolve`];
        let resolveFunc = _parseFunction(resolveTxt || "")?.func;
        resolveFunc?.(resp);

            // //Clear existing scripts/styles
            // for(let s of [pageScripts, pageStyles]) {
            //     let elements = s.get(fullMarkup) || [];
            //     elements.forEach(el => el.remove());
            //     s.set(fullMarkup, []);
            // }

            // //Get scripts and styles
            // let seek: string[] = ops.allowScripts ? ["scripts"] : [];
            // if(ops.allowStyles) seek.push("style");
            // if(seek.length) {
            //     let globls: NodeListOf<HTMLScriptElement | HTMLStyleElement> = fullMarkup.querySelectorAll(seek.join(","));
            //     for(let el of globls) {
            //         let isScript = el instanceof HTMLScriptElement;
            //         let source = isScript ? pageScripts : pageStyles;

            //         if(isScript ? ops.allowScripts : ops.allowStyles){
            //             if(!source.has(parent)) source.set(parent, []);
            //             source.get(parent)?.push(el as any);
            //         }
            //         else if(isScript) el.parentNode?.removeChild(el);
            //     }
            // }
    }

    if(trigger == "$mount") ev();
    else el.addEventListener(trigger, ev);
}