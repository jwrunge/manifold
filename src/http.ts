import { FetchOptions } from "./domRegistrar";
import { scheduleDomUpdate } from "./domUpdates";

//Track scripts and styles
let pageScripts = new WeakMap();
let pageStyles = new WeakMap();
let parser = new DOMParser();

//Fetch page and replace content
export async function fetchHttp(ops: FetchOptions, parent: HTMLElement, done: (el: HTMLElement)=> void) {
    //Make sure we're allowed to fetch
    if(Array.isArray(ops.allowExternal) && !ops.allowExternal.some(allowed=> ops.href?.startsWith(allowed))) {
        console.warn(`${ops.method} ${ops.href} not allowed`);
        return;
    }

    //Fetch data
    let data = await fetch(ops.href, {
        ...ops.options,
        method: ops.method,
        body: ops.options?.body ? JSON.stringify(ops.options?.body || {}) : undefined,
    })
    .catch(error=> {
        ops.err?.(error);
    });

    let code = data?.status;

    //Handle onCode callback
    if(code && ops?.onCode?.(code) == false) return;

    //Handle response code gate
    for(let allow of ops?.allowCodes || []) {
        if(code && !(new RegExp(allow.replace(/\./g, "\\d"))).test(code.toString())) {
            console.warn(`${ops.method} ${ops.href} aborted: status ${code}`);
            return;
        }
    }

    //Return JSON or text in callback
    let text = await data?.[ops.type || "text"]();
    ops.cb?.(text);

    if ((ops?.type || "text") === "text" && ops?.replace) {
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

        let targets = ops.replace.map(r=> {
            let [ selector, relation ] = r.split(":");
            if(relation && !["inner", "append", "outer"].includes(relation)) throw(`Invalid relation: ${relation}`);
            let el = selector == "this" ? parent : document.querySelector(selector);
            return { el, relation };
        }) as { el: HTMLElement | null, relation: string }[];

        let replacements = ops.extract.map(e=> fullMarkup.querySelector(e)) as (HTMLElement | null)[];

        if(replacements.length !== targets.length) throw(`Target and replacement counts do not match`);

        targets.forEach((target, i) => {
            if(!target || !replacements[i]) return;
            scheduleDomUpdate({
                in: replacements[i] as HTMLElement,
                out: target.el as HTMLElement,
                relation: target.relation,
                done
            })
        });
    }
}

// //Clear dynamic elements
// function clearDynamicElements(parent: HTMLElement, map: WeakMap<HTMLElement, any[]>, type: string) {
//     let elements = map.get(parent) || [];
//     elements.forEach(el => el.remove());
//     map.set(parent, []);
// }