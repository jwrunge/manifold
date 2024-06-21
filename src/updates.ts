import type { MfldOps } from "./common_types";
import { ATTR_PREFIX } from "./util";

type DomWorkOrder = {
    in: HTMLElement | null;
    out: HTMLElement | null;
    relation: "append" | "prepend" | "inner" | "outer";
    ops: Partial<MfldOps>;
    done: (el: HTMLElement | null) => void;
}

let workArray: (DomWorkOrder | Function)[] = [];
let cancelAnimationFrame = 0;
let _nextTickQueue: Function[] = [];
let spacer: HTMLElement | null;
let spacerHeight = "";

export let _addToNextTickQueue = (fn: Function)=> {
    fn && _nextTickQueue.push(fn);
}

export let _scheduleUpdate = (update: DomWorkOrder | Function)=> {
    workArray.push(update);
    if(!cancelAnimationFrame) {
        cancelAnimationFrame = requestAnimationFrame(_runUpdates);
    }
}

let _addSpacer = (inEl: HTMLElement | null, wrapper: HTMLElement | null, wrapperHeight: number, ops: Partial<MfldOps>)=> {
    if(!(ops.trans?.smart ?? true)) return;
    let { paddingTop, paddingBottom } = wrapper instanceof Element ? getComputedStyle(wrapper) : { paddingTop: 0, paddingBottom: 0 };
    let spacer = document.createElement("div");
    spacer.style.height = `calc(${Math.abs(wrapperHeight - (inEl?.clientHeight || 0))}px - ${paddingTop} - ${paddingBottom})`;
    wrapper?.after(spacer);
}

let _adjustSizing = (inEl: HTMLElement | null, ops: Partial<MfldOps>)=> {
    if(!ops.trans?.smart ?? true) return;
    let dur = (typeof ops?.trans?.dur == "number" ? ops?.trans?.dur : ops?.trans?.dur?.[0] || 0)/2
    _scheduleUpdate(()=> {
        spacer?.remove();
        inEl?.animate?.([
            { height: spacerHeight },
            { height: `${inEl.clientHeight || 0}px` }
        ], dur);
    });
}

let _runUpdates = ()=> {
    cancelAnimationFrame = 0;
    
    for(let order of workArray) {
        if(typeof order == "function") {
            order();
            continue;
        }

        let wrapperHeight = order.out ? order.out.clientHeight : 0;
        let _getDimensionsAfterUpdate = order.relation == "inner";

        if(order.relation == "prepend") {
            _addSpacer?.(order?.in, order?.out, wrapperHeight, order.ops);
            _applyTransition(order.in, "in", order.ops, ()=> {
                if(order?.in) order.out?.prepend(order.in);
                _adjustSizing?.(order?.in, order.ops);
            });
        }
        else {
            if(["inner", "outer"].includes(order.relation)) {
                let container = order.out?.cloneNode(true) as HTMLElement | null;
                if(container) {
                    order.out?.after(container);
                    if(_getDimensionsAfterUpdate) {
                        container.style.border = "none";
                        order?.out?.replaceChildren();
                    }
                    _applyTransition(container, "out", order.ops, undefined, order?.out, _getDimensionsAfterUpdate);
                }
            }

            _addSpacer?.(order.in, order.out, wrapperHeight, order.ops);
            _applyTransition(order.in, "in", order.ops, ()=> {
                if(order.in) {
                    if(order.relation == "outer") order.out?.replaceWith(order.in)
                    else order.out?.appendChild(order.in);
                }
                _adjustSizing?.(order.in, order.ops);
            });
        }

        order.done?.(order.in);
    }

    _nextTickQueue.forEach(fn => fn());
    _nextTickQueue = [];
    workArray = [];
}

export let _applyTransition = (
    el: HTMLElement | null, 
    dir: "in" | "out", 
    ops: Partial<MfldOps>, 
    fn?: Function, 
    refElement?: HTMLElement | null, 
    _getDimensionsAfterUpdate = false, 
    after?: Function
)=> {
    if(el?.nodeType == Node.TEXT_NODE) {
        el.replaceWith(document?.createElement("div"));
        el.textContent = el.textContent;
    }

    if(el) {
        const dur = Array.isArray(ops.trans?.dur) ? ops.trans?.dur[dir == "in" ? 0 : 1] || ops.trans?.dur[0] : ops.trans?.dur || 0;
        const transClass = ops?.trans?.class || `${ATTR_PREFIX}trans`;
        el?.classList?.add(transClass);
        ops.trans?.hooks?.[`${dir}-start`]?.(el);

        if(dir == "out") {
            refElement = refElement || el;
            if(!refElement) return;
            let dimensions = {} as { w: string, left: string, top: string };
            if((ops.trans?.smart ?? true) && !_getDimensionsAfterUpdate) {
                dimensions = _getDimensions(refElement);
            }

            _scheduleUpdate(()=> {
                if((ops.trans?.smart ?? true) && _getDimensionsAfterUpdate && refElement) {
                    dimensions = _getDimensions(refElement);
                }

                if(ops.trans?.smart ?? true) {
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
                el.style.transitionDuration = "";
                if(dir == "in") after?.(el);
            });
        }, 
        dur + (dir == "in" ? ops.trans?.swap || 0 : 0));
    }
}

let _getDimensions = (refElement: HTMLElement)=> {
    let style = getComputedStyle(refElement);
    let rect = refElement.getBoundingClientRect();
    return {
        w: `calc(${(refElement).clientWidth}px - ${style.paddingLeft} - ${style.paddingRight})`,
        left: `calc(${rect.left}px + ${window.scrollX}px)`,
        top: `calc(${rect.top}px + ${window.scrollY}px)`
    };
}