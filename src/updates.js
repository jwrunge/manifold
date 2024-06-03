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

/** @type {Map<import("./index.module.js").Store<any>, (any | ((any)=> any))>} */ export let _workOrder = new Map();

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

function _addSpacer(inEl, wrapper, wrapperHeight) {
    //Conserve parent size
    spacer = document.createElement("div");
    let { paddingTop, paddingBottom } = window.getComputedStyle(wrapper);

    spacerHeight = spacer.style.height = `calc(${(Math.abs(wrapperHeight - (inEl?.clientHeight || 0)))}px - ${paddingTop} - ${paddingBottom})`;
    wrapper?.after(spacer);
}

function _adjustSizing(inEl, wrapper) {
    _scheduleUpdate(()=> {
        spacer?.remove();
        inEl?.animate?.([
            { height: spacerHeight },
            { height: `${inEl.clientHeight || 0}px` }
        ], 300);
    });
}

function _runUpdates() {
    cancelAnimationFrame = false;

    // Update stores and cascade downstream
    for(let [S] of _workOrder) {
        // @ts-ignore
        for(let [ref, sub] of S?._subscriptions || []) sub?.(S.value, ref);
    }

    // Clear work order and update derived stores
    _workOrder.clear();
    
    /**
    * @type {DomWorkOrder[]}
    */
    for(let order of workArray) {
        if(typeof order == "function") (/** @type {Function} */ order)();
        else {
            let wrapperHeight = order.out ? order.out.clientHeight : 0;

            // Remove old children
            if(["swapinner", "append"].includes(order.relation)) {
                if(order.relation == "swapinner") {
                    //Remove old children before appending (if swapping children)
                    let container = document?.createElement("div");
                    for(let child of Array.from(order.out?.childNodes || [])) {
                        container.appendChild(child);
                    }
                    order.out?.replaceChildren(container);

                    // Transition old children out
                    _applyTransition(container, "out", order.ops);
                }

                _addSpacer?.(order.in, order.out, wrapperHeight);

                // Transition incoming element and append
                _applyTransition(order.in, "in", order.ops, ()=> {
                    if(order.in) order.out?.appendChild(order.in);
                    _adjustSizing?.(order.in, order.out);
                });
            }
            //Prepend
            else if(order.relation == "prepend") {
                _addSpacer?.(order.in, order.out, wrapperHeight);

                //Prepend
                _applyTransition(order.in, "in", order.ops, ()=> {
                    if(order.in) order.out?.prepend(order.in);
                    _adjustSizing?.(order.in, order.out);
                });
            }
            //Insert after old element before removing
            else {
                _applyTransition(order.in, "in", order.ops, ()=> {
                    order.out?.after(order.in);
                    _addSpacer?.(order.in, order.out, wrapperHeight);
                    _adjustSizing?.(order.in, order.out);
                });
                _applyTransition(order.out, "out", order.ops);
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
 * @returns 
 */
function _applyTransition(el, dir, ops, fn) {
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
            _scheduleUpdate(()=> {
                if(true) {
                    el.style.width = `${(el).clientWidth}px`;
                    el.style.height = `${(el).clientHeight}px`;
                    el.style.position = "absolute";
                }

                // smartOutro?.size?.(el);
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