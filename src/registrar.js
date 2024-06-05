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
                let fnText = setting?.match(/\([\w ,]{0,}\)\s{0,}=>\s{0,}[\w ,]{0,}/)?.[0] || "";
                if(fnText) setting = setting.replace(fnText, fnText.match(/\([\w ,]+\)/)?.[0] || "");
                let _parts = setting?.split(/(?:(?:\)|->) ?){1,}/g) || []; 
                console.log(_parts)
        
                //Extract settings
                let triggers = shouldHaveTriggers ? _paramsInParens(_parts.splice(0,1)[0]) : [];
                let processFuncName = fnText ? fnText : _parts[0]?.includes("(") ? _parts[0]?.match(/^[^\(]{1,}/)?.[0] || "" : "";
                let output = _paramsInParens(_parts.splice(mode == `${ATTR_PREFIX}sync` ? 1 : 0, 1)[0]);
                let input = _paramsInParens(_parts[0]);

                //Handle errors
                if(shouldHaveTriggers && !triggers?.length) {
                    console.error(`No trigger: ${err_detail}.`)
                    return;
                }

                /** @type {Function | undefined} */

                let processFunc = _parseFunction(processFuncName)?.func;
                if(processFuncName) {
                    // @ts-ignore
                    if(!processFunc) console.warn(`"${processFuncName}" not registered: ${err_detail}`);
                    if(((!shouldHaveTriggers && output.length > 1))) {
                        console.error(`Multiple sources: ${err_detail}`);
                        return;
                    }
                }

                //Map output names and paths
                let outputData = output.map((ext)=> {
                    let [ name, ...sourcePathArr ] = ext.split(/[\.\[\]\?]{1,}/g);
                    return {
                        name,
                        path: sourcePathArr.map(sp=> !isNaN(parseInt(sp)) 
                            ? parseInt(sp) 
                            : sp)
                            .filter(sp=> sp) /** @type {(string | number)[]} */
                    }
                });

                //Loop over triggers
                if(!triggers?.length) triggers = [""]
                for(let trigger of triggers) {
                    // HANDLE BIND AND SYNC
                    if(mode.match(/bind|sync/)) {
                        _handleBindSync(el, input, outputData, trigger, mode, processFunc, err_detail);
                    }
                    // HANDLE FETCH
                    else {
                        _handleFetch(el, trigger, _ops, mode.replace(ATTR_PREFIX, ""), input[0], output[0]);
                    }
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