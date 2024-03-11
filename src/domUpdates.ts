import { FetchOptions } from "./domRegistrar";

type DomWorkOrder = {
    in: HTMLElement | null,
    out: HTMLElement | null,
    relation: string,
    ops: Partial<FetchOptions>,
    done: (el: HTMLElement | null)=> void
};

let workArray: (DomWorkOrder | Function)[] = [];
let cancelAnimationFrame = false;

export function scheduleDomUpdate(update: DomWorkOrder | Function) {
    workArray.push(update);
    if(!cancelAnimationFrame) {
        cancelAnimationFrame = true;
        requestAnimationFrame(runDomUpdates);
    }
}

function runDomUpdates() {
    cancelAnimationFrame = false;

    console.log("RUNNING DOM UPDATES")
    
    //Loop through all work orders
    for(let order of workArray as DomWorkOrder[]) {
        if(typeof order === "function") (order as Function)();
        else {
            // Remove old children
            if([">", "+"].includes(order.relation)) {
                if(order.relation == ">") {
                    //Remove old children before appending
                    let container = document.createElement("div");
                    for(let child of Array.from(order.out?.childNodes || [])) {
                        container.appendChild(child);
                    }
                    order.out?.replaceChildren(container);
                    applyTransition(container, "out", order.ops, undefined, true);
                }

                //Append
                applyTransition(order.in, "in", order.ops, ()=> {
                    if(order.in) order.out?.appendChild(order.in);
                });
            }
            //Insert after old element before removing
            else applyTransition(order.in, "in", order.ops, ()=> {
                if(order.in) order.out?.after(order.in);

                //Remove old element
                if(order.relation === "/") applyTransition(order.out, "out", order.ops);
            });

            order.done?.(order.in);
        }
    }

    workArray = [];
}

function applyTransition(el: HTMLElement | null, dir: "in" | "out", ops: Partial<FetchOptions>, fn?: Function, inset?: boolean) {
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
    ops[`${dir}StartHook`]?.(el);

    let parent = inset ? (el as HTMLElement).parentElement : el; 

    //Wait to apply class
    if(dir == "out") {
        setTimeout(()=> {
            scheduleDomUpdate(()=> {
                console.log("SCHEDULED DOM OUT")
                if(ops.smartOutroStyling !== false) {
                    //Handle absolute positioning and size conservation
                    (el as HTMLElement).style.width = `${el.clientWidth}px`;
                    (el as HTMLElement).style.height = `${el.clientHeight}px`;
                    (el as HTMLElement).style.position = "absolute";

                    //Handle smooth parent height resize tracking
                    // if(parent) parent.style.height = `${parent.scrollHeight}px`;
                }
                
                //Handle auto duration setting
                if(ops.applyCssDurations !== false) (el as HTMLElement).style.transitionDuration = `${ops[`${dir}Dur`] || 0}ms`;

                //Add outro class
                (el as HTMLElement).classList?.add(dir);
            })
        }, 0);  //This should queue up at the end of the cycle, then schedule for the next DOM update
    }
    //If dir == in
    else {
        setTimeout(()=> {
            scheduleDomUpdate(()=> {
                if(ops.applyCssDurations !== false) (el as HTMLElement).style.transitionDuration = `${ops[`${dir}Dur`] || 0}ms`;
                el?.classList?.add(dir);
                fn?.();

                //Remove transition class
                setTimeout(()=> {
                    scheduleDomUpdate(()=> {
                        el?.classList?.remove(dir);

                        //Update height
                    });
                }, 0);
            });
        }, ops.swapDelay || 0);
    }

    //Wrap up after duration
    let wrapup = ()=> {
        if(ops.transClass) el?.classList?.remove(ops.transClass);
        el?.classList?.remove("cu-trans");
        if(el) ops[`${dir}EndHook`]?.(el);
    }
    
    if(ops[`${dir}Dur`]) {
        //Wrap up after timeout
        setTimeout(()=> {
            scheduleDomUpdate(()=> {
                if(dir == "out") el?.remove();
                wrapup();
            });
        }, 
        (ops[`${dir}Dur`] as number) + (dir == "in" ? ops.swapDelay || 0 : 0));
    }
    else {
        //Run in currently-scheduled animation frame
        if(dir == "out") workArray.push(()=> el?.remove());
        ops[`${dir}EndHook`]?.(el);
        el?.classList?.remove(dir);
    }
}