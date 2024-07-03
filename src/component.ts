import { MfldOps } from "./common_types";
import { _fetchAndInsert } from "./fetch";
import { _register } from "./registrar";
import { Store } from "./store";
import { _scheduleUpdate } from "./updates";
import { _parseFunction, _registerInternalStore } from "./util";

export interface ComponentOptions {
  href: string;
  shadow: "open" | "closed";
  templ: HTMLTemplateElement;
  selector: string;
  onconstruct: () => void;
  onConnect: () => void;
  onDisconnect: () => void;
  onAdopted: () => void;
  onAttributeChanged: (attrName: string, oldVal: string | null, newVal: string | null) => void;
  observedAttributes: Array<string>;
  options: Partial<MfldOps>;
}

export let _makeComponent = (name: string, ops?: Partial<ComponentOptions>): void => {
    if(MFLD.comp[name]) return;
    MFLD.comp[name] = class extends HTMLElement {
        template: HTMLElement | null = null;
        context: { key: string, store: Store<any> }[] = [];
        deps: Set<string> = new Set();

        onConnect?: Function
        onAdopted?: Function
        onDisconnect?: Function
        onAttributeChanged?: Function

        constructor() {
            super();
            ops?.onconstruct?.bind(this)?.();
            this.onConnect = ops?.onConnect?.bind(this);
            this.onAdopted = ops?.onAdopted?.bind(this);
            this.onDisconnect = ops?.onDisconnect?.bind(this);
            this.onAttributeChanged = ops?.onAttributeChanged?.bind(this);
            this.template = document.getElementById(ops?.selector || name) as HTMLTemplateElement || document.createElement("template");
            if(!this.classList.contains("_mf-component")) this.classList.add("_mf-component");
        }

        connectedCallback(): void {
            let shadow = this.attachShadow({ mode: ops?.shadow || "closed" }),
                template = (this.template as HTMLTemplateElement).content.cloneNode(true);
            
            // Internal data
            for(let attr of this.attributes) {
                if(["id", "class"].includes(attr.name)) continue;
                let { func, dependencyList } = _parseFunction(attr.value);
                if(func) {
                    for(let dep of dependencyList || []) this.deps.add(dep);
                    let store = _registerInternalStore(this, func, Array.from(this.deps));
                    this.context.push({ key: attr.name, store });
                }
            }

            if(template) {
                shadow.append(template);
                for(let child of Array.from(shadow.children)) {
                    if(child.nodeName == "SLOT") {
                        for(let slotChild of (child as HTMLSlotElement).assignedNodes()) {
                            _register(slotChild as HTMLElement, { fnCtx: this.context });
                        }
                    } else if(child.nodeName != "TEMPLATE") {
                        _register(child as HTMLElement, { fnCtx: this.context });
                    }
                }
            }
        }

        attributeChangedCallback = this.onAttributeChanged;
        disconnectedCallback = this.onDisconnect;
        adoptedCallback = this.onAdopted;

        static get observedAttributes(): Array<string> {
            return ops?.observedAttributes || [];
        }
    }

    if(MFLD.comp[name]) customElements.define(name, MFLD.comp[name]);
}

export let _component = async (name: string, src: string, ops?: Partial<ComponentOptions>): Promise<void> => {
    document.querySelectorAll(name).forEach(el=> el.classList.add("_mf-component"));
    _fetchAndInsert(
        undefined,
        "get",
        {},
        src,
        "template -> body",
        null,
        false
    ).then(()=> {
        _makeComponent(name, ops);
    });
}