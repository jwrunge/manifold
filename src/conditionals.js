import { _ensureNodeName, _iterable, _iterateSiblings, _registerInternalStore } from "./domutil";
import { _registerSubs } from "./registrar";
import { _store } from "./store";
import { _applyTransition, _scheduleUpdate } from "./updates";
import { _getStorePathFromKey, _parseFunction, ATTR_PREFIX } from "./util";

/**
 * Handle conditional and loop elements
 * @param {HTMLElement} el 
 * @param {string} mode 
 * @param {import("./index.module").MfldOps} ops 
 */
export function _handleConditionals(el, mode, ops) {
    let startElement = document.createElement("template");
    let endElement = document.createElement("template");
    startElement.classList.add("mfld-start");
    endElement.classList.add("mfld-end");
    el.before(startElement);

    if(mode == `${ATTR_PREFIX}templ`) {
        let templ = /** @type {HTMLTemplateElement}*/(_ensureNodeName(/** @type {HTMLElement}*/(el.cloneNode(true)), "TEMPLATE"));
        el.after(templ);
        templ.dataset.nodeName = el.nodeName;

        let [ funcStr, aliases ] = templ.dataset[`${ATTR_PREFIX}templ`]?.split(/\sas\s/)?.map(s=> s.trim()) || [];
        let [ valueName ] = aliases.split(/\s{0,},\s{0,}/)?.map(s=> s.trim()) || ["value", "key"];
        let { storeList, func } = _parseFunction(funcStr);

        let templStore = _registerInternalStore(`TEMPL:${templ.dataset[`${ATTR_PREFIX}templ`]}`, storeList, {
            func,
            observeEl: templ
        });

        templStore?.sub(val=> {
            console.log("SUB VAL", val)
            let out = /** @type {HTMLElement}*/(startElement.nextElementSibling);
            let newEl = /** @type {HTMLElement}*/(_ensureNodeName(/** @type {HTMLElement}*/(templ.cloneNode(true)), templ.dataset.nodeName, [`data-${ATTR_PREFIX}templ`, "data-node-name"]));
            let html = newEl?.outerHTML || newEl?.textContent?.replace(/^\n{0,}|\n{0,}$/, "");

            // Get all logical bindings and replace values
            if(html) {
                let replacements = html.match(/\${[^}]*}/g) || [];
                for(let rep of replacements) {
                    let repClean = rep.replace(/^\$\{|\}$/g, "");

                    try {
                        let fn = _parseFunction(`(${valueName})=> ${repClean}`)?.func;
                        html = html.replace(rep, fn?.(val) || "");
                    }
                    catch(e) {
                        console.error("Syntax error in templ", e);
                    }
                }
                console.log("REPLACED", html)
            }
            else html = val;

            newEl.innerHTML = html || val;

            _scheduleUpdate({
                in: newEl,
                out,
                relation: "swapouter",
                ops,
                done: (el)=> _registerSubs(el)
            });
        });
    }

    if(mode == `${ATTR_PREFIX}if`) {
        // Set up conditions
        let conditionChain = [];
        let upstreamConditionsLen = conditionChain.length;

        // Iterate siblings to add implicit else
        let breakSibling = _iterateSiblings(
            startElement?.nextElementSibling,
            (sib)=> sib?.dataset[`${ATTR_PREFIX}if`] == undefined && sib?.dataset[`${ATTR_PREFIX}elseif`] == undefined && sib?.dataset[`${ATTR_PREFIX}else`] == undefined,
        );

        // if(/** @type {HTMLElement | null}*/(breakSibling?.previousElementSibling)?.dataset[`${ATTR_PREFIX}else`] == undefined) {
        //     // Register implicit else
        //     let implElse = document.createElement("template");
        //     implElse.dataset[`${ATTR_PREFIX}else`] = "()=> true";
        //     implElse.innerHTML = "<div>VISIBLE IF NO CONDITIONS</div>"
        //     sib.after(implElse);
        // }
        
        // Iterate siblings to get condition branches
        _iterateSiblings(
            startElement?.nextElementSibling,
            (sib)=> {
                let end = 0;
                for(let i of ["if", "elseif", "else"]) if(sib?.dataset[`${ATTR_PREFIX}${i}`] == undefined) end++;
                if(end < 3) return false;
                sib?.before(endElement);
                return true;
            },
            (sib)=> {
                let { storeList, func, storeName } = _parseFunction({
                    el: sib, 
                    datakey: conditionChain.length ? sib.dataset?.[`${ATTR_PREFIX}elseif`] ? `${ATTR_PREFIX}elseif` : `${ATTR_PREFIX}else` : mode
                });
                if(!storeList && !func) {
                    console.error("Early condition abort on", storeName, sib);
                    return;
                }
    
                // Ensure template
                sib = _ensureNodeName(sib, "TEMPLATE");
    
                // Register condition store
                let conditionStore = _registerInternalStore(storeName, storeList, {conditionChain, upstreamConditionsLen, func, observeEl: sib});
                conditionChain.push(conditionStore.name);
    
                // Subscribe
                conditionStore?.sub(val=> {
                    if(!val) {
                        return;
                    }
    
                    _scheduleUpdate(()=> {
                        _iterateSiblings(
                            startElement?.nextElementSibling, 
                            (sib)=> sib?.classList?.contains("mfld-end"),
                            (sib)=> { 
                                if(sib?.nodeName != "TEMPLATE") _applyTransition(/** @type {HTMLElement}*/(sib), "out", ops, ()=> sib?.remove()); 
                            }
                        );
                    });
    
                    // Replace values
                    _scheduleUpdate(()=> {
                        let sibClone = sib.cloneNode(true);
                        for(let element of /** @type {HTMLTemplateElement}*/(sibClone).content.children) {
                            endElement.before(element);
                            _applyTransition(/** @type {HTMLElement}*/(element), "in", ops, ()=> _registerSubs(/** @type {HTMLElement}*/(element)));
                        }
                    });
                });  
                
                return sib;
            },
        );
    }

    if(mode == `${ATTR_PREFIX}each`) {
        el.before(endElement);

        let [ funcStr, aliases ] = el.dataset[`${ATTR_PREFIX}each`]?.split("as")?.map(s=> s.trim()) || [];
        let [ valueName, keyName ] = aliases.split(/\s{0,},\s{0,}/)?.map(s=> s.trim()) || ["value", "key"];
        let { storeList, func, storeName } = _parseFunction(funcStr);  
        
        // Ensure template
        el = _ensureNodeName(el, "TEMPLATE");

        // Register condition store
        let conditionStore = _registerInternalStore(`LOOP:${storeName}`, storeList, {func, observeEl: el});
        conditionStore?.sub(val=> {
            _scheduleUpdate(()=> {
                _iterateSiblings(
                    startElement?.nextElementSibling, 
                    (sib)=> sib?.classList?.contains("mfld-end"),
                    (sib)=> _applyTransition(/** @type {HTMLElement}*/(sib), "out", ops, ()=> sib?.remove()), 
                );
            });
            _scheduleUpdate(()=> {
                _iterable(val || [], (key, value)=> {
                    let html = el.innerHTML;

                    // Get all logical bindings and replace values
                    let replacements = el.innerHTML.match(/\${[^}]*}/g) || [];
                    for(let rep of replacements) {
                        let repClean = rep.replace(/^\$\{|\}$/g, "");

                        try {
                            let fn = _parseFunction(`(${keyName}, ${valueName})=> ${repClean}`)?.func;
                            html = html.replace(rep, fn?.(value, key) || "");
                        }
                        catch(e) {
                            console.error("Syntax error in loop function", e);
                        }
                    }

                    let item = /** @type {HTMLTemplateElement}*/(el.cloneNode(true));
                    item.innerHTML = html;

                    // Replace values
                    for(let element of item.content.children) {
                        endElement.before(element);
                        _applyTransition(/** @type {HTMLElement}*/(element), "in", ops, ()=> _registerSubs(/** @type {HTMLElement}*/(element)));
                    }
                });
            });
        })
    }
}