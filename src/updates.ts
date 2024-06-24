import type { FetchInsertionMode, MfldOps } from "./common_types";
import { RegisteredElement } from "./registered_element";

type DomWorkOrder = {
    in: RegisteredElement;
    out: RegisteredElement;
    relation: FetchInsertionMode;
    ops: Partial<MfldOps>;
    done: (el: RegisteredElement) => void;
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

// let _addSpacer = (inEl: RegisteredElement, wrapper: HTMLElement | null, wrapperHeight: number, ops: Partial<MfldOps>)=> {
//     if(!(ops.trans?.smart ?? true)) return;
//     let { paddingTop, paddingBottom } = wrapper instanceof Element ? getComputedStyle(wrapper) : { paddingTop: 0, paddingBottom: 0 };
//     let spacer = document.createElement("div");
//     spacer.style.height = `calc(${Math.abs(wrapperHeight - (inEl?.clientHeight || 0))}px - ${paddingTop} - ${paddingBottom})`;
//     wrapper?.after(spacer);
// }

// let _adjustSizing = (inEl: HTMLElement | null, ops: Partial<MfldOps>)=> {
//     if(!ops.trans?.smart ?? true) return;
//     let dur = (typeof ops?.trans?.dur == "number" ? ops?.trans?.dur : ops?.trans?.dur?.[0] || 0)/2
//     _scheduleUpdate(()=> {
//         spacer?.remove();
//         inEl?.animate?.([
//             { height: spacerHeight },
//             { height: `${inEl.clientHeight || 0}px` }
//         ], dur);
//     });
// }

let _runUpdates = ()=> {
    cancelAnimationFrame = 0;
    
    for(let order of workArray) {
        if(typeof order == "function") {
            order();
            continue;
        }

        // let wrapperHeight = order.out ? order.out.clientHeight : 0;
        // let _getDimensionsAfterUpdate = order.relation == "inner";

        if(order.relation == "prepend") {
            order.in._transition("in", ()=> order.in && order.out?._position(order.in._el, "prepend", false));
            // _adjustSizing?.(order?.in, order.ops);
        }
        else {
            if(["inner", "outer"].includes(order.relation)) {
                let container = order.out?._position(order.out?._el, "after");
                if(order.relation == "inner") {
                    container.style.border = "none";
                    order?.out?._empty();
                }
                order.out._transition("out");
            }

            // _addSpacer?.(order.in, order.out, wrapperHeight, order.ops);
            order.in._transition("in", ()=> {
                if(order.relation == "outer") order.out?._replaceWith(order.in)
                else order.out?._position(order.in._el, "appendChild", false);
            });
        }

        order.done?.(order.in);
    }

    _nextTickQueue.forEach(fn => fn());
    _nextTickQueue = [];
    workArray = [];
}

// export let _applyTransition = (
//     el: RegisteredElement, 
//     dir: "in" | "out", 
//     ops: Partial<MfldOps>, 
//     fn?: Function, 
//     refElement?: RegisteredElement, 
//     _getDimensionsAfterUpdate = false, 
//     after?: Function
// )=> {
//     if(el?.nodeType == Node.TEXT_NODE) {
//         el.replaceWith(document?.createElement("div"));
//         el.textContent = el.textContent;
//     }

//     if(el) {
//         let dur = Array.isArray(ops.trans?.dur) ? ops.trans?.dur[dir == "in" ? 0 : 1] || ops.trans?.dur[0] : ops.trans?.dur || 0;
//         let transClass = ops?.trans?.class || `${ATTR_PREFIX}trans`;
//         el?.classList?.add(transClass);
//         ops.trans?.hooks?.[`${dir}-start`]?.(el);

//         if(dir == "out") {
//             refElement = refElement || el;
//             if(!refElement) return;
//             let dimensions = {} as { w: string, left: string, top: string };
//             if((ops.trans?.smart ?? true) && !_getDimensionsAfterUpdate) {
//                 dimensions = _getDimensions(refElement);
//             }

//             _scheduleUpdate(()=> {
//                 if((ops.trans?.smart ?? true) && _getDimensionsAfterUpdate && refElement) {
//                     dimensions = _getDimensions(refElement);
//                 }

//                 if(ops.trans?.smart ?? true) {
//                     el.style.position = "fixed";
//                     el.style.width = dimensions.w;
//                     el.style.left = dimensions.left;
//                     el.style.top = dimensions.top;
//                     el.style.margin = "0";
//                 }
//                 if(dur) el.style.transitionDuration = `${dur}ms`;

//                 el.classList?.add("out");
//             })
//         }
//         else {
//             el?.classList?.add("in");
//             if(dur) el.style.transitionDuration = `${dur}ms`;
//             fn?.();
//             setTimeout(()=> {
//                 _scheduleUpdate(()=> {
//                     setTimeout(()=> _scheduleUpdate(()=> el?.classList?.remove(dir)), 0);
//                 });
//             }, ops.trans?.swap || 0);
//         }
        
//         setTimeout(()=> {
//             _scheduleUpdate(()=> {
//                 if(dir == "out") el?.remove();
//                 el?.classList?.remove(transClass);
//                 ops.trans?.hooks?.[`${dir}-end`]?.(el);
//                 el.style.transitionDuration = "";
//                 if(dir == "in") after?.(el);
//             });
//         }, 
//         dur + (dir == "in" ? ops.trans?.swap || 0 : 0));
//     }
// }