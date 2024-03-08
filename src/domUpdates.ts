type DomWorkOrder = {
    in: HTMLElement,
    out: HTMLElement,
    relation: string,
    done: (el: HTMLElement)=> void
}

let tempDom: Map<HTMLElement, { fragment: DocumentFragment, workOrders: DomWorkOrder[]}> = new Map();
let cancelAnimationFrame = false;

export function scheduleDomUpdate(update: DomWorkOrder) {
    if(!tempDom.has(update.out)) {
        tempDom.set(update.out, { fragment: document.createDocumentFragment(), workOrders: [] });
        tempDom.get(update.out)?.fragment.appendChild(update.out);
    }

    tempDom.get(update.out)?.workOrders.push(update);
    if(!cancelAnimationFrame) {
        cancelAnimationFrame = true;
        requestAnimationFrame(runDomUpdates);
    }
}

function runDomUpdates() {
    cancelAnimationFrame = false;

    console.log("Running animation frame")
    
    //Loop through all elements with updates
    for(let [el, { fragment, workOrders }] of tempDom) {
        //Loop through all work orders
        for(let order of workOrders) {
            console.log(el, fragment, order)

            if(!order.in) return;
            const newEl = order.in as HTMLElement;

            //Remove old children
            if(order.relation === "inner" || order.relation === undefined) {
                let oldChildren = Array.from(order.out?.childNodes || []);
                oldChildren.forEach(c=> c.remove());    //Separate animationFrame callback after timeout
            }

            //Append or insert
            if(order.relation === "inner" || order.relation === undefined) {
                order.out?.appendChild(newEl);
            } else {
                order.out?.after(newEl);
            }

            //Remove old element
            if(order.relation === "outer") {
                order.out?.remove();                    //Separate animationFrame callback after timeout
            }

            order.done?.(newEl);
        }

        tempDom.delete(el);
    }
}