/** @typedef {import("./index.js").MfldOps} MfldOps */

import { ATTR_PREFIX } from "./util.js";

/**
 * @typedef {Object} DomWorkOrder
 * @property {HTMLElement} in - The input HTMLElement
 * @property {HTMLElement} out - The output HTMLElement
 * @property {"append" | "prepend" | "swapinner" | "swapouter"} relation - The relation between the input and output elements
 * @property {Partial<MfldOps>} ops - The fetch options for the operation
 * @property {(el: HTMLElement | null) => void} done - The callback function to be executed when the operation is done
 */

/** @type {(DomWorkOrder | Function)[]} */ let workArray = [];
let cancelAnimationFrame = false;
/** @type {Map<string, (any | ((any)=> any))>} */

// Next tick queue
/**
 * @type {Function[]}
 */
let _nextTickQueue = [];

/** @type {HTMLElement | null} */
let spacer;
let spacerHeight = "";

export function _addToNextTickQueue(fn) {
    fn && _nextTickQueue.push(fn);
}

export function _scheduleUpdate(update) {
    workArray.push(update);
    if(!cancelAnimationFrame) {
        cancelAnimationFrame = requestAnimationFrame(_runUpdates);
    }
}

function _addSpacer(inEl, wrapper, wrapperHeight, replaceWholeObject = false, ops) {
    if(!(ops.trans?.smartTransition ?? true)) return;
    let { paddingTop, paddingBottom } = wrapper instanceof Element ? window.getComputedStyle(wrapper) : { paddingTop: 0, paddingBottom: 0 };
    let spacer = document.createElement("div");
    spacer.style.height = `calc(${Math.abs(wrapperHeight - (inEl?.clientHeight || 0))}px - ${paddingTop} - ${paddingBottom})`;
    wrapper?.after(spacer);
}

function _adjustSizing(inEl, ops) {
    if(!ops.trans?.smartTransition ?? true) return;
    let dur = (ops?.trans?.dur?.[0] || ops?.trans?.dur || 600)/2
    _scheduleUpdate(()=> {
        spacer?.remove();
        inEl?.animate?.([
            { height: spacerHeight },
            { height: `${inEl.clientHeight || 0}px` }
        ], dur);
    });
}

function _runUpdates() {
    cancelAnimationFrame = false;
    
    for(let order of workArray) {
        if(typeof order == "function") {
            order();
            continue;
        }

        let wrapperHeight = order.out ? order.out.clientHeight : 0;
        let _getDimensionsAfterUpdate = order.relation == "swapinner";

        if(order.relation == "prepend") {
            _addSpacer?.(order.in, order.out, wrapperHeight, false, order.ops);
            _applyTransition(order.in, "in", order.ops, ()=> {
                order.out?.prepend(order.in);
                _adjustSizing?.(order.in, order.ops);
            });
        }
        else {
            if(["swapinner", "swapouter"].includes(order.relation)) {
                let container = order.out?.cloneNode(true);
                if(container) {
                    order.out?.after(container);
                    if(_getDimensionsAfterUpdate) {
                        container.style.border = "none";
                        order.out.replaceChildren();
                    }
                    _applyTransition(container, "out", order.ops, undefined, order.out, _getDimensionsAfterUpdate);
                }
            }

            _addSpacer?.(order.in, order.out, wrapperHeight, false, order.ops);
            _applyTransition(order.in, "in", order.ops, ()=> {
                if(order.relation == "swapouter") order.out?.replaceWith(order.in)
                else order.out?.appendChild(order.in);
                _adjustSizing?.(order.in, order.ops);
            });
        }

        order.done?.(order.in);
    }

    _nextTickQueue.forEach(fn => fn());
    _nextTickQueue = [];
    workArray = [];
}

/**
 * @param {HTMLElement} el 
 * @param {"in" | "out"} dir 
 * @param {Partial<MfldOps>} ops 
 * @param {Function} [fn] 
 * @param {HTMLElement} [refElement]
 * @param {boolean} [_getDimensionsAfterUpdate]
 * @returns 
 */
export function _applyTransition(el, dir, ops, fn, refElement, _getDimensionsAfterUpdate = false) {
    if(el?.nodeType == Node.TEXT_NODE) {
        el = el.replaceWith(document?.createElement("div")).textContent = el.textContent;
    }

    if(el) {
        const dur = Array.isArray(ops.trans?.dur) ? ops.trans?.dur[dir == "in" ? 0 : 1] || ops.trans?.dur[0] : ops.trans?.dur || 0;
        const transClass = ops?.trans?.class || `${ATTR_PREFIX}trans`;
        el?.classList?.add(transClass);
        ops.trans?.hooks?.[`${dir}-start`]?.(el);

        if(dir == "out") {
            refElement = refElement || el;
            if(!refElement) return;
            let dimensions = {};
            if((ops.trans?.smartTransition ?? true) && !_getDimensionsAfterUpdate) {
                dimensions = _getDimensions(refElement);
            }

            _scheduleUpdate(()=> {
                if((ops.trans?.smartTransition ?? true) && _getDimensionsAfterUpdate && refElement) {
                    dimensions = _getDimensions(refElement);
                }

                if(ops.trans?.smartTransition ?? true) {
                    el.style.position = "fixed";
                    el.style.width = dimensions.w;
                    el.style.left = dimensions.left;
                    el.style.top = dimensions.top;
                    el.style.margin = "0";
                }
                if(dur) el.style.transitionDuration = `${dur}ms`;

                el.classList?.add("out");
            })
        }
        else {
            el?.classList?.add("in");
            if(dur) el.style.transitionDuration = `${dur}ms`;
            fn?.();
            setTimeout(()=> {
                _scheduleUpdate(()=> {
                    setTimeout(()=> _scheduleUpdate(()=> el?.classList?.remove(dir)), 0);
                });
            }, ops.trans?.swap || 0);
        }
        
        setTimeout(()=> {
            _scheduleUpdate(()=> {
                if(dir == "out") el?.remove();
                el?.classList?.remove(transClass);
                ops.trans?.hooks?.[`${dir}-end`]?.(el);
            });
        }, 
        dur + (dir == "in" ? ops.trans?.swap || 0 : 0));
    }
}

function _getDimensions(refElement) {
    let style = getComputedStyle(refElement);
    return {
        w: `calc(${(refElement).clientWidth}px - ${style.paddingLeft} - ${style.paddingRight})`,
        left: `calc(${refElement.getBoundingClientRect().left}px + ${window.scrollX}px)`,
        top: `calc(${refElement.getBoundingClientRect().top}px + ${window.scrollY}px)`
    };
}