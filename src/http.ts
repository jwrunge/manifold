import { FetchOptions } from "./domRegistrar";

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
        let replacements = Array.from(fullMarkup.querySelectorAll(ops.extract.join(",")));
    
        //Clear existing scripts/styles
        clearDynamicElements(parent, pageScripts, "script");
        clearDynamicElements(parent, pageStyles, "style");;

        //Get scripts and styles
        let seek: string[] = ops.allowScripts ? ["scripts"] : [];
        if(ops.allowStyles) seek.push("style");
        if(seek.length) {
            let globls: NodeListOf<HTMLScriptElement | HTMLStyleElement> = fullMarkup.querySelectorAll(seek.join(","));
            for(let el of globls) {
                let isScript = el instanceof HTMLScriptElement;
                let source = isScript ? pageScripts : pageStyles;

                if(isScript ? ops.allowScripts : ops.allowStyles){
                    if(!source.has(parent)) source.set(parent, []);
                    source.get(parent)?.push(el as any);
                }
                else if(isScript) el.parentNode?.removeChild(el);
            }
        }

        let targets = ops.replace.map(r=> ["this", "outer", "inner"].includes(r) ? parent : document.querySelector(r)) as (HTMLElement | null)[];

        //Replacement with fragment batching
        let fragment = document.createDocumentFragment();
        targets.forEach((target, i) => {
            let newEl = fragment.appendChild(replacements[i].cloneNode(true)); //Clone for safety
            
            target?.after(newEl);
            done?.(newEl as HTMLElement);
        });
        parent.appendChild(fragment); //Append all elements at once
    }
}

//Clear dynamic elements
function clearDynamicElements(parent: HTMLElement, map: WeakMap<HTMLElement, any[]>, type: string) {
    let elements = map.get(parent) || [];
    elements.forEach(el => el.remove());
    map.set(parent, []);
}