import { $fn, $st } from "./common_types";
import { _fetchAndInsert } from "./fetch";
import { _transition } from "./registered_element";
import { _register } from "./registrar";
import { Store } from "./store";
import { _iterable } from "./templates";
import { _scheduleUpdate } from "./updates";
import { _parseFunction, _registerInternalStore } from "./util";

let _templAttributes = ["if", "elseif", "else", "eval", "each"];

function _handleAttribute(self: MfldTemplElement, mode: string, detail: string | null) {
    let { func, as, dependencyList } = _parseFunction(detail ||""),
        prevConditions: string[] = [],
        isConditional = mode.match(/if|else/);
    
    as = as || ["$val", "$key"];

    // Handle elses
    if(mode.match(/else/)) {
        let prev = self as MfldTemplElement;
        let recurseCount = 0;

        // Loop backward to find previous if/elseif conditions
        while(prev = prev?.previousElementSibling as MfldTemplElement) {
            let attrToGet = "if";
            prev.getAttribute("if") ? attrToGet = "if" : prev.getAttribute("elseif") ? attrToGet = "elseif" : attrToGet = "";
            attrToGet && prevConditions.push(prev._stores.get(attrToGet)?.name || "");

            if(recurseCount++ > 100) {
                console.error("MFLD: Infinite loop detected");
                break;
            }
            if(prev.getAttribute("if")) break; 
        }

        dependencyList = [ ...(dependencyList || []), ...prevConditions ];

        // Inject previous conditions into this conditions determiner
        func = () => {
            for(let d of prevConditions) {
                if($st[d]) return false;
            }
            return mode == "else" ? true : func?.({ $st, $fn }) === true;
        };
    }

    // Subscription function - on change, update the template
    let sub = (val: any) => {
        if(val === undefined) return;   // Never update on undefined
        if(isConditional && !val) return; // Handle no value for conditional templates

        _scheduleUpdate(() => {
            // Transition out all elements from the previous condition
            for(let el of self.querySelectorAll(":not(template)")) _transition(el as HTMLElement, "out", {}, func);

            _scheduleUpdate(()=> {
                // Iterate over all values (only one if not each) and transition them in
                _iterable(mode == "each" ? val : [val], (val, key) => {
                    let item = self._templ?.cloneNode(true) as HTMLTemplateElement;
                    if(!isConditional) {
                        let html = item.innerHTML.replace(/\$:{([^}]*)}/g, (_, cap) => _parseFunction(cap, as[0], as[1]).func?.({ $st, $fn, [as[0]]: val, [as[1]]: key }) || "") || "";
                        if(item.innerHTML) item.innerHTML = html;
                    }

                    // Iterate over the template's children and transition them in
                    for(let element of Array.from(item.content.children) as HTMLElement[]) {
                        if(!element.innerHTML) element.innerHTML = String(val);
                        self.append(element);
                        _transition(element, "in", {})//, null, ()=> _register(element, true));
                    }
                });
            });
        });
    }

    _registerInternalStore(
        self,
        func, 
        dependencyList,
        sub
    )
}

export class MfldTemplElement extends HTMLElement {
    _templ: HTMLTemplateElement | null = null;
    _funcs: Set<Function | null> = new Set();
    _stores: Map<string, Store<any>> = new Map();

    connectedCallback(): void {
        // Convert to template
        this._templ = this.querySelector("template") || (()=> {
            let T = document.createElement("template");
            for(let child of this.children) T.content.appendChild(child);
            return T;
        })();

        // Initialize attributes in order of execution
        for(let attr of _templAttributes) {
            let val = this.getAttribute(attr);
            val !== null && _handleAttribute(this, attr, val);
        }
    }

    attributeChangedCallback(attr: string, _: string | null, newVal: string | null): void {
        _handleAttribute(this, attr, newVal);
    }

    disconnectedCallback(): void {
        // for(let store of this._stores) store.destroy();
        for(let func of this._funcs) func = null;
    }

    static get observedAttributes() {
        return _templAttributes;
    }
}

// @ts-ignore
if(!window.templ) window.templ = customElements.define("mf-templ", MfldTemplElement);