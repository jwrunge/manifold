import { _store } from "./store.js";
import { _scheduleUpdate } from "./updates.js";
import { _commaSepRx, _getOpOverrides, _parseFunction, ATTR_PREFIX } from "./util.js";
import { _handleFetch } from "./fetch.js";
import { _handleBindSync } from "./bindsync.js";
import { _handleConditionals } from "./conditionals.js";
/** @typedef {import("./index.module.js").MfldOps} MfldOps */

/** @type {Partial<MfldOps>} */
let _ops = {};
let _modes = ["bind", "sync", "templ", "if", "each", "get", "head", "post", "put", "delete", "patch"].map(m=> `${ATTR_PREFIX}${m}`);

/**!
 * @param {Partial<MfldOps>} newops 
 * @param {string} [profileName] 
 */
export function _setOptions(newops, profileName) {
    if(profileName) _ops.profiles = { ..._ops.profiles, [profileName]: newops };
    else _ops = { ..._ops, ...newops };
}

// Handle location state changes
globalThis.addEventListener("popstate", (e)=> {
    // for(let update of e.state) {
    //     _scheduleUpdate(update);
    // }
});

//Register subscriptions on the DOM (scopable in case an update needs run on a subset of the DOM)
/**
 * @param {HTMLElement | null} [parent] 
 */
export function _registerSubs(parent) {
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
                ["get", /** @type {HTMLAnchorElement}*/(el).href, "", "click"] : 
                [/** @type {HTMLFormElement}*/(el).method.toLowerCase(), /** @type {HTMLFormElement}*/(el).action, "$form", "submit"];

            if(href) {
                _handleFetch(el, trigger, _op_overrides, href, mode, input);
                continue;
            }
        }

        //Loop over all data attributes (modes)
        for(let mode in el.dataset) {
            //HANDLE CONDITIONALS AND LOOPS
            // if([`${ATTR_PREFIX}templ`, `${ATTR_PREFIX}if`, `${ATTR_PREFIX}each`].includes(mode)) {
            //     _handleConditionals(el, mode, _op_overrides);
            //     continue;
            // }

            if(!_modes.includes(mode)) continue;
            let shouldHaveTriggers = ![`${ATTR_PREFIX}bind`].includes(mode);

            //Loop over provided settings
            let setting = el.dataset?.[mode];
            //Break out settings
            let [sourceParts, output] = setting?.split("->")?.map(s=> s.trim()) || [];
            let triggers = shouldHaveTriggers ? _paramsInParens(sourceParts.slice(0, sourceParts.indexOf(")"))) : [];
            let processFuncStr = shouldHaveTriggers ? sourceParts.slice(sourceParts.indexOf(")") + 1) : sourceParts;

            //Handle errors
            if(shouldHaveTriggers && !triggers?.length) { console.error("No trigger", el); break; }

            let { func, valueList, as } = _parseFunction(processFuncStr);
            if(processFuncStr && !func) console.warn(`"${processFuncStr}" not registered`, el);

            //Loop over triggers
            if(!triggers?.length) triggers = [""]
            for(let trigger of triggers) {
                if(mode.match(/bind|sync/)) _handleBindSync(el, valueList, output, trigger, mode, func);
                // else {
                //     if(!output) {
                //         output = input[0];
                //         input = [];
                //     }
                //     _handleFetch(el, trigger, _op_overrides, output, mode.replace(ATTR_PREFIX, ""), input, processFunc);
                // }
            }
        }; //End loop settings
    };  //End loop elements
}

/**
 * @param {string} str 
 * @returns 
 */
function _paramsInParens(str) {
    if(str?.includes("(")) {
        let matches = str.match(/[^\(\)]{1,}/g);
        str = matches?.[matches.length - 1] || "";
    }
    return str?.split(_commaSepRx)?.map(s=> s.trim()) || [];
}