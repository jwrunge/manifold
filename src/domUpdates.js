import { Store } from "./store";

/** @type {(DomWorkOrder | Function)[]} */ let workArray = [];
let cancelAnimationFrame = false;
/** @type {HTMLElement | null} */ let spacer;
let spacerHeight = "";

/** @export @param {(DomWorkOrder | Function)} update */
export function scheduleDomUpdate(update) {
    workArray.push(update);
    if(!cancelAnimationFrame) {
        cancelAnimationFrame = true;
        requestAnimationFrame(runDomUpdates);
    }
}

/**
 * @export
 * @param {(HTMLElement)} inEl
 * @param {(HTMLElement)} wrapper
 * @param {number} wrapperHeight
 */
function addSpacer(inEl, wrapper, wrapperHeight) {
    //Conserve parent size
    spacer = document.createElement("div");
    let { paddingTop, paddingBottom } = window.getComputedStyle(wrapper);

    spacerHeight = spacer.style.height = `calc(${(Math.abs(wrapperHeight - (inEl?.clientHeight || 0)))}px - ${paddingTop} - ${paddingBottom})`;
    wrapper?.after(spacer);
}

/**
 * @export
 * @param {(HTMLElement)} inEl
 * @param {Partial<FetchOptions>} ops
 */
function handleHeightAdjust(inEl, ops) {
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
    /*
    * @type {DomWorkOrder[]} workArray
    */
    for(let order of workArray) {
        if(typeof order === "function") (/** @type {Function} */ order)();
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
                    if(order.ops.smartOutroStyling != false) handleHeightAdjust(order.in, order.ops);
                });
            }
            //Insert after old element before removing
            else applyTransition(order.in, "in", order.ops, ()=> {
                order.out?.after(order.in);

                if(order.ops.smartOutroStyling != false) {
                    addSpacer(order.in, order.out, wrapperHeight);
                    handleHeightAdjust(order.in, order.ops);
                }

                //Remove old element
                if(order.relation === "/") applyTransition(order.out, "out", order.ops);
            });

            order.done?.(order.in);
        }
    }

    workArray = [];
}

/**
 * @param {HTMLElement} el 
 * @param {"in" | "out"} dir 
 * @param {Partial<FetchOptions>} ops 
 * @param {Function} [fn] 
 * @returns 
 */
function applyTransition(el, dir, ops, fn) {
    //Handle text nodes
    if(el?.nodeType == Node.TEXT_NODE) {
        let text = el.textContent;
        let newNode = document.createElement("div");
        newNode.textContent = text;
        el.replaceWith(newNode);
        el = newNode;
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
                el.style.width = `${(el).clientWidth}px`;
                el.style.height = `${(el).clientHeight}px`;
                el.style.position = "absolute";
            }
            
            //Handle auto duration setting
            if(ops.applyCssDurations !== false) el.style.transitionDuration = `${ops[`${dir}Dur`] || 0}ms`;

            //Add outro class
            el.classList?.add(dir);
        })
    }
    //If dir == in
    else {
        setTimeout(()=> {
            scheduleDomUpdate(()=> {
                if(ops.applyCssDurations !== false) el.style.transitionDuration = `${ops[`${dir}Dur`] || 0}ms`;
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
        (ops[`${dir}Dur`] || 0) + (dir == "in" ? ops.swapDelay || 0 : 0));
    }
    else {
        //Run in currently-scheduled animation frame
        if(dir == "out") workArray.push(()=> el?.remove());
        getHook(dir, "End", ops)?.(el);
        el?.classList?.remove(dir);
    }
}

/**
 * @param {"in" | "out"} dir 
 * @param {"Start" | "End"} pos 
 * @param {Partial<FetchOptions>} ops 
 * @returns { Function | undefined }
 */
function getHook(dir, pos, ops) {
    return typeof ops[`${dir}${pos}Hook`] == "string" ? 
        globalThis[ops[`${dir}${pos}Hook` || ""]] || Store.func((ops[`${dir}${pos}Hook` || ""])) : 
        ops[`${dir}${pos}Hook`];
}