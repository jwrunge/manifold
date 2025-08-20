// Minimal custom element factory with typed props and runtime attr->prop mapping
	static defineComponent<Props extends StateConstraint = StateConstraint>(
		name: string,
		ops?: {
			shadow?: "open" | "closed" | false;
			selector?: string;
			// Map HTML attribute name -> prop name. Defaults to kebab-case -> camelCase
			attrMap?: Record<string, string>;
			// Optional coercion from attribute string to prop value
			toProp?: (attr: string, value: string | null) => unknown;
			// Optional list of element property names to expose as accessors on the host
			props?: Array<keyof Props & string>;
		}
	): CustomElementConstructor & { new (): HTMLElement & Props } {
		if (customElements.get(name))
			return customElements.get(
				name
			) as unknown as CustomElementConstructor & {
				new (): HTMLElement & Props;
			};

		const toCamel = (s: string) =>
			s.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase());
		const coerce = (attr: string, v: string | null): unknown => {
			if (ops?.toProp) return ops.toProp(attr, v);
			if (v == null) return null;
			if (v === "") return true;
			if (v === "true") return true;
			if (v === "false") return false;
			// number-like
			if (/^[+-]?\d+(?:\.\d+)?$/.test(v)) return Number(v);
			// simple JSON-like
			if (
				(v.startsWith("{") && v.endsWith("}")) ||
				(v.startsWith("[") && v.endsWith("]"))
			) {
				try {
					return JSON.parse(v);
				} catch {
					return v;
				}
			}
			return v;
		};

		class MFComponent extends HTMLElement {
			#tpl: HTMLTemplateElement | null = null;
			#shadow: ShadowRoot | null = null;
			#base: Record<string, unknown> | null = null;
			#state: Record<string, unknown> | null = null;
			#mo: MutationObserver | null = null;

			connectedCallback() {
				// Resolve template lazily so parser-added children exist
				if (!this.#tpl) {
					const fromSel = ops?.selector
						? (document.querySelector(
								ops.selector
						  ) as HTMLTemplateElement | null)
						: null;
					const childTpl = this.querySelector(
						"template"
					) as HTMLTemplateElement | null;
					if (fromSel) this.#tpl = fromSel;
					else if (childTpl) this.#tpl = childTpl;
					else {
						const t = document.createElement("template");
						t.innerHTML = this.innerHTML;
						this.innerHTML = "";
						this.#tpl = t;
					}
				}
				if (ops?.shadow)
					this.#shadow = this.attachShadow({ mode: ops.shadow });
				const root =
					(this.#shadow as ShadowRoot | null) ||
					(this as unknown as Element);
				if (this.#tpl)
					root.appendChild(this.#tpl.content.cloneNode(true));

				// Build a local reactive overlay that prototypes the global state
				const parent = (global as Record<string, unknown>) || null;
				this.#base = Object.create(parent) as Record<string, unknown>;
				this.#state = proxy(this.#base) as Record<string, unknown>;

				// Define accessors for declared props to interop with imperative usage
				if (ops?.props) {
					for (const key of ops.props) {
						if (!(key in this)) {
							Object.defineProperty(this, key, {
								get: () =>
									(this.#state as Record<string, unknown>)[
										key as string
									],
								set: (v: unknown) => {
									if (this.#state)
										(
											this.#state as Record<
												string,
												unknown
											>
										)[key as string] = v as unknown;
								},
								configurable: true,
								enumerable: true,
							});
						}
					}
				}

				// Initialize props from current attributes
				const attrs = this.attributes;
				for (let i = 0; i < attrs.length; i++) {
					const a = attrs[i];
					const prop = (ops?.attrMap?.[a.name] ||
						toCamel(a.name)) as string;
					(this.#state as Record<string, unknown>)[prop] = coerce(
						a.name,
						a.value
					);
				}

				// Mark host for auto-registration
				this.setAttribute("data-mf-register", "");

				// If a state exists now, register immediately with the overlay
				if (global)
					__registerSubtree(
						root,
						this.#state as Record<string, unknown>
					);

				// Watch attribute changes at runtime and update props reactively
				this.#mo = new MutationObserver((ml) => {
					for (const m of ml) {
						if (m.type !== "attributes" || !m.attributeName)
							continue;
						const n = m.attributeName;
						const prop = (ops?.attrMap?.[n] ||
							toCamel(n)) as string;
						(this.#state as Record<string, unknown>)[prop] = coerce(
							n,
							this.getAttribute(n)
						);
					}
				});
				this.#mo.observe(this, { attributes: true });
			}

			disconnectedCallback() {
				this.#mo?.disconnect();
				this.#mo = null;
				// Remove from pending map to avoid stale rebinds
				const root =
					(this.#shadow as ShadowRoot | null) ||
					(this as unknown as Element);
				// Dispose any existing registration bound to this host
				// biome-ignore lint/suspicious/noExplicitAny: internal registry access for cleanup
				const inst: any = (RegEl as any)._registry?.get?.(root);
				inst?.dispose?.();
			}
		}
		customElements.define(name, MFComponent);
		return MFComponent as unknown as CustomElementConstructor & {
			new (): HTMLElement & Props;
		};
	}