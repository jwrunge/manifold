import { _store } from "./store";
import { _scheduleUpdate } from "./updates";
import { _getOpOverrides, ATTR_PREFIX } from "./util";

function _getStoresAndFunc(el, mode) {
    let condition = el?.dataset?.[mode];
    let storeName = condition;

    if(!condition && el?.dataset?.[`${ATTR_PREFIX}else`] !== undefined) {
        condition = "return true";
        storeName = `ELSE:${el?.dataset?.[mode] || ""}`;
    }

    if(!condition) return {};

    let [stores, func] = condition?.split("=>")?.map(s=> s.trim()) || ["", ""];
    if(!func) {
        func = stores.slice();
        stores = "";
    }

    // Set up function to evaluate store values
    let storeList = stores?.split(",")?.map(s=> s.replace(/[()]/g, "").trim());
    // @ts-ignore
    let execFunc = globalThis[func] || MfFn?.get(func) || new Function(...storeList, func);

    return { storeList, execFunc, storeName };
}

/**
 * Handle conditional and loop elements
 * @param {HTMLElement} el 
 * @param {string} mode 
 * @param {import("./index.module").MfldOps} _ops 
 */
export function _handleConditionals(el, mode, _ops) {
    if(mode == `${ATTR_PREFIX}if`) {
        let ops = _getOpOverrides(_ops, el);
        let rootElement = document.createElement("div");
        rootElement.classList.add("mfld-active-condition");
        el.before(rootElement);

        // Set up conditions
        let siblingPtr = el;
        let conditionChain = [];
        while(siblingPtr) {
            if(!siblingPtr) break;
            let { storeList, execFunc, storeName } = _getStoresAndFunc(siblingPtr, conditionChain.length ? `${ATTR_PREFIX}elseif`: mode);
            if(!storeList && !execFunc) break;

            // Make sure this is a template
            if(siblingPtr.tagName != "TEMPLATE") {
                let newEl = document.createElement("template");
                newEl.innerHTML = siblingPtr.innerHTML;                
                for(let attr of siblingPtr.attributes) {
                    newEl.setAttribute(attr.name, attr.value);
                }
                siblingPtr.replaceWith(newEl);
                siblingPtr = newEl;

                // If not, it's default content
                rootElement.innerHTML = siblingPtr.innerHTML;
            }

            // Register new store (to prevent excess evaluations)
            let upstreamConditionsLen = conditionChain.length;
            let conditionStore = _store(storeName || "", {
                upstream: [...storeList, ...conditionChain],
                updater: (list)=> {
                    if(upstreamConditionsLen) {
                        for(let condition of list.slice(-upstreamConditionsLen) || []) {
                            if(condition) return false;
                        }
                    }
                    return execFunc(...list.slice(0, -1));
                }
            });

            conditionChain.push(conditionStore.name);

            let siblingClone = /** @type {HTMLElement}*/(siblingPtr.cloneNode(true));
            conditionStore?.sub(val=> {
                if(!val) return;
                let sib = document.createElement("div");
                sib.innerHTML = siblingClone.innerHTML;
                if(siblingClone?.tagName == "TEMPLATE") {
                    _scheduleUpdate({
                        in: sib,
                        out: rootElement,
                        relation: "swapinner",
                        ops,
                        done: ((el) => true),
                    })
                }
            });

            siblingPtr = /** @type {HTMLElement} */(siblingPtr?.nextElementSibling);
        }
    }
    else {
        alert("Not set up for loops yet")
    }
}