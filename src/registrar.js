import { _store } from "./store.js";
import { _scheduleUpdate } from "./updates.js";
import { _commaSepRx, _getOpOverrides, _glob, _parseFunction, ATTR_PREFIX } from "./util.js";
import { _handleFetch } from "./fetch.js";
import { _handleBindSync } from "./bindsync.js";
import { _handleTemplates } from "./templates.js";
/** @typedef {import("./index.js").MfldOps} MfldOps */

/** @type {Partial<MfldOps>} */
let _ops = {};
let _modes = ["bind", "sync", "templ", "if", "each", "get", "head", "post", "put", "delete", "patch"].map(m=> `${ATTR_PREFIX}${m}`);

/**!
 * @param {Partial<MfldOps>} newops 
 * @param {string} [profileName] 
 */
export let _setOptions = (newops, profileName)=> {
    if(profileName) _ops.profiles = { ..._ops.profiles, [profileName]: newops };
    else _ops = { ..._ops, ...newops };
}

// Handle location state changes
_glob.addEventListener("popstate", (e)=> {
    // for(let update of e.state) {
    //     _scheduleUpdate(update);
    // }
});

//Register subscriptions on the DOM (scopable in case an update needs run on a subset of the DOM)
/**
 * @param {HTMLElement | null} [parent] 
 */
export let _register = (parent)=> {
    if(parent && parent.nodeType == Node.TEXT_NODE) return;

    /** @type {NodeListOf<HTMLElement> | []} */
    let els = (parent || document.body).querySelectorAll(
        `[data-${_modes.join(`],[data-`)}],a,form`
    ) || [];

    for(let el of els) {
        let _op_overrides = _getOpOverrides(_ops, el);

        //Check for <a> and <form> elements
        if(el.dataset?.[`${ATTR_PREFIX}promote`] !== undefined) {
            let [mode, href, input, trigger] = el.tagName == "A" ?
                ["get", /** @type {HTMLAnchorElement}*/(el).href, [], "click"] : 
                [/** @type {HTMLFormElement}*/(el).method.toLowerCase(), /** @type {HTMLFormElement}*/(el).action, "$form", "submit"];

            if(href) {
                _handleFetch(el, trigger, _op_overrides, href, mode, /** @type {any[] | "$form"}*/(input));
                continue;
            }
        }

        //Loop over all data attributes (modes)
        for(let mode in el.dataset) {
            if(!_modes.includes(mode)) continue;
            let shouldHaveTriggers = !mode.match(/bind|templ|if|each/);

            //Loop over provided settings
            for(let setting of el.dataset?.[mode]?.split(";;") || []) {
                //Break out settings
                let [sourceParts, output] = setting?.split("->")?.map(s=> s.trim()) || [];
                let triggers = shouldHaveTriggers ?sourceParts.slice(0, sourceParts.indexOf(")"))?.match(/[^\(\)]{1,}/g)?.pop()?.split(_commaSepRx)?.map(s=> s.trim()) || [] : [];
                if(!output && mode.match(/get|head|post|put|delete|patch/)) {
                    output = sourceParts.slice(sourceParts.indexOf(")") + 1);
                    sourceParts = "";
                }
                let processFuncStr = shouldHaveTriggers ? sourceParts?.slice(sourceParts.indexOf(")") + 1) : sourceParts;

                //Handle errors
                if(shouldHaveTriggers && !triggers?.length) { console.error("No trigger", el); break; }

                let { func, valueList, as } = _parseFunction(processFuncStr);
                if(processFuncStr && !func) console.warn(`"${processFuncStr}" not registered`, el);

                //Handle conditionals and loops
                if(mode.match(/if|each|templ/)) _handleTemplates(el, mode, as || [], func, valueList || [], _op_overrides);
                else {
                    //Loop over triggers
                    if(!triggers?.length) triggers = [""]
                    for(let trigger of triggers) {
                        if(mode.match(/bind|sync/)) _handleBindSync(el, valueList, output, trigger, mode, func);
                        else {
                            _handleFetch(el, trigger, _op_overrides, output, mode.replace(ATTR_PREFIX, ""), valueList, func);
                        }
                    }
                }
            }; //End loop settings
        }; //End loop dataset
    };  //End loop elements
}