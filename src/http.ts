import { FetchOptions } from "./domRegistrar";

//Track page scripts
let pageScripts: Map<string, HTMLScriptElement[]> = new Map();
let pageStyles: Map<string, HTMLStyleElement[]> = new Map();
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

    if((ops?.type || "text") == "text" && ops?.replace) {
        //Extract and replace (assumed HTML)
        let fullMarkup = parser.parseFromString(text, 'text/html').body;
        let replacements: NodeListOf<HTMLElement> = fullMarkup.querySelectorAll(ops.extract.join(","));

        //Clear existing scripts and styles (any previously dynamically loaded)
        for(let el of [...pageScripts.get(parent.id) || [], ...pageStyles.get(parent.id) || []]) el.remove();

        //Get scripts and styles
        let seek: string[] = ops.allowScripts ? ["scripts"] : [];
        if(ops.allowStyles) seek.push("style");
        if(seek.length) {
            let globls: NodeListOf<HTMLScriptElement | HTMLStyleElement> = fullMarkup.querySelectorAll(seek.join(","));
            for(let el of globls) {
                let isScript = el instanceof HTMLScriptElement;
                let source = isScript ? pageScripts : pageStyles;

                if(isScript ? ops.allowScripts : ops.allowStyles){
                    if(!source.has(parent.id)) source.set(parent.id, []);
                    source.get(parent.id)?.push(el as any);
                }
                else if(isScript) el.parentNode?.removeChild(el);
            }
        }

        let targets = ops.replace.map(r=> ["this", "outer", "inner"].includes(r) ? parent : document.querySelector(r)) as (HTMLElement | null)[];
        targets.forEach((target, i) => {
            const newEl = document.createElement('div');
            newEl.append(...Array.from(replacements[i].childNodes));
            target?.after(newEl);
            done?.(newEl);
        });
    }
}