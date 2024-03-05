import { FetchOptions } from "./options";

//Track page scripts
let pageScripts: HTMLScriptElement[] = [];
let pageStyles: HTMLStyleElement[] = [];
let parser = new DOMParser();

let scriptRx = /<script[\s\S]*?>[\s\S]*?<\/script>/ig;
let styleRx = /<style[\s\S]*?>[\s\S]*?<\/style>/ig;

//Fetch page and replace content
export async function fetchHttp(ops: FetchOptions) {
    //Make sure we're allowed to fetch
    if(!ops.allowExternal) {
        if(ops.href.startsWith("http")) return;
    }
    else if(Array.isArray(ops.allowExternal) && !ops.allowExternal.some(allowed=> ops.href.startsWith(allowed))) return;

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
    if(ops.allowCodes?.length) {
        for(let allow of ops?.allowCodes) {
            let allowRx = new RegExp(allow.replace(/\./g, "\\d"));
            if(code && !allowRx.test(code.toString())) {
                console.warn(`Fetch ${ops.href} aborted due to disallowed status ${code}`);
                return;
            }
        }
    }

    //Return JSON or text in callback
    let text = await data?.[ops.type || "text"]();
    ops.cb?.(text);

    if((ops?.type || "text") == "text" && ops?.replace) {
        //Extract and replace (assumed HTML)
        let newHtml = parser.parseFromString(text, 'text/html').body;
        let replacement = newHtml.querySelector(ops.extract)?.innerHTML || "";
        let target = document.querySelector(ops.replace);

        //Clear existing scripts and styles (any previously dynamically loaded)
        for(let el of [...pageScripts, ...pageStyles]) el.remove();
        for(let style of pageStyles) style.remove();

        //Handle scripts
        if(!ops.scriptUse) replacement = replacement.replace(scriptRx, "");
        else {
            scriptRx.exec(ops.scriptUse == "all" ? text : replacement)?.every(scriptStr=> {
                let script = document.createElement("script");
                script.src = scriptStr.match(/src="([\s\S]*?)"/i)?.[1] || "";
                if(!script.src) script.appendChild(document.createTextNode(scriptStr.replace(/<\/?script>/ig, "")));
                
                pageScripts.push(script);
                document.body.appendChild(script);
            });
        }

        //Handle styles
        if(!ops.styleUse) replacement = replacement.replace(styleRx, "");
        else if(ops.styleUse == "all") {
            for(let styleTxt of styleRx.exec(text) || []) {
                let style = document.createElement("style");
                style.textContent = styleTxt.replace(/<\/?style>/ig, "");
                
                pageStyles.push(style);
                document.head.appendChild(style);
            }
        }

        if(target) {
            target.innerHTML = replacement;
            ops.done?.(target as HTMLElement);
        }
    }
}