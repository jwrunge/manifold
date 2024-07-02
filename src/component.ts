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
  onconnect: () => void;
  ondisconnect: () => void;
  onadopted: () => void;
  onAttributeChanged: (attrName: string, oldVal: string | null, newVal: string | null) => void;
  observedAttributes: Array<string>;
  options: Partial<MfldOps>;
}

export let _makeComponent = (name: string, ops?: Partial<ComponentOptions>): void => {
    if(MFLD.comp[name]) return;
    MFLD.comp[name] = class extends HTMLElement {
        template: HTMLElement | null = null;
        _funcs: Set<Function | null> = new Set();
        _stores: Set<Store<any>> = new Set();

        onconnect?: Function
        onadopted?: Function
        ondisconnect?: Function
        onAttributeChanged?: Function

        constructor() {
            super();
            ops?.onconstruct?.bind(this)?.();
            this.onconnect = ops?.onconnect?.bind(this);
            this.onadopted = ops?.onadopted?.bind(this);
            this.ondisconnect = ops?.ondisconnect?.bind(this);
            this.onAttributeChanged = ops?.onAttributeChanged?.bind(this);
            this.template = document.getElementById(ops?.selector || name) as HTMLTemplateElement || document.createElement("template");
        }

        connectedCallback(): void {
            let shadow = this.attachShadow({ mode: ops?.shadow || "closed" }),
                template = (this.template as HTMLTemplateElement).content.cloneNode(true);

            if(template) {
                shadow.append(template);
                for(let child of Array.from(shadow.children)) {
                    if(child.nodeName == "SLOT") {
                        for(let slotChild of (child as HTMLSlotElement).assignedNodes()) {
                            _register(slotChild as HTMLElement);
                        }
                    } else if(child.nodeName != "TEMPLATE") {
                        _register(child as HTMLElement);
                    }
                }
            }

            let replace: { str: String, store: Store<any> }[] = [];
            let deps: string[] = [];
            for(let attr of this.attributes) {
                let { func, dependencyList } = _parseFunction(attr.value);
                if(func) {
                    let store = _registerInternalStore(this, func, dependencyList);
                    replace.push({ str: attr.value, store });
                    deps.push(store.name);
                    this._funcs.add(func);
                    this._stores.add(store);
                }
            }

            let ctx = this;
            function replacer($st: any) {
                for(let { str, store } of replace) {
                    _scheduleUpdate(()=> {
                        if(!ctx.template) return;
                        ctx.template.innerHTML = ctx.template.innerHTML?.replace(
                            /\$:{([^}]*)}/g, (_, cap) => _parseFunction(cap, as[0], as[1]).func?.({ $st, $fn, [as[0]]: val, [as[1]]: key }) ?? ""
                        ) 
                        || String(val);
                    })
                }
            }
            let determiner = _registerInternalStore(this, ()=> true, deps);
        }

        attributeChangedCallback = this.onAttributeChanged;
        disconnectedCallback = ()=> {
            this.ondisconnect?.();
            // for(let store of this._stores) store.destroy();
            this._funcs.forEach(func=> func = null);
        }
        adoptedCallback = this.onadopted;

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