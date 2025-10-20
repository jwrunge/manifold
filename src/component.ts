import { get } from "./fetch";
import { globalComponents } from "./globalstores";

export interface ComponentOptions {
	shadow: "open" | "closed" | false;
	onconstruct: () => void;
	onConnect: () => void;
	onDisconnect: () => void;
	onAdopted: () => void;
	onAttributeChanged: (
		attrName: string,
		oldVal: string | null,
		newVal: string | null
	) => void;
	observedAttributes: Array<string>;
}

export const _makeComponent = (
	name: string,
	template?: HTMLTemplateElement | string,
	ops?: Partial<ComponentOptions>
): void => {
	globalComponents[name] ??= class extends HTMLElement {
		template: HTMLTemplateElement | null = null;
		shadow: ShadowRoot | null = null;

		constructor() {
			super();
			ops?.onconstruct?.bind(this)?.();
			this.onConnect = ops?.onConnect?.bind(this);
			this.onAdopted = ops?.onAdopted?.bind(this);
			this.onDisconnect = ops?.onDisconnect?.bind(this);
			this.onAttributeChanged = ops?.onAttributeChanged?.bind(this);
			this.template =
				template instanceof HTMLTemplateElement
					? template
					: (document.querySelector(
							ops?.selector || `${name}`
					  ) as HTMLTemplateElement);

			if (!this.classList.contains("_mf-cmp"))
				this.classList.add("_mf-cmp");
		}

		connectedCallback(): void {
			if (ops?.shadow !== false)
				this.shadow = this.attachShadow({
					mode: ops?.shadow || "closed",
				});

			// Get previous context
			const containingComponent = (
				this.parentNode as HTMLElement
			)?.closest?.("._mf-cmp");
			if (containingComponent) {
				this.context =
					(containingComponent as MfldComponent)?.context ||
					new Map();
			}

			this._render(this.eachController?.value);
		}
	};

	// Define the component
	if (globalComponents[name])
		customElements.define(name, globalComponents[name]);
};

// HTTP get component
export const _fetchComponent = async (src: string): Promise<void> => {
	get(src, undefined, { to: "" });
};
