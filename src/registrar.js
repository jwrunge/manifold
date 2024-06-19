import { _glob, _store } from "./store.js";
import { _scheduleUpdate } from "./updates.js";
import { _commaSepRx, _getOpOverrides, _id, _parseFunction, ATTR_PREFIX } from "./util.js";
import { _handleFetch } from "./fetch.js";
import { _handleBind, _handleSync } from "./bindsync.js";
import { _handleTemplates } from "./templates.js";
/** @typedef {import("./index.js").MfldOps} MfldOps */

/** @type {Partial<MfldOps>} */
let _ops = {};
let _modes = ["bind", "sync", "templ", "if", "elseif", "else", "each", "get", "head", "post", "put", "delete", "patch"].map(m=> `${ATTR_PREFIX}${m}`);

/**!
 * @param {Partial<MfldOps>} newops 
 * @param {string} [profileName] 
 */
export let _setOptions = (newops, profileName)=> {
    if(profileName) _ops.profiles = { ..._ops.profiles, [profileName]: newops };
    else _ops = { ..._ops, ...newops };
}

// Handle location state changes
_glob.addEventListener("popstate", ()=> {
    location.reload();
});

export let {$fn, $st} = _glob.MFLD;

//Register subscriptions on the DOM (scopable in case an update needs run on a subset of the DOM)
/**
 * @param {HTMLElement | null} [parent] 
 */
export let _register = (parent)=> {
    if(parent?.nodeType == Node.TEXT_NODE) return;

    /** @type {NodeListOf<HTMLElement>} */
    let els = (parent || document.body).querySelectorAll(
        `[data-${_modes.join(`],[data-`)}],a,form`
    );

    for(let el of els) {
        let _op_overrides = _getOpOverrides(structuredClone(_ops), el);
        if(!el.id) el.id = _id();

        //Check for <a> and <form> elements
        if(el.dataset?.[`${ATTR_PREFIX}promote`] !== undefined) {
            let [mode, href, input, trigger] = el.tagName == "A" ?
                ["get", /** @type {HTMLAnchorElement}*/(el).href, undefined, "click"] : 
                [/** @type {HTMLFormElement}*/(el).method.toLowerCase(), /** @type {HTMLFormElement}*/(el).action, ()=> "$form", "submit"];

            if(href) {
                _handleFetch(el, trigger, _op_overrides, href, mode, input);
                continue;
            }
        }

        //Loop over all data attributes (modes)
        for(let mode in el.dataset) {
            if(!_modes.includes(mode)) continue;

            //Loop over provided settings
            for(let setting of el.dataset?.[mode]?.split(";;") || []) {
                //Break out settings
                let isFetch = mode.match(/get|head|post|put|delete|patch/) ? true : false,
                    parts = setting?.split(/\s*->\s*/g),
                    href = isFetch ? parts.pop() || "" : "",
                    triggers = isFetch || mode.match(/sync/) ? parts.shift()?.match(/[^\(\)]{1,}/g)?.pop()?.split(_commaSepRx)?.map(s=> s.trim()) : [] || [],
                    funcStr = parts?.[0] || "",
                    dependencyList = Array.from(new Set([...funcStr?.matchAll(/\$st\.(\w{1,})/g)].map(m=> m[1])));

                let {func, as} = _parseFunction(funcStr);
                
                //Handle templs and loops
                if(mode.match(/each|templ|if|else/)) _handleTemplates(el, mode, as || [], func, dependencyList, _op_overrides);
                else {
                    //Loop over triggers
                    if(!triggers?.length) triggers = [""]
                    for(let trigger of triggers) {
                        if(mode.match(/bind/)) _handleBind(el, func, dependencyList);
                        else if(mode.match(/sync/)) _handleSync(el, trigger, func);
                        else _handleFetch(el, trigger, _op_overrides, href, mode.replace(ATTR_PREFIX, ""), func);
                    }
                }
            }; //End loop settings
        }; //End loop dataset
    };  //End loop elements
}