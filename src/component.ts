import { MfldOps } from "./common_types";
import { _fetchAndInsert } from "./fetch";
import { _register } from "./registrar";
import { _handleTemplAttribute, _swapInnerHTML } from "./templ";
import { _scheduleUpdate } from "./updates";
import { _parseFunction, _registerInternalStore, ATTR_PREFIX } from "./util";

export interface ComponentOptions {
  href: string;
  shadow: "open" | "closed" | false;
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

export interface MfldComponent extends HTMLElement {
    template: HTMLTemplateElement | null;
    context: Set<{ key: string, store: string}>;
    deps: Set<string>;
    conditionalDeps: Set<string>;

    onConnect?: Function
    onAdopted?: Function
    onDisconnect?: Function
    onAttributeChanged?: Function
}

export let _makeComponent = (name: string, ops?: Partial<ComponentOptions>): void => {
    if(MFLD.comp[name]) return;
    MFLD.comp[name] = class extends HTMLElement {
        template: HTMLTemplateElement | null = null;
        context: Set<{ key: string, store: string}> = new Set();
        deps: Set<string> = new Set();
        conditionalDeps: Set<string> = new Set();

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
            this.template = 
                document.getElementById(ops?.selector || name) as HTMLTemplateElement 
                || this.querySelector("template") as HTMLTemplateElement 
                || (()=> {
                    let T = document.createElement("template");
                    _swapInnerHTML(T, this)
                    return T;
                })();
            if(!this.classList.contains("_mf-component")) this.classList.add("_mf-component");
        }

        connectedCallback(): void {
            let shadow = ops?.shadow != false ? this.attachShadow({ mode: ops?.shadow || "closed" }) : null,
                template = (this.template as HTMLTemplateElement).content.cloneNode(true);
            
            // Get previous context
            let containingComponent = (this.parentNode as HTMLElement)?.closest?.("._mf-component");
            if(containingComponent) {
                this.context = (containingComponent as typeof this)?.context || new Map();
            }

            // Internal data
            for(let attr of this.attributes) {
                if(["id", "class"].includes(attr.name) || attr.name.startsWith(ATTR_PREFIX)) continue;
                let { func, as, dependencyList } = _parseFunction(attr.value, [], Array.from(this.context));
                if(func) {
                    for(let dep of dependencyList || []) {
                        this.deps.add(dep);
                        if(["if", "else", "elseif", "each"].includes(attr.name)) this.conditionalDeps.add(dep);
                    }
                    for(let dep of this.context) {
                        this.deps.add(dep.store);
                        if(["if", "else", "elseif", "each"].includes(attr.name)) this.conditionalDeps.add(dep.store);
                    }

                    let store = _registerInternalStore(this, func, Array.from(this.deps));
                    this.context.add({ key: attr.name, store: store.name });

                    if(attr.name.match(/if|else|each/)){
                        _handleTemplAttribute(this, attr.name, func, this.deps, as);
                    }
                }
            }

            // Create from template
            if(template) {
                shadow?.append(template);
                for(let child of Array.from(shadow?.children || this.children)) {
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

        // Bind callbacks
        attributeChangedCallback = this.onAttributeChanged;
        adoptedCallback = this.onAdopted;
        disconnectedCallback = this.onDisconnect;
        static get observedAttributes(): Array<string> {
            return ops?.observedAttributes || [];
        }
    }

    // Define the component
    if(MFLD.comp[name]) customElements.define(name, MFLD.comp[name]);
}

// HTTP get component
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

_makeComponent("mf-templ", {
    shadow: false,
});