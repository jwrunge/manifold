import { _store } from "./store.js";
import { _scheduleUpdate } from "./updates.js";
import { _parseFunction, ATTR_PREFIX } from "./util.js";
import { _handleFetch } from "./fetch.js";
import { _handleBindSync } from "./bindsync.js";
import { _handleConditionals } from "./conditionals.js";
/** @typedef {import("./index.module.js").MfldOps} MfldOps */

/** @type {Partial<MfldOps>} */
let _ops = {};
let _commaSepRx = /, {0,}/g;
let _elIdx = 0;
let _modes = ["bind", "sync", "if", "get", "head", "post", "put", "delete", "patch"].map(m=> `${ATTR_PREFIX}${m}`);
let pageScripts = new WeakMap();
let pageStyles = new WeakMap();

// globalThis.addEventListener("popstate", (e)=> {
//     let el = document?.getElementById(e.state?.elId);
//     if(e?.state?.fetchData) {
//         _fetchHttp(
//             "get", 
//             "",
//             e.state.fetchData,
//             el,
//             el=> {if(el) _registerSubs(el)}
//         );
//     }
// });

/**!
 * @param {Partial<MfldOps>} newops 
 * @param {string} [profileName] 
 */
export function _setOptions(newops, profileName) {
    if(profileName) _ops.profiles = { ..._ops.profiles, [profileName]: newops };
    else _ops = { ..._ops, ...newops };
}

//Register subscriptions on the DOM (scopable in case an update needs run on a subset of the DOM)
/**
 * @param {HTMLElement | null} [parent] 
 */
export function _registerSubs(parent) {
    /** @type {NodeListOf<HTMLElement> | []} */
    let els = (parent || document.body).querySelectorAll(
        `[data-${_modes.join(`],[data-`)}]${_ops.fetch?.auto != false ? ",a" : ""}`
    ) || [];

    for(let el of els) {
        /** @type {HTMLElement} */
        if(!el.id) el.id = `${_elIdx++}`;

        //Loop over all data attributes (modes)
        for(let mode in el.dataset) {
            /**
             * HANDLE CONDITIONALS AND LOOPS
             */
            if([`${ATTR_PREFIX}if`, `${ATTR_PREFIX}each`].includes(mode)) {
                _handleConditionals(el, mode, _ops);
                continue;
            }

            if(!_modes.includes(mode)) continue;
            let shouldHaveTriggers = ![`${ATTR_PREFIX}bind`].includes(mode);
            let err_detail = `(#${el.id} on ${mode})`;

            //Loop over provided settings
            el.dataset?.[mode]?.split(";").forEach(setting=> {
                //Break out settings
                let [sourceParts, output] = setting?.split("->")?.map(s=> s.trim()) || [];
                let triggers = shouldHaveTriggers ? _paramsInParens(sourceParts.slice(0, sourceParts.indexOf(")"))) : [];
                let funcAndInput = shouldHaveTriggers ? sourceParts.slice(sourceParts.indexOf(")") + 1) : sourceParts;
                let processFuncName = funcAndInput.includes("=>") ? funcAndInput : funcAndInput.includes("(") ? funcAndInput.match(/^[^\(]{1,}/)?.[0] || "" : "";
                let input = processFuncName ? _paramsInParens(funcAndInput.slice(0, (funcAndInput.indexOf(")") || -2) + 1)) : funcAndInput.split(_commaSepRx)?.map(s=> s.trim());

                //Handle errors
                if(shouldHaveTriggers && !triggers?.length) return console.error(`No trigger: ${err_detail}.`);

                /** @type {Function | undefined} */
                let processFunc = _parseFunction(processFuncName)?.func;
                if(processFuncName) {
                    if(!processFunc) console.warn(`"${processFuncName}" not registered: ${err_detail}`);
                }
                else if(input.length > 1) console.warn(`Multiple inputs without function: ${err_detail}`);

                //Loop over triggers
                if(!triggers?.length) triggers = [""]
                for(let trigger of triggers) {
                    if(mode.match(/bind|sync/)) _handleBindSync(el, input, output, trigger, mode, processFunc);
                    else _handleFetch(el, trigger, _ops, input[0], mode.replace(ATTR_PREFIX, ""), output);
                }
            }); //End loop settings
        }   //End loop dataset modes
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