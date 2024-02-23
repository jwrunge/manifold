//Track page scripts
let pageScripts: HTMLScriptElement[] = [];

//Fetch page and replace content
function fetchAndReplace(href: string, cb?: ()=> void) {
    fetch(href).then(res=> {
        res.text().then(text=> {
            //Parse response text
            const resultTxt = text.match(/<body>([\s\S]*)<\/body>/i)?.[0]?.replace(/<\/?body>/ig, "");
            const wrapper = document.createElement("div");
            wrapper.innerHTML = resultTxt || "";

            //Get content
            const headerContent = getHtmlFromString(resultTxt || "", wrapper, "header");
            const bodyContent = getHtmlFromString(resultTxt || "", wrapper, "body");
            const footerContent = getHtmlFromString(resultTxt || "", wrapper, "footer");

            //Clear existing scripts
            for(const script of pageScripts) {
                script.remove();
            }

            //Get scripts
            [["header", headerContent], ["body", bodyContent], ["footer", footerContent]].forEach(focus=> {
                const scripts = getScriptsFromHtmlString(focus[1], focus[0] as keyof Config);
                for(const script of scripts) {
                    pageScripts.push(script);
                    document.body.appendChild(script);
                }
            });
            
            //Update store
            IncomingPart.update(ip=> {
                //Header
                ip[headerSelector] = {
                    content: headerContent,
                    hash: hash(headerContent)
                };

                //Body
                ip[bodySelector] = {
                    content: bodyContent,
                    hash: hash(bodyContent)
                };

                //Footer
                ip[footerSelector] = {
                    content: footerContent,
                    hash: hash(footerContent)
                };

                return ip;
            });

            //Run callback
            if(cb) cb();
        });
    });
}

//Get HTML from RegEx or querySelector for specified part
function getHtmlFromString(html: string, htmlWrapper: HTMLElement, category: keyof Config): string {
    let content = "";

    //RegEx
    if(get(appConfig)?.[category]?.regex) {
        let query = new RegExp(get(appConfig)?.[category]?.selector, "gm");
        content = html?.match(query)?.[0] || "";
    }
    //querySelector
    else {
        let query = htmlWrapper?.querySelector(get(appConfig)?.[category]?.selector);
        content = query?.innerHTML || "";
    }

    return content || "";
}

//Execute script tags if allowed
function getScriptsFromHtmlString(html: string, category: keyof Config): HTMLScriptElement[] {
    let scripts: HTMLScriptElement[] = [];

    if(get(appConfig)?.[category]?.allowScriptExecution) {
        let scriptStrings = /<script[\s\S]*?>[\s\S]*?<\/script>/ig.exec(html);
        
        for(let scriptStr of scriptStrings || []) {
            const script = document.createElement("script");

            //Handle script src
            const src = scriptStr.match(/src="([\s\S]*?)"/i)?.[1] || "";
            if(src) {
                script.src = src;
            }
            //Handle inline script
            else {
                const inline = document.createTextNode(scriptStr.replace(/<\/?script>/ig, ""));
                script.appendChild(inline);
            }

            scripts.push(script)
        }
    }

    return scripts;
}

//When a link is clicked, fetch the page and replace the content; update URL
function onNavigate(e: Event, href: string) {
    e.preventDefault();
    fetchAndReplace(href, ()=> {
        //Update URL
        history.pushState({ href }, "", href);
    });
}

//When the back button is pressed, fetch the page and replace the content; update URL
export function handlePopState() {
    window.addEventListener("popstate", (e)=> {
        fetchAndReplace(e.state.href);
    });
}

//When the page is loaded, fetch the page and replace the content; update URL
export function initializeRoute() {
    const href = location.href;
    fetchAndReplace(href, ()=> {
        //Get initial url and fetch / render
        history.replaceState({ href }, "", href);
    });
}

//Intercept all links and route them through the SPA
export function interceptLinks() {
    //Get any navigation elements
    const navLinks = document.querySelectorAll("a[href]") as NodeListOf<HTMLElement>;

    //Get each href and add listener
    for(let link of navLinks) {
        const href = link.getAttribute("href");
        if(!href) continue;

        //Route if external, otherwise fetch and use SPA
        if(!/https?:\/\//.test(href)) {
            const newLink = link.cloneNode(true);
            link.parentNode?.replaceChild(newLink, link);
            newLink.addEventListener("click", (e) => onNavigate(e, href || "/"));
        }
    }
}
