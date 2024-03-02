import { registerSubs } from "./domRegistrar";

//Track page scripts
let pageScripts: HTMLScriptElement[] = [];
let pageStyles: HTMLStyleElement[] = [];

//Fetch page and replace content
export async function fetchHttp(method: string, href: string, type: "json" | "text", extract = "body", replace = "body", options: {[key: string]: any}, cb?: (val: any)=> void, err?: (err: any)=> void, scriptUse: true | false | "all" = true, styleUse: true | false | "all" = true) {
    let data = await fetch(href, {
        ...options,
        method,
        body: typeof options.body == "string" ? options.body : JSON.stringify(options.body),
    })
    .catch(error=> err?.(error));

    //Return JSON in callback
    if(type == "json") return cb?.(data?.json());
    
    //Handle text
    let text = await data?.text() || "";
    if(!(extract && replace)) return cb?.(text);

    //Extract and replace (assumed HTML)
    let wrapper = document.createElement("div");
    wrapper.innerHTML = text;
    let replacement = wrapper.querySelector(extract)?.innerHTML || "";
    let target = document.querySelector(replace);

    //Clear existing scripts and styles (any previously dynamically loaded)
    for(let script of pageScripts) {
        script.remove();
    }

    for(let style of pageStyles) {
        style.remove();
    }

    let styleRx = /<style[\s\S]*?>[\s\S]*?<\/style>/ig;
    if(styleUse == false) {
        replacement = replacement.replace(styleRx, "");
    }

    //Get scripts
    if(scriptUse) {
        let scripts = getScriptsFromHtmlString(scriptUse === "all" ? text : replacement);
        for(let script of scripts) {
            pageScripts.push(script as HTMLScriptElement);
            document.body.appendChild(script);
        }
    }

    if(styleUse && styleUse == "all") {
        let styles = styleRx.exec(text) || [];
        console.log(styles)
        for(let styleTxt of styles) {
            let style = document.createElement("style");
            style.textContent = styleTxt.replace(/<\/?style>/ig, "");
            pageStyles.push(style);
            document.head.appendChild(style);
        }
    }

    if(target) {
        target.innerHTML = replacement;
        registerSubs(target);
    }

    //Run callback
    if(cb) cb(replacement);
}

//Execute script tags if allowed
function getScriptsFromHtmlString(html: string): HTMLScriptElement[] {
    let scripts: HTMLScriptElement[] = [];

    let rx = /<script[\s\S]*?>[\s\S]*?<\/script>/ig;
    let scriptStrings = rx.exec(html);
    
    for(let scriptStr of scriptStrings || []) {
        let script = document.createElement("script");

        //Handle script src
        let src = scriptStr.match(/src="([\s\S]*?)"/i)?.[1] || "";
        if(src) {
            script.src = src;
        }
        //Handle inline script
        else {
            let inline = document.createTextNode(scriptStr.replace(/<\/?script>/ig, ""));
            script.appendChild(inline);
        }

        scripts.push(script)
    }

    return scripts;
}

// //When a link is clicked, fetch the page and replace the content; update URL
// function onNavigate(e: Event, href: string) {
//     e.preventDefault();
//     fetchHttp(href, ()=> {
//         //Update URL
//         history.pushState({ href }, "", href);
//     });
// }

// //When the back button is pressed, fetch the page and replace the content; update URL
// export function handlePopState() {
//     window.addEventListener("popstate", (e)=> {
//         fetchHttp(e.state.href);
//     });
// }

// //When the page is loaded, fetch the page and replace the content; update URL
// export function initializeRoute() {
//     let href = location.href;
//     fetchHttp(href, ()=> {
//         //Get initial url and fetch / render
//         history.replaceState({ href }, "", href);
//     });
// }

// //Intercept all links and route them through the SPA
// export function interceptLinks() {
//     //Get any navigation elements
//     let navLinks = document.querySelectorAll("a[href]") as NodeListOf<HTMLElement>;

//     //Get each href and add listener
//     for(let link of navLinks) {
//         let href = link.getAttribute("href");
//         if(!href) continue;

//         //Route if external, otherwise fetch and use SPA
//         if(!/https?:\/\//.test(href)) {
//             let newLink = link.cloneNode(true);
//             link.parentNode?.replaceChild(newLink, link);
//             newLink.addEventListener("click", (e) => onNavigate(e, href || "/"));
//         }
//     }
// }
