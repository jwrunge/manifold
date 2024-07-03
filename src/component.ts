import { MfldOps } from "./common_types";
import { _fetchAndInsert } from "./fetch";
import { _register } from "./registrar";
import { _scheduleUpdate } from "./updates";
import { _parseFunction } from "./util";

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
        context: { key: string, func: Function }[] = [];
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
        }

        connectedCallback(): void {
            let shadow = this.attachShadow({ mode: ops?.shadow || "closed" }),
                template = (this.template as HTMLTemplateElement).content.cloneNode(true);
            
            // Internal data
            for(let attr of this.attributes) {
                let { func, dependencyList } = _parseFunction(attr.value);
                if(func) {
                    for(let dep of dependencyList || []) this.deps.add(dep);
                    this.context.push({ key: attr.name, func });
                }
            }

            if(template) {
                shadow.append(template);
                for(let child of Array.from(shadow.children)) {
                    console.log("FOUND CHILD", child)
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

export let _component = async (src: string): Promise<void> => {
    await _fetchAndInsert(
        undefined,
        "get",
        { fetch: {
            externals: [{
                domain: "$origin", script: "all", style: "selected"
            }]
        } },
        src,
        "template -> body",
        null,
        false
    );
}