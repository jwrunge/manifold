/** @typedef {import("./index.module.js").MfldOps} MfldOps */

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

// Polyfill requestAnimationFrame
let tick = globalThis?.requestAnimationFrame || ((fn)=> setTimeout(fn, 0));

export function _addToNextTickQueue(fn) {
    if(fn) _nextTickQueue.push(fn);
}

/** @export @param {(DomWorkOrder | Function)} update */
export function _scheduleUpdate(update) {
    workArray.push(update);
    if(!cancelAnimationFrame) {
        cancelAnimationFrame = true;
        tick(_runUpdates);
    }
}

function _addSpacer(inEl, wrapper, wrapperHeight, replaceWholeObject = false, ops) {
    if(!ops.trans?.smartTransition ?? true) return;
    //Conserve parent size
    spacer = document.createElement("div");
    
    let { paddingTop, paddingBottom } = wrapper instanceof Element ? window.getComputedStyle(wrapper) : { paddingTop: 0, paddingBottom: 0 };
    spacerHeight = spacer.style.height = `calc(${(Math.abs(wrapperHeight - (inEl?.clientHeight || 0)))}px - ${paddingTop} - ${paddingBottom})`;

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
    
    /**
    * @type {DomWorkOrder[]}
    */
    for(let order of workArray) {
        if(typeof order == "function") (/** @type {Function} */ order)();
        else {
            let wrapperHeight = order.out ? order.out.clientHeight : 0;

            // Prepend
            if(order.relation == "prepend") {
                _addSpacer?.(order.in, order.out, wrapperHeight, false, order.ops);

                //Prepend
                _applyTransition(order.in, "in", order.ops, ()=> {
                    if(order.in) order.out?.prepend(order.in);
                    _adjustSizing?.(order.in, order.ops);
                });
            }
            // Remove old children
            else {
                if(["swapinner", "swapouter"].includes(order.relation)) {
                    //Remove old children before appending (if swapping children)
                    let container = /** @type {HTMLElement}*/(order.out?.cloneNode(true));

                    order.out?.after(container);
                    let getDimensionsAfterUpdate = order.relation == "swapinner" ? true : false;

                    if(order.relation == "swapinner") {
                        container.style.border = "none";
                        order.out.replaceChildren();
                    }

                    // Transition old children out
                    _applyTransition(container, "out", order.ops, undefined, order.out, getDimensionsAfterUpdate);
                }

                _addSpacer?.(order.in, order.out, wrapperHeight, false, order.ops);

                // Transition incoming element and append
                _applyTransition(order.in, "in", order.ops, ()=> {
                    if(order.in) {
                        if(order.relation == "swapouter") order.out?.replaceWith(order.in)
                        else order.out?.appendChild(order.in);
                    }
                    _adjustSizing?.(order.in, order.ops);
                });
            }

            order.done?.(order.in);
        }
    }

    //Handle queued nextTick functions
    _nextTickQueue.forEach(fn=> fn());
    _nextTickQueue = [];
    workArray = [];
}

/**
 * @param {HTMLElement} el 
 * @param {"in" | "out"} dir 
 * @param {Partial<MfldOps>} ops 
 * @param {Function} [fn] 
 * @param {HTMLElement} [refElement]
 * @param {boolean} [getDimensionsAfterUpdate]
 * @returns 
 */
function _applyTransition(el, dir, ops, fn, refElement, getDimensionsAfterUpdate = false) {
    //Handle text nodes
    if(el?.nodeType == Node.TEXT_NODE) {
        let text = el.textContent;
        let newNode = document?.createElement("div");
        newNode.textContent = text;
        el.replaceWith(newNode);
        el = newNode;
    }

    if(el) {
        let dur = Array.isArray(ops.trans?.dur) ? ops.trans?.dur[dir == "in" ? 0 : 1] || ops.trans?.dur[0] : ops.trans?.dur || 0;

        //Initiate transition
        let transClass = ops?.trans?.class || "mf-trans";
        el?.classList?.add(transClass);
        ops.trans?.hooks?.[`${dir}-start`]?.(el);

        //Wait to apply class
        if(dir == "out") {
            // Set dimensions
            if(!refElement) refElement = el;
            if(!refElement) return;
            let dimensions = {};
            if((ops.trans?.smartTransition ?? true) && getDimensionsAfterUpdate == false) {
                let style = getComputedStyle(refElement);
                dimensions.w = `calc(${(refElement).clientWidth}px - ${style.paddingLeft} - ${style.paddingRight})`;
                dimensions.left = `calc(${refElement.getBoundingClientRect().left}px + ${window.scrollX}px)`;
                dimensions.top = `calc(${refElement.getBoundingClientRect().top}px + ${window.scrollY}px)`;
            }

            _scheduleUpdate(()=> {
                if(ops.trans?.smartTransition ?? true) {
                    if(getDimensionsAfterUpdate && refElement) {
                        let style = getComputedStyle(refElement);
                        dimensions.w = `calc(${(refElement).clientWidth}px - ${style.paddingLeft} - ${style.paddingRight})`;
                        dimensions.left = `calc(${refElement.getBoundingClientRect().left}px + ${window.scrollX}px)`;
                        dimensions.top = `calc(${refElement.getBoundingClientRect().top}px + ${window.scrollY}px)`;
                    }
                    
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
        //If dir == in
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
                //Wrapup
                if(dir == "out") el?.remove();
                el?.classList?.remove(transClass);
                ops.trans?.hooks?.[`${dir}-end`]?.(el);
            });
        }, 
        dur + (dir == "in" ? ops.trans?.swap || 0 : 0));
    }
}