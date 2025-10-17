import { globalComponents } from "./globalstores.ts";

export interface ComponentOptions {
	href: string;
	shadow: "open" | "closed" | false;
	templ: HTMLTemplateElement;
	selector: string;
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
	template: HTMLTemplateElement | string
): void => {
	globalComponents[name] ??= class extends HTMLElement {
		template: HTMLTemplateElement | null = null;
		context: Set<{ key: string; store: string }> = new Set();
		deps: Set<string> = new Set();
		shadow: ShadowRoot | null = null;
		eachController: Store<any> | null = null;
		eachAliases: string[] = [];
		showController: Store<boolean> | null = null;
		controller: Store<boolean> | null = null;

		onConnect?: Function;
		onAdopted?: Function;
		onDisconnect?: Function;
		onAttributeChanged?: Function;

		constructor() {
			super();
			ops?.onconstruct?.bind(this)?.();
			this.onConnect = ops?.onConnect?.bind(this);
			this.onAdopted = ops?.onAdopted?.bind(this);
			this.onDisconnect = ops?.onDisconnect?.bind(this);
			this.onAttributeChanged = ops?.onAttributeChanged?.bind(this);
			this.template =
				(document.getElementById(
					ops?.selector || name
				) as HTMLTemplateElement) ||
				(this.querySelector("template") as HTMLTemplateElement) ||
				(() => {
					const T = document.createElement("template");
					_swapInnerHTML(T, this);
					return T;
				})();
			if (!this.classList.contains("_mf-cmp"))
				this.classList.add("_mf-cmp");
		}

		connectedCallback(): void {
			if (ops?.shadow != false)
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

			// Internal data (if, else, elseif affects show store; each affects duplication; all others affect value replacement and bring $var lookups into scope)
			for (const attr of this.attributes) {
				if (
					["id", "class"].includes(attr.name) ||
					attr.name.startsWith(ATTR_PREFIX)
				)
					continue;
				let isConditional = ["if", "else", "elseif"].includes(
						attr.name
					),
					subConditional = ["else", "elseif"].includes(attr.name),
					store: Store<any> | null = null,
					prevConditions: string[] = [];

				// Get previous conditions
				if (subConditional) {
					let prev = this as MfldComponent;
					while (
						(prev = prev?.previousElementSibling as MfldComponent)
					) {
						if (!prev.classList.contains("_mf-cmp")) break;
						if (prev.showController)
							prevConditions.push(prev.showController?.name);
						if (prev.getAttribute("if")) break;
					}
				}

				// Parse function and create dependency list
				if (!attr.value || attr.name == "each") attr.value = "true";
				const { func, as, dependencyList } = _parseFunction(
					attr.value,
					Array.from(this.context),
					prevConditions
				);

				if (isConditional) {
					this.showController = _registerInternalStore(
						this,
						func,
						prevConditions
					);
				} else if (attr.name == "each") {
					this.eachAliases = as || ["val", "key"];
					this.eachController = _registerInternalStore(
						this,
						func,
						dependencyList
					);
				} else {
					for (const [searchIn, subprop] of [
						[dependencyList, ""],
						[this.context, "store"],
					]) {
						for (const dep of searchIn || []) {
							this.deps.add(
								subprop
									? (dep[
											subprop as keyof typeof dep
									  ] as string)
									: (dep as string)
							);
						}
					}
					store = _registerInternalStore(
						this,
						func,
						Array.from(this.deps)
					);
				}

				this.context.add({ key: attr.name, store: store?.name || "" });
			}

			// Register controller
			// this.controller = _registerInternalStore(
			//     this,
			//     ()=> this._render(this.eachController?.value),
			//     [ this.showController?.name, this.eachController?.name ].filter(s => s != null)
			// );

			this._render(this.eachController?.value);
		}

		_clear() {
			// Transition out all elements from the previous condition
			const container = document.createElement("span");
			console.log(
				"CLEARING",
				this.innerHTML,
				"SHADOW",
				this.shadow?.innerHTML
			);
			// _swapInnerHTML(container, this);
			// this.before(container);
			// console.log("CLEARING", container.innerHTML)

			_transition(container, "out", () => container.remove());
		}

		_render(_val: any) {
			this._clear();
			if (this.showController?.value === false) return;

			console.log("RENDERING");

			const template = (
				this.template as HTMLTemplateElement
			).content.cloneNode(true) as HTMLTemplateElement;
			this.shadow?.append(template);

			// Iterate over all values (only one if not each) and transition them in
			// _iterable(val, (val: any, key: any) => {
			//     template.innerHTML = (this.template?.innerHTML || "")?.replace(
			//         /{(\$[^}]*)}/g, (_, cap) => _parseFunction(cap, [], [], this.eachAliases.map(a=> `$${a}`)).func?.({ $st, $fn, [`$${this.eachAliases[0]}`]: val, [`$${this.eachAliases[1]}`]: key }) ?? ""
			//     )
			//     || String(val);

			//     // Transition in
			//     this.shadow.append(template.content);
			//     _transition(this, "in", ()=> _register(this, { noparent: true }));
			// });

			// Register children
			// for(let child of Array.from(this.rootNode?.children || this.children)) {
			//     if(child.nodeName == "SLOT") {
			//         for(let slotChild of (child as HTMLSlotElement).assignedNodes()) {
			//             _register(slotChild as HTMLElement, { fnCtx: this.context });
			//         }
			//     } else if(child.nodeName != "TEMPLATE") {
			//         _register(child as HTMLElement, { fnCtx: this.context });
			//     }
			// }
		}

		// Bind callbacks
		attributeChangedCallback = this.onAttributeChanged;
		adoptedCallback = this.onAdopted;
		disconnectedCallback() {
			this.onDisconnect?.();
			// Clean up children, stores, functions
		}
		static get observedAttributes(): Array<string> {
			return ops?.observedAttributes || [];
		}
	};

	// Define the component
	if (MFLD.comp[name]) customElements.define(name, MFLD.comp[name]);
};

export const _swapInnerHTML = (el: HTMLElement, newEl: HTMLElement) => {
	el.innerHTML = newEl.innerHTML;
	newEl.innerHTML = "";
};

// HTTP get component
export const _fetchComponent = async (
	name: string,
	src: string,
	ops?: Partial<ComponentOptions>
): Promise<void> => {
	document
		.querySelectorAll(name)
		.forEach((el) => el.classList.add("_mf-cmp"));
	_fetchAndInsert(
		undefined,
		"get",
		{},
		src,
		"template -> body",
		null,
		false
	).then(() => {
		_makeComponent(name, ops);
	});
};

_makeComponent("mf-templ", {
	shadow: false,
});
