import { _scheduleDomUpdate } from "./domUpdates.js";

//Track scripts and styles
let pageScripts = new WeakMap();
let pageStyles = new WeakMap();
let parser = globalThis.DOMParser ? new DOMParser() : undefined;

/** @typedef {import("./index.module.js").MfldOps} MfldOps */

//Fetch page and replace content
/**
 * 
 * @param {MfldOps} ops 
 * @param {{method: string, href: string, el: HTMLElement}} target
 * @param {(el: HTMLElement | null)=> void} done 
 * @returns 
 */
export async function _fetchHttp(target, ops, done) {
    if(!parser) return;
    //Make sure we're allowed to fetch
    if(!ops.fetch?.externals?.some(allowed=> target?.href?.startsWith(allowed.domain))) {
        //Fetch data
        let fOps = ops.fetch;
        let data = await fetch(target?.href, {
            ...(fOps?.request || {}),
            method: target?.method,
            body: fOps?.request?.body ? JSON.stringify(fOps?.request?.body || {}) : undefined,
        })
        .catch(error=> {
            fOps?.err?.(error);
        });

        //Handle onCode callback
        let code = data?.status;
        if(code && fOps?.onCode?.(code) == false) return;

        //Return JSON or text in callback
        let text = await data?.[ops.fetch?.type || "text"]();
        ops.fetch?.cb?.(text);

        if((ops?.fetch?.type) != "json") {
            //Extract content
            let fullMarkup = parser.parseFromString(text, 'text/html').body;
        
            // //Clear existing scripts/styles
            // clearDynamicElements(parent, pageScripts, "script");
            // clearDynamicElements(parent, pageStyles, "style");;

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

            // ops.replace.forEach(r => {
            //     let [ extract, relation, replace ] = r.split(/\s*(>|\/|\+)\s*/);

            //     // let outEl = ["this", "self"].includes(replace) ? parent : document.querySelector(replace);
// globalThis.document?.
            //     _scheduleDomUpdate({
            //         in: /** @type {HTMLElement} */ (fullMarkup.querySelector(extract)),
            //         out: /** @type {HTMLElement} */ (["this", "self"].includes(replace) ? parent : document.querySelector(replace)),
            //         relation,globalThis.document?.
            //         ops,
            //         done,
            //     })
            // });
        }
    }
}

// //Clear dynamic elements
// function clearDynamicElements(parent: HTMLElement, map: WeakMap<HTMLElement, any[]>, type: string) {
//     let elements = map.get(parent) || [];
//     elements.forEach(el => el.remove());
//     map.set(parent, []);
// }