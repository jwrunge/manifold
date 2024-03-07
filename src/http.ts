export type FetchOptions = {
    method: string, 
    href: string, 
    type?: "json" | "text", 
    extract: string[], 
    replace: string[], 
    options?: {[key: string]: any}, 
    cb?: (val: any)=> void, 
    err?: (err: any)=> void, 
    allowCodes?: string[],
    onCode?: (code: number)=> boolean | void,
    allowExternal?: boolean | string[],
    allowScripts?: true | false, 
    allowStyles?: true | false | "all",
}

//Track page scripts
let pageScripts: Map<string, HTMLScriptElement[]> = new Map();
let pageStyles: Map<string, HTMLStyleElement[]> = new Map();
let parser = new DOMParser();

let scriptRx = /<script[\s\S]*?>[\s\S]*?<\/script>/ig;
let styleRx = /<style[\s\S]*?>[\s\S]*?<\/style>/ig;

//Fetch page and replace content
export async function fetchHttp(ops: FetchOptions, reqid: string, done: (el: HTMLElement)=> void) {
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
        let replacements = ops.extract.map(ext=> (parser.parseFromString(text, 'text/html').body).querySelector(ext)?.innerHTML || "");

        //Clear existing scripts and styles (any previously dynamically loaded)
        for(let el of [...pageScripts.get(reqid) || [], ...pageStyles.get(reqid) || []]) el.remove();

        //Handle scripts
        if(ops.allowScripts) {
            scriptRx.exec(text)?.every(scriptStr=> {
                let script = document.createElement("script");
                script.type = "text/javascript";
                script.src = scriptStr.match(/src="([\s\S]*?)"/i)?.[1] || "";
                script.text = scriptStr.replace(/<\/?script>/ig, "");
                
                if(!pageScripts.has(reqid)) pageScripts.set(reqid, []);
                pageScripts.get(reqid)?.push(script);
                document.body.appendChild(script);
            });
        }
        else replacements = replacements.map(r=> r.replace(scriptRx, ""));

        //Handle styles
        if(!ops.allowStyles) replacements = replacements.map(r=> r.replace(styleRx, ""));
        else if(ops.allowStyles == "all") {
            for(let styleTxt of styleRx.exec(text) || []) {
                let style = document.createElement("style");
                style.textContent = styleTxt.replace(/<\/?style>/ig, "");
                
                if(!pageStyles.has(reqid)) pageStyles.set(reqid, []);
                pageStyles.get(reqid)?.push(style);
                document.head.appendChild(style);
            }
        }

        let targets = ops.replace.map(r=> document.querySelector(r));
        for(let i=0; i < ops.replace.length; i++) {
            if(targets[i]) {
                (targets[i] as HTMLElement).innerHTML = replacements[i];
                done?.(targets[i] as HTMLElement);
            }
        }
    }
}