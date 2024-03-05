import { FetchOptions } from "./options";

//Track page scripts
let pageScripts: HTMLScriptElement[] = [];
let pageStyles: HTMLStyleElement[] = [];

//Fetch page and replace content
export async function fetchHttp(ops: FetchOptions) {
    console.log("FETCHING", ops)

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
        console.error(error);
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

    if(ops.type == "text" && ops.replace) {
        //Extract and replace (assumed HTML)
        let wrapper = document.createElement("div");
        wrapper.innerHTML = text;
        let replacement = wrapper.querySelector(ops.extract)?.innerHTML || "";
        let target = document.querySelector(ops.replace);

        //Clear existing scripts and styles (any previously dynamically loaded)
        for(let script of pageScripts) script.remove();
        for(let style of pageStyles) style.remove();
        pageScripts = pageStyles = [];

        //Handle scripts
        if(ops.scriptUse) {
            let scripts = getScriptsFromHtmlString(ops.scriptUse == "all" ? text : replacement);
            scripts?.every(script=> {
                pageScripts.push(script);
                document.body.appendChild(script);
            })
        }

        //Handle styles
        let styleRx = /<style[\s\S]*?>[\s\S]*?<\/style>/ig;
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

//Execute script tags if allowed
function getScriptsFromHtmlString(html: string) {   
    return /<script[\s\S]*?>[\s\S]*?<\/script>/ig.exec(html)?.map(scriptStr=> {
        let script = document.createElement("script");

        script.src = scriptStr.match(/src="([\s\S]*?)"/i)?.[1] || "";
        if(!script.src) script.appendChild(document.createTextNode(scriptStr.replace(/<\/?script>/ig, "")));

        return script;
    });
}