import { _fetchAndInsert } from "./fetch";
import { _register } from "./registrar";
import { _glob } from "./store";
import { ATTR_PREFIX } from "./util";

/**
 * @param {string} name 
 * @param {{ 
 *  href?: string,
 *  shadow?: "open" | "closed",
 *  templ?: HTMLTemplateElement,
 *  selector?: string,
 *  constructor?: Function, 
 *  connected?: Function, 
 *  observedAttributes?: string[],
 *  disconnected?: Function, 
 *  adopted?: Function,
 *  attributeChanged?: Function 
 * }} [ops]
 */
export let _makeComponent = (name, ops)=> {
    _glob.MFLD.comp[name] = class extends HTMLElement {
        /** @type {HTMLTemplateElement | null} */ template;
        constructor() {
            super();
            ops?.constructor?.bind(this)?.();
            this.connected = ops?.connected?.bind(this);
            this.disconnected = ops?.disconnected?.bind(this);
            this.attributeChanged = ops?.attributeChanged?.bind(this);
            this.template = ops?.templ || /** @type {HTMLTemplateElement}*/(document.getElementById(ops?.selector || name));
            if(this.template?.nodeName != "TEMPLATE") this.template = null;
        }
        connectedCallback() {
            const   shadow = this.attachShadow({ mode: ops?.shadow || "closed" }),
                    template = this.template?.content.cloneNode(true);
            if(template) {
                shadow.append(template);
                for(let child of shadow.children) {
                    if(child.nodeName == "SLOT") {
                        for(let slotChild of /** @type {HTMLSlotElement}*/(child).assignedNodes()) {
                            _register(/** @type {HTMLElement}*/(slotChild));
                        }
                    }
                    else if(child.nodeName != "TEMPLATE") { 
                        _register(/** @type {HTMLElement}*/(child));
                    }
                }
            }
        }
        attributeChangedCallback(attr, oldVal, newVal) {
            this.attributeChanged?.(attr, oldVal, newVal);
        }
        disconnectedCallback() {
            this.disconnected?.();
        }
    }

    if(_glob.MFLD.comp[name]) customElements.define(name, _glob.MFLD.comp[name]);
}

export let _component = async (src)=> {
    await _fetchAndInsert(
        undefined, 
        "get", 
        { 
            fetch: { 
                externals: [{ 
                    domain: "$origin", scripts: "all", styles: "all" 
                }]
            }
        },
        src,
        { dataset: { [`${ATTR_PREFIX}append`]: "template -> body" }},
        false
    )
}