import { FetchOptions } from "./domRegistrar";
import { Store } from "./store";

type DomWorkOrder = {
    in: HTMLElement | null,
    out: HTMLElement | null,
    relation: string,
    ops: Partial<FetchOptions>,
    done: (el: HTMLElement | null)=> void
};

let workArray: (DomWorkOrder | Function)[] = [];
let cancelAnimationFrame = false;
let spacer: HTMLElement | null;
let spacerHeight = "";

export function scheduleDomUpdate(update: DomWorkOrder | Function) {
    workArray.push(update);
    if(!cancelAnimationFrame) {
        cancelAnimationFrame = true;
        requestAnimationFrame(runDomUpdates);
    }
}

function addSpacer(inEl: HTMLElement | null, wrapper: HTMLElement | null, wrapperHeight: number) {
    //Conserve parent size
    spacer = document.createElement("div");
    let { paddingTop, paddingBottom } = window.getComputedStyle(wrapper as HTMLElement);

    spacerHeight = spacer.style.height = `calc(${(Math.abs(wrapperHeight - (inEl?.clientHeight || 0)))}px - ${paddingTop} - ${paddingBottom})`;
    wrapper?.after(spacer);
}

function handleHeightAdjust(inEl: HTMLElement | null, wrapper: HTMLElement | null, ops: Partial<FetchOptions>) {
    scheduleDomUpdate(()=> {
        spacer?.remove();
        inEl?.animate?.([
            { height: spacerHeight },
            { height: `${inEl.clientHeight || 0}px` }
        ], {
            duration: ops.wrapperTransDur || 300,
            easing: "ease-in-out",
        });
    });
}

function runDomUpdates() {
    cancelAnimationFrame = false;
    
    //Loop through all work orders
    for(let order of workArray as DomWorkOrder[]) {
        if(typeof order === "function") (order as Function)();
        else {
            let wrapperHeight = order.ops?.smartOutroStyling !== false && order.out ? order.out.clientHeight : 0;

            // Remove old children
            if([">", "+"].includes(order.relation)) {
                if(order.relation == ">") {
                    //Remove old children before appending
                    let container = document.createElement("div");
                    for(let child of Array.from(order.out?.childNodes || [])) {
                        container.appendChild(child);
                    }
                    order.out?.replaceChildren(container);
                    applyTransition(container, "out", order.ops);
                }

                if(order.ops.smartOutroStyling != false) addSpacer(order.in, order.out, wrapperHeight);

                //Append
                applyTransition(order.in, "in", order.ops, ()=> {
                    if(order.in) order.out?.appendChild(order.in);
                    if(order.ops.smartOutroStyling != false) handleHeightAdjust(order.in, order.out, order.ops);
                });
            }
            //Insert after old element before removing
            else applyTransition(order.in, "in", order.ops, ()=> {
                order.out?.after(order.in as HTMLElement);

                if(order.ops.smartOutroStyling != false) {
                    addSpacer(order.in, order.out, wrapperHeight);
                    handleHeightAdjust(order.in, order.out, order.ops);
                }

                //Remove old element
                if(order.relation === "/") applyTransition(order.out, "out", order.ops);
            });

            order.done?.(order.in);
        }
    }

    workArray = [];
}

function applyTransition(el: HTMLElement | null, dir: "in" | "out", ops: Partial<FetchOptions>, fn?: Function) {
    //Handle text nodes
    if(el?.nodeType == Node.TEXT_NODE) {
        let text = el.textContent;
        let newNode = document.createElement("div");
        newNode.textContent = text;
        el.replaceWith(newNode);
        el = newNode as HTMLElement;
    }

    if(!el) return;

    //Initiate transition
    if(ops.transClass) el?.classList?.add(ops.transClass);
    el?.classList?.add("cu-trans");

    getHook(dir, "Start", ops)?.(el);

    //Wait to apply class
    if(dir == "out") {
        scheduleDomUpdate(()=> {
            if(ops.smartOutroStyling !== false) {
                //Handle absolute positioning and size conservation
                (el as HTMLElement).style.width = `${(el as HTMLElement).clientWidth}px`;
                (el as HTMLElement).style.height = `${(el as HTMLElement).clientHeight}px`;
                (el as HTMLElement).style.position = "absolute";
            }
            
            //Handle auto duration setting
            if(ops.applyCssDurations !== false) (el as HTMLElement).style.transitionDuration = `${ops[`${dir}Dur`] || 0}ms`;

            //Add outro class
            (el as HTMLElement).classList?.add(dir);
        })
    }
    //If dir == in
    else {
        setTimeout(()=> {
            scheduleDomUpdate(()=> {
                if(ops.applyCssDurations !== false) (el as HTMLElement).style.transitionDuration = `${ops[`${dir}Dur`] || 0}ms`;
                el?.classList?.add(dir);
                fn?.();

                //Remove transition class
                scheduleDomUpdate(()=> {
                    el?.classList?.remove(dir);
                });
            });
        }, ops.swapDelay || 0);
    }

    //Wrap up after duration
    let wrapup = ()=> {
        if(ops.transClass) el?.classList?.remove(ops.transClass);
        el?.classList?.remove("cu-trans");
        if(el) getHook(dir, "End", ops)?.(el);
    }
    
    if(ops[`${dir}Dur`]) {
        //Wrap up after timeout
        setTimeout(()=> {
            scheduleDomUpdate(()=> {
                if(dir == "out") {
                    el?.remove();
                }
                wrapup();
            });
        }, 
        (ops[`${dir}Dur`] as number) + (dir == "in" ? ops.swapDelay || 0 : 0));
    }
    else {
        //Run in currently-scheduled animation frame
        if(dir == "out") workArray.push(()=> el?.remove());
        getHook(dir, "End", ops)?.(el);
        el?.classList?.remove(dir);
    }
}

function getHook(dir: "in" | "out", pos: "Start" | "End", ops: Partial<FetchOptions>): Function | undefined {
    return typeof ops[`${dir}${pos}Hook`] == "string" ? 
        globalThis[ops[`${dir}${pos}Hook`] as keyof typeof globalThis] || Store.func((ops[`${dir}${pos}Hook`] || "") as string) : 
        ops[`${dir}${pos}Hook`];
}