import { registerSubs } from "./domRegistrar";

//Track page scripts
let pageScripts: HTMLScriptElement[] = [];
let pageStyles: HTMLStyleElement[] = [];

type FetchOptions = {
    method: string, 
    href: string, 
    type: "json" | "text", 
    extract: string, 
    replace: string, 
    options: {[key: string]: any}, 
    cb?: (val: any)=> void, 
    err?: (err: any)=> void, 
    scriptUse: true | false | "all", 
    styleUse: true | false | "all",
    done: (el: HTMLElement)=> void
}

//Fetch page and replace content
export async function fetchHttp(ops: FetchOptions) {
    let data = await fetch(ops.href, {
        ...ops.options,
        method: ops.method,
        body: typeof ops.options.body == "string" ? ops.options.body : JSON.stringify(ops.options.body),
    })
    .catch(error=> ops.err?.(error));

    //Return JSON or text in callback
    let text = await data?.[ops.type]();
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
            ops.done(target as HTMLElement);
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
