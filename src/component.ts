import { type Effect, effect } from "./Effect.ts";
import isEqual from "./equality.ts";
import serverPage from "./fetch.ts";
import { globalComponents } from "./globalstores.ts";
import type { StateConstraint } from "./main.ts";
import { proxy } from "./proxy.ts";
import RegEl from "./registry.ts";
import type { Registerable } from "./templating/types.ts";

const camelToKebab = (value: string): string => {
	return value
		.replace(/([a-z0-9])([A-Z])/g, "$1-$2")
		.replace(/[_\s]+/g, "-")
		.toLowerCase();
};

const stringToTemplate = (markup: string): HTMLTemplateElement => {
	const tpl = document.createElement("template");
	tpl.innerHTML = markup;
	return tpl;
};

const resolveTemplate = (
	name: string,
	template: HTMLTemplateElement | string | undefined,
	selector?: string,
): HTMLTemplateElement => {
	if (template instanceof HTMLTemplateElement) return template;
	if (typeof template === "string") return stringToTemplate(template);

	const candidates = selector
		? [selector]
		: [
				`template[data-component="${name}"]`,
				`template#${name}`,
				`template[name="${name}"]`,
				`#${name}`,
			];

	for (const sel of candidates) {
		const node = document.querySelector(sel);
		if (node instanceof HTMLTemplateElement) return node;
	}

	throw new Error(
		`Manifold: Template not found for "${name}". Provide template element or selector.`,
	);
};

type PropKind = "string" | "number" | "boolean" | "json" | "any";

type PropDefinitionMap<TProps extends Record<string, unknown>> = {
	[K in keyof TProps]?: PropDefinition<TProps[K]>;
};

const truthyValues = new Set(["true", "1", "yes", "on", ""]);
const falsyValues = new Set(["false", "0", "no", "off"]);

const parseByType = (
	type: PropKind,
	value: string | null,
	component: string,
	prop: string,
): unknown => {
	if (value === null) return undefined;
	const trimmed = value.trim();
	switch (type) {
		case "string":
			return value;
		case "number": {
			const num = Number(trimmed);
			if (Number.isNaN(num))
				throw new TypeError(
					`Manifold: Prop "${prop}" on <${component}> expects number, got "${value}".`,
				);
			return num;
		}
		case "boolean": {
			const normalized = trimmed.toLowerCase();
			if (truthyValues.has(normalized)) return true;
			if (falsyValues.has(normalized)) return false;
			return Boolean(trimmed);
		}
		case "json": {
			try {
				return JSON.parse(value);
			} catch (error) {
				throw new TypeError(
					`Manifold: Prop "${prop}" on <${component}> expects JSON, got "${value}".`,
					{ cause: error },
				);
			}
		}
		default:
			return value;
	}
};

const coerceByType = (
	type: PropKind,
	value: unknown,
	component: string,
	prop: string,
): unknown => {
	if (value === undefined) return undefined;
	if (value === null) return null;
	switch (type) {
		case "string":
			return String(value);
		case "number": {
			if (typeof value === "number") {
				if (Number.isNaN(value))
					throw new TypeError(
						`Manifold: Prop "${prop}" on <${component}> got NaN.`,
					);
				return value;
			}
			const num = Number(value);
			if (Number.isNaN(num))
				throw new TypeError(
					`Manifold: Prop "${prop}" on <${component}> expects number, got "${String(
						value,
					)}".`,
				);
			return num;
		}
		case "boolean": {
			if (typeof value === "boolean") return value;
			if (typeof value === "string")
				return parseByType("boolean", value, component, prop) as boolean;
			if (typeof value === "number") return value !== 0;
			return Boolean(value);
		}
		case "json": {
			if (typeof value === "string")
				return parseByType("json", value, component, prop);
			return value;
		}
		default:
			return value;
	}
};

const serializeByType = (type: PropKind, value: unknown): string | null => {
	if (value === undefined || value === null) return null;
	switch (type) {
		case "string":
			return String(value);
		case "number": {
			const num = typeof value === "number" ? value : Number(value);
			if (Number.isNaN(num)) return null;
			return String(num);
		}
		case "boolean":
			return value ? "" : null;
		case "json": {
			try {
				return JSON.stringify(value);
			} catch {
				return null;
			}
		}
		default:
			return String(value);
	}
};

export interface PropDefinition<T> {
	type?: PropKind;
	attribute?: string | false;
	required?: boolean;
	default?: T | (() => T);
	reflect?: boolean;
	parse?: (value: string | null, element: HTMLElement) => T;
	coerce?: (value: unknown, element: HTMLElement) => T;
	serialize?: (value: T) => string | null | undefined;
	equals?: (a: T, b: T) => boolean;
}

export interface ManifoldComponentInstance<
	TProps extends Record<string, unknown> = Record<string, unknown>,
> extends HTMLElement {
	readonly props: Readonly<TProps>;
	readonly state: TProps & StateConstraint;
	updateProps(values: Partial<TProps>): void;
	context: Map<unknown, unknown>;
	shadow: ShadowRoot | null;
	template: HTMLTemplateElement;
}

export interface ComponentOptions<
	TProps extends Record<string, unknown> = Record<string, unknown>,
> {
	selector?: string;
	shadow?: "open" | "closed" | false;
	props?: PropDefinitionMap<TProps>;
	observedAttributes?: string[];
	setup?(
		this: ManifoldComponentInstance<TProps>,
		state: TProps & StateConstraint,
	): void;
	onconstruct?(this: ManifoldComponentInstance<TProps>): void;
	onConnect?(this: ManifoldComponentInstance<TProps>): void;
	onDisconnect?(this: ManifoldComponentInstance<TProps>): void;
	onAdopted?(this: ManifoldComponentInstance<TProps>): void;
	onAttributeChanged?(
		this: ManifoldComponentInstance<TProps>,
		attrName: string,
		oldVal: string | null,
		newVal: string | null,
	): void;
}

interface PropRuntime {
	key: string;
	type: PropKind;
	attribute: string | null;
	required: boolean;
	reflect: boolean;
	parse: (value: string | null, host: HTMLElement) => unknown;
	coerce: (value: unknown, host: HTMLElement) => unknown;
	serialize: (value: unknown) => string | null;
	equals: (a: unknown, b: unknown) => boolean;
	defaultFactory?: () => unknown;
}

interface NormalizedOptions {
	name: string;
	template: HTMLTemplateElement;
	shadow: "open" | "closed" | false;
	props: Map<string, PropRuntime>;
	propKeys: string[];
	attrToProp: Map<string, string>;
	observed: string[];
}

const normalizeOptions = <TProps extends Record<string, unknown>>(
	name: string,
	template: HTMLTemplateElement,
	opts: ComponentOptions<TProps>,
): NormalizedOptions => {
	const props = new Map<string, PropRuntime>();
	const attrToProp = new Map<string, string>();

	const definitions = opts.props ?? ({} as PropDefinitionMap<TProps>);
	for (const [key, definition] of Object.entries(definitions) as [
		string,
		PropDefinition<unknown> | undefined,
	][]) {
		if (!definition) continue;
		const type = definition.type ?? "any";
		const attribute =
			definition.attribute === false
				? null
				: (definition.attribute ?? camelToKebab(key));
		if (attribute) attrToProp.set(attribute, key);

		const parse =
			definition.parse ??
			((value: string | null, host: HTMLElement) =>
				parseByType(type, value, host.tagName.toLowerCase(), key));
		const coerce =
			definition.coerce ??
			((value: unknown, host: HTMLElement) =>
				coerceByType(type, value, host.tagName.toLowerCase(), key));
		const serialize =
			definition.serialize ??
			((value: unknown) => serializeByType(type, value));

		const equals =
			definition.equals ?? ((a: unknown, b: unknown) => isEqual(a, b));

		const defaultFactory =
			definition.default === undefined
				? undefined
				: typeof definition.default === "function"
					? (definition.default as () => unknown)
					: () => definition.default;

		const reflect =
			definition.reflect ?? (attribute !== null && type !== "any");

		props.set(key, {
			key,
			type,
			attribute,
			required: Boolean(definition.required),
			reflect,
			parse,
			coerce,
			serialize,
			equals,
			defaultFactory,
		});
	}

	const observedSet = new Set<string>();
	for (const runtime of props.values())
		if (runtime.attribute) observedSet.add(runtime.attribute);
	for (const attr of opts.observedAttributes ?? []) observedSet.add(attr);

	return {
		name,
		template,
		shadow: opts.shadow ?? "closed",
		props,
		propKeys: Array.from(props.keys()),
		attrToProp,
		observed: Array.from(observedSet),
	};
};

type PropUpdateSource = "attribute" | "property" | "update" | "upgrade";

export const _makeComponent = <
	TProps extends Record<string, unknown> = Record<string, unknown>,
>(
	name: string,
	template?: HTMLTemplateElement | string,
	opts?: ComponentOptions<TProps>,
): CustomElementConstructor & {
	new (): ManifoldComponentInstance<TProps>;
} => {
	if (globalComponents[name]) {
		return globalComponents[name] as CustomElementConstructor & {
			new (): ManifoldComponentInstance<TProps>;
		};
	}

	const options = opts ?? {};
	const resolvedTemplate = resolveTemplate(name, template, options.selector);
	const normalized = normalizeOptions(name, resolvedTemplate, options);

	class ManifoldComponent
		extends HTMLElement
		implements ManifoldComponentInstance<TProps>
	{
		static get observedAttributes(): string[] {
			return normalized.observed;
		}

		public context: Map<unknown, unknown>;
		public shadow: ShadowRoot | null = null;
		public template: HTMLTemplateElement;
		private _state: TProps & StateConstraint;
		private _propsProxy: Readonly<TProps>;
		private _propEffects: Effect[] = [];
		private _regEls: RegEl[] = [];
		private _initialized = false;
		private _renderRoot: ShadowRoot | HTMLElement | null = null;
		private _updatingFromAttribute = new Set<string>();
		private _reflectingAttributes = new Set<string>();

		constructor() {
			super();

			this.context = new Map();
			this.template = normalized.template;

			const preUpgrade = new Map<string, unknown>();
			for (const key of normalized.propKeys) {
				if (Object.hasOwn(this, key)) {
					preUpgrade.set(key, (this as Record<string, unknown>)[key]);
					delete (this as Record<string, unknown>)[key];
				}
			}

			const initial = this._computeInitialProps(preUpgrade);
			const reactive = proxy(initial) as TProps & StateConstraint;
			this._state = reactive;

			this._propsProxy = new Proxy(Object.create(null), {
				get: (_target, prop: PropertyKey) =>
					(reactive as Record<PropertyKey, unknown>)[prop],
				has: (_target, prop: PropertyKey) =>
					prop in (reactive as Record<PropertyKey, unknown>),
				ownKeys: () =>
					Reflect.ownKeys(reactive as Record<PropertyKey, unknown>),
				getOwnPropertyDescriptor: (_target, prop: PropertyKey) =>
					Object.getOwnPropertyDescriptor(
						reactive as Record<PropertyKey, unknown>,
						prop,
					),
				set: () => {
					throw new Error(
						`Manifold: props on <${name}> are read-only. Use property setters or updateProps().`,
					);
				},
			}) as Readonly<TProps>;

			if (options.setup)
				options.setup.call(this as ManifoldComponentInstance<TProps>, reactive);

			if (options.onconstruct)
				options.onconstruct.call(this as ManifoldComponentInstance<TProps>);
		}

		get props(): Readonly<TProps> {
			return this._propsProxy;
		}

		get state(): TProps & StateConstraint {
			return this._state;
		}

		updateProps(values: Partial<TProps>): void {
			for (const [key, val] of Object.entries(values) as [string, unknown][]) {
				this._setProp(key, val, "update");
			}
		}

		connectedCallback(): void {
			if (!this.classList.contains("_mf-cmp")) this.classList.add("_mf-cmp");

			const parentComponent = (
				this.parentNode as HTMLElement | null
			)?.closest?.("._mf-cmp") as ManifoldComponentInstance | null;
			if (parentComponent?.context) {
				this.context = parentComponent.context;
			} else if (!this.context) {
				this.context = new Map();
			}

			this._ensureInitialized();

			if (options.onConnect)
				options.onConnect.call(this as ManifoldComponentInstance<TProps>);
		}

		disconnectedCallback(): void {
			if (options.onDisconnect)
				options.onDisconnect.call(this as ManifoldComponentInstance<TProps>);
		}

		adoptedCallback(): void {
			if (options.onAdopted)
				options.onAdopted.call(this as ManifoldComponentInstance<TProps>);
		}

		attributeChangedCallback(
			name: string,
			oldVal: string | null,
			newVal: string | null,
		): void {
			if (!normalized.attrToProp.has(name)) {
				if (options.onAttributeChanged)
					options.onAttributeChanged.call(
						this as ManifoldComponentInstance<TProps>,
						name,
						oldVal,
						newVal,
					);
				return;
			}

			if (this._reflectingAttributes.has(name)) {
				if (options.onAttributeChanged)
					options.onAttributeChanged.call(
						this as ManifoldComponentInstance<TProps>,
						name,
						oldVal,
						newVal,
					);
				return;
			}

			const propKey = normalized.attrToProp.get(name);
			if (!propKey) return;

			const runtime = normalized.props.get(propKey);
			if (!runtime) return;

			this._updatingFromAttribute.add(propKey);
			try {
				const parsed = runtime.parse(newVal, this);
				this._setProp(propKey, parsed, "attribute");
			} finally {
				this._updatingFromAttribute.delete(propKey);
			}

			if (options.onAttributeChanged)
				options.onAttributeChanged.call(
					this as ManifoldComponentInstance<TProps>,
					name,
					oldVal,
					newVal,
				);
		}

		private _computeInitialProps(
			preUpgrade: Map<string, unknown>,
		): Record<string, unknown> {
			const initial: Record<string, unknown> = Object.create(null);
			for (const key of normalized.propKeys) {
				const runtime = normalized.props.get(key);
				if (!runtime) continue;

				if (preUpgrade.has(key)) {
					initial[key] = runtime.coerce(preUpgrade.get(key), this);
					continue;
				}

				if (runtime.attribute) {
					const raw = this.getAttribute(runtime.attribute);
					const parsed = runtime.parse(raw, this);
					if (parsed !== undefined) {
						initial[key] = parsed;
						continue;
					}
				}

				if (runtime.defaultFactory) {
					initial[key] = runtime.defaultFactory();
					continue;
				}

				if (runtime.required) {
					throw new Error(
						`Manifold: Missing required prop "${key}" on <${normalized.name}>.`,
					);
				}

				initial[key] = undefined;
			}
			return initial;
		}

		private _setProp(
			key: string,
			value: unknown,
			source: PropUpdateSource,
		): void {
			const runtime = normalized.props.get(key);
			const stateRecord = this._state as unknown as Record<string, unknown>;

			if (!runtime) {
				stateRecord[key] = value;
				return;
			}

			const next = source === "attribute" ? value : runtime.coerce(value, this);

			if (runtime.required && (next === undefined || next === null)) {
				throw new Error(
					`Manifold: Prop "${key}" on <${normalized.name}> is required.`,
				);
			}

			const prev = stateRecord[key];

			if (runtime.equals(prev, next)) return;

			stateRecord[key] = next;
		}

		private _installPropEffects(): void {
			for (const [key, runtime] of normalized.props.entries()) {
				if (!runtime.reflect || !runtime.attribute) continue;
				const attrName = runtime.attribute;
				const eff = effect(() => {
					const value = (this._state as unknown as Record<string, unknown>)[
						key
					];
					if (this._updatingFromAttribute.has(key)) return;

					const serialized = runtime.serialize(value);
					const current = this.getAttribute(attrName);

					if (serialized === null) {
						if (current !== null) {
							this._reflectingAttributes.add(attrName);
							try {
								this.removeAttribute(attrName);
							} finally {
								this._reflectingAttributes.delete(attrName);
							}
						}
						return;
					}

					if (current === serialized) return;

					this._reflectingAttributes.add(attrName);
					try {
						this.setAttribute(attrName, serialized);
					} finally {
						this._reflectingAttributes.delete(attrName);
					}
				});
				this._propEffects.push(eff);
			}
		}

		private _getRenderRoot(): ShadowRoot | HTMLElement {
			if (this._renderRoot) return this._renderRoot;
			if (normalized.shadow === false) {
				this._renderRoot = this;
				this.shadow = null;
			} else {
				this.shadow =
					this.shadowRoot ?? this.attachShadow({ mode: normalized.shadow });
				this._renderRoot = this.shadow;
			}
			return this._renderRoot;
		}

		private _ensureInitialized(): void {
			if (this._initialized) return;
			if (this._propEffects.length === 0) this._installPropEffects();

			const fragment = normalized.template.content.cloneNode(
				true,
			) as DocumentFragment;
			const nodes = Array.from(fragment.childNodes);
			const root = this._getRenderRoot();
			root.appendChild(fragment);

			this._regEls = [];
			for (const node of nodes) {
				if (
					node.nodeType === Node.ELEMENT_NODE &&
					!(node as Element).hasAttribute("data-mf-register")
				) {
					this._regEls.push(
						new RegEl(
							node as Registerable,
							this._state as unknown as Record<string, unknown>,
						),
					);
				}
			}

			this._initialized = true;
		}
	}

	for (const [propKey] of normalized.props.entries()) {
		Object.defineProperty(ManifoldComponent.prototype, propKey, {
			get(this: ManifoldComponent) {
				return (this._state as unknown as Record<string, unknown>)[propKey];
			},
			set(this: ManifoldComponent, value: unknown) {
				this._setProp(propKey, value, "property");
			},
			enumerable: true,
			configurable: true,
		});
	}

	globalComponents[name] = ManifoldComponent;

	if (!customElements.get(name)) {
		customElements.define(name, ManifoldComponent);
	}

	return ManifoldComponent as unknown as CustomElementConstructor & {
		new (): ManifoldComponentInstance<TProps>;
	};
};

// HTTP get component (legacy helper)
export const _fetchComponent = async (src: string): Promise<void> => {
	serverPage.get(src, undefined, { to: "" });
};
