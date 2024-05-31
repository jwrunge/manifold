import { _store, _workOrder } from "./store.js";
/** @typedef {import("./index.module.js").MfldOps} MfldOps */

/** @type {{ adjust?: Function, space?: Function, size?: Function } | undefined} */
let smartOutro = globalThis.smartOutro;

/**
 * @typedef {Object} DomWorkOrder
 * @property {HTMLElement} in - The input HTMLElement
 * @property {HTMLElement} out - The output HTMLElement
 * @property {string} relation - The relation between the input and output elements
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

function _runUpdates() {
    cancelAnimationFrame = false;

    // Update stores and cascade downstream
    for(let [storeName, newValue] of _workOrder) {
        let S = _store(storeName);
        for(let [ref, sub] of S?._subscriptions || []) sub?.(S.value, ref);

        // @ts-ignore
        for(let [downstreamName, downstream] of MfSt) {

        }

        // Cascade downstream
        // await this.update(
        //     await (this._updater?.(
        //         Array.from(this._upstreamStores)?.map(store => _store(store)?.value) || [], 
        //         /** @type {T} */(this?.value)
        //     ) || this.value),
        // )
    }

    // Clear work order
    _workOrder.clear();
    
    /**
    * @type {DomWorkOrder[]}
    */
    for(let order of workArray) {
        if(typeof order === "function") (/** @type {Function} */ order)();
        else {
            // Remove old children
            if([">", "+"].includes(order.relation)) {
                if(order.relation == ">") {
                    //Remove old children before appending
                    let container = document?.createElement("div");
                    for(let child of Array.from(order.out?.childNodes || [])) {
                        container.appendChild(child);
                    }
                    order.out?.replaceChildren(container);
                    _applyTransition(container, "out", order.ops);
                }

                smartOutro?.space?.(order.in, order.out);

                //Append
                _applyTransition(order.in, "in", order.ops, ()=> {
                    if(order.in) order.out?.appendChild(order.in);
                    smartOutro?.adjust?.(order.in, order.ops);
                });
            }
            //Insert after old element before removing
            else _applyTransition(order.in, "in", order.ops, ()=> {
                order.out?.after(order.in);
                smartOutro?.space?.(order.in, order.out);
                smartOutro?.adjust?.(order.in, order.ops);

                //Remove old element
                if(order.relation === "/") _applyTransition(order.out, "out", order.ops);
            });

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
                smartOutro?.size?.(el);
                if(dur) el.style.transitionDuration = `${dur}ms`;
                el.classList?.add(dir);
            })
        }
        //If dir == in
        else {
            setTimeout(()=> {
                _scheduleUpdate(()=> {
                    if(dur) el.style.transitionDuration = `${dur}ms`;
                    el?.classList?.add(dir);
                    fn?.();

                    //Remove transition class
                    _scheduleUpdate(()=> {
                        el?.classList?.remove(dir);
                    });
                });
            }, ops.trans?.swap || 0);
        }
        
        setTimeout(()=> {
            _scheduleUpdate(()=> {
                //Wrapup
                if(dir == "out") el?.remove();
                el?.classList?.remove(transClass);
                el?.classList?.remove(dir);
                ops.trans?.hooks?.[`${dir}-end`]?.(el);
            });
        }, 
        dur + (dir == "in" ? ops.trans?.swap || 0 : 0));
    }
}