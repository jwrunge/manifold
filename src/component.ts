import { _fetchAndInsert } from "./fetch";
import { _register } from "./registrar";
import { ATTR_PREFIX } from "./util";

interface ComponentOptions {
  href?: string;
  shadow?: "open" | "closed";
  templ?: HTMLTemplateElement;
  selector?: string;
  constructor?: () => void;
  connected?: () => void;
  disconnected?: () => void;
  adopted?: () => void;
  attributeChanged?: (attrName: string, oldVal: string | null, newVal: string | null) => void;
  observedAttributes?: Array<string>;
}

export let _makeComponent = (name: string, ops?: ComponentOptions): void => {
  MFLD.comp[name] = class extends HTMLElement {
    template: HTMLTemplateElement | null = null;

    connected?: Function
    adopted?: Function
    disconnected?: Function
    attributeChanged?: Function

    constructor() {
      super();
      ops?.constructor?.bind(this)?.();
      this.connected = ops?.connected?.bind(this);
      this.adopted = ops?.adopted?.bind(this);
      this.disconnected = ops?.disconnected?.bind(this);
      this.attributeChanged = ops?.attributeChanged?.bind(this);
      this.template = ops?.templ || (document.getElementById(ops?.selector || name) as HTMLTemplateElement);
      if(this.template?.nodeName != "TEMPLATE") this.template = null;
    }

    connectedCallback(): void {
      const shadow = this.attachShadow({ mode: ops?.shadow || "closed" }),
            template = this.template?.content.cloneNode(true);

      if(template) {
        shadow.append(template);
        for (let child of Array.from(shadow.children)) {
          if(child.nodeName == "SLOT") {
            for (let slotChild of (child as HTMLSlotElement).assignedNodes()) {
              _register(slotChild as HTMLElement);
            }
          } else if(child.nodeName != "TEMPLATE") {
            _register(child as HTMLElement);
          }
        }
      }
    }

    attributeChangedCallback(attr: string, oldVal: string | null, newVal: string | null): void {
      this.attributeChanged?.(attr, oldVal, newVal);
    }

    disconnectedCallback(): void {
      this.disconnected?.();
    }

    adoptedCallback(): void {
      this.adopted?.();
    }

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
    {
      fetch: {
        externals: [{
          domain: "$origin", scripts: "all", styles: "selected"
        }]
      }
    },
    src,
    { dataset: { [`${ATTR_PREFIX}append`]: "template -> body" } },
    false
  )
}