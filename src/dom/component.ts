import { type IntermediateState, State } from "../main.ts";
import evaluateExpression from "../parsing/expression-parser.ts";
import { effect } from "../reactivity/effect.ts";
import { proxy } from "../reactivity/proxy.ts";
import RegEl from "./registry.ts";

/**
 * Component definition stored in registry
 */
interface ComponentDefinition {
	tagName: string;
	builder: ComponentStateBuilder<IntermediateState>;
	styles?: string;
	elementClass: typeof ManifoldComponent;
}

/**
 * Component registry to prevent re-fetching
 */
const componentRegistry = new Map<string, ComponentDefinition>();

/**
 * ComponentStateBuilder - manages component state template
 */
export class ComponentStateBuilder<TState extends IntermediateState> {
	#uniqueName: string;
	#template: HTMLTemplateElement | (() => string);
	#scopedState: TState;
	#derivations: Map<string, (store: IntermediateState) => unknown>;
	#styles?: string;
	#tagName?: string;

	constructor(
		template: HTMLTemplateElement | (() => string),
		namePrefix?: string,
	) {
		const prefix = namePrefix || "Component";
		this.#uniqueName = `${prefix}_${crypto.randomUUID().slice(0, 8)}`;
		this.#template = template;
		this.#scopedState = {} as TState;
		this.#derivations = new Map();
	}

	add<K extends string, V>(
		obj: Record<K, V>,
	): ComponentStateBuilder<TState & Record<K, V>>;
	add<K extends string, V>(
		key: K,
		value: V,
	): ComponentStateBuilder<TState & Record<K, V>>;
	add<K extends string, V>(
		keyOrObj: K | Record<K, V>,
		value?: V,
	): ComponentStateBuilder<TState & Record<K, V>> {
		// Handle object case
		if (typeof keyOrObj === "object" && keyOrObj !== null) {
			const newState = { ...this.#scopedState } as Record<string, unknown>;
			for (const [key, val] of Object.entries(keyOrObj)) {
				newState[key] = val;
			}
			const builder = new ComponentStateBuilder<TState & Record<K, V>>(
				this.#template,
				this.#uniqueName.split("_")[0],
			);
			builder.#scopedState = newState as TState & Record<K, V>;
			builder.#derivations = new Map(this.#derivations);
			builder.#uniqueName = this.#uniqueName;
			builder.#styles = this.#styles;
			builder.#tagName = this.#tagName;
			return builder;
		}

		// Handle single key-value case
		const builder = new ComponentStateBuilder<TState & Record<K, V>>(
			this.#template,
			this.#uniqueName.split("_")[0],
		);
		builder.#scopedState = {
			...this.#scopedState,
			[keyOrObj]: value,
		} as TState & Record<K, V>;
		builder.#derivations = new Map(this.#derivations);
		builder.#uniqueName = this.#uniqueName;
		builder.#styles = this.#styles;
		builder.#tagName = this.#tagName;
		return builder;
	}

	derive<K extends string, T>(
		key: K,
		fn: (store: TState) => T,
	): ComponentStateBuilder<TState & Record<K, T>> {
		const builder = new ComponentStateBuilder<TState & Record<K, T>>(
			this.#template,
			this.#uniqueName.split("_")[0],
		);
		builder.#scopedState = { ...this.#scopedState } as TState & Record<K, T>;
		builder.#derivations = new Map(this.#derivations).set(
			key,
			fn as (store: IntermediateState) => unknown,
		);
		builder.#uniqueName = this.#uniqueName;
		builder.#styles = this.#styles;
		builder.#tagName = this.#tagName;
		return builder;
	}

	/**
	 * Create a component instance with merged props
	 */
	instance(props?: Partial<TState>): {
		state: TState;
		template: DocumentFragment;
		name: string;
	} {
		// Merge default state with passed props
		const instanceState = { ...this.#scopedState, ...props } as TState;
		const state = proxy(instanceState) as TState;

		// Run derivations
		for (const [key, deriveFn] of this.#derivations) {
			(state as Record<string, unknown>)[key] = deriveFn(state);
		}

		// Clone template
		let templateClone: DocumentFragment;
		if (typeof this.#template === "function") {
			const html = this.#template();
			const temp = document.createElement("template");
			temp.innerHTML = html;
			templateClone = temp.content.cloneNode(true) as DocumentFragment;
		} else {
			templateClone = this.#template.content.cloneNode(
				true,
			) as DocumentFragment;
		}

		return {
			state,
			template: templateClone,
			name: this.#uniqueName,
		};
	}

	/**
	 * Register this component as a custom element (for TS/JS-first approach)
	 */
	register(tagName?: string): void {
		const name = tagName || this.#tagName;
		if (!name) {
			throw new Error("Component must have a name to register");
		}

		const elementClass = createComponentClass(this, this.#styles);

		if (!customElements.get(name)) {
			customElements.define(name, elementClass);
		}
	}

	_setStyles(styles: string): this {
		this.#styles = styles;
		return this;
	}

	_setTagName(tagName: string): this {
		this.#tagName = tagName;
		return this;
	}
}

/**
 * Custom element wrapper for Manifold components
 */
class ManifoldComponent extends HTMLElement {
	#state?: Record<string, unknown>;
	#cleanup: (() => void)[] = [];
	#builder: ComponentStateBuilder<IntermediateState>;
	#styles?: string;

	constructor(
		builder: ComponentStateBuilder<IntermediateState>,
		styles?: string,
	) {
		super();
		this.#builder = builder;
		this.#styles = styles;
	}

	connectedCallback() {
		try {
			// Parse props from attributes
			const props = this.#parseProps();

			// Create instance with props
			const { state, template, name } = this.#builder.instance(props);
			this.#state = state;

			// Register state globally for RegEl
			State.globalStores.set(name, state);

			// Inject styles if present
			if (this.#styles) {
				const styleEl = document.createElement("style");
				styleEl.textContent = this.#styles;
				this.appendChild(styleEl);
			}

			// Append template
			this.appendChild(template);

			// Register with RegEl using unique name
			this.setAttribute("data-mf-register", name);

			// Initialize RegEl on this element
			new RegEl(this as HTMLElement, state);

			// Set up reactive prop bindings
			this.#setupPropBindings();
		} catch (err) {
			console.error("Component initialization failed:", err);
			this.innerHTML = `<div class="mf-component-error">${(err as Error).message}</div>`;
		}
	}

	disconnectedCallback() {
		// Run all cleanup functions
		for (const cleanup of this.#cleanup) {
			try {
				cleanup();
			} catch {}
		}
		this.#cleanup = [];
	}

	#parseProps(): Record<string, unknown> {
		const props: Record<string, unknown> = {};
		const parentContext = this.#getParentContext();

		for (const attr of Array.from(this.attributes)) {
			if (attr.name.startsWith(":")) {
				// Reactive prop
				const propName = attr.name.slice(1).replace(/^sync:/, "");
				try {
					const parsed = evaluateExpression(attr.value);
					props[propName] = parsed._fn(parentContext);
				} catch (err) {
					console.warn(`Failed to evaluate prop ${propName}:`, err);
				}
			} else if (attr.name !== "data-mf-register") {
				// Static prop
				props[attr.name] = attr.value;
			}
		}

		return props;
	}

	#setupPropBindings(): void {
		const parentContext = this.#getParentContext();
		if (!parentContext.state || !this.#state) return;

		for (const attr of Array.from(this.attributes)) {
			if (!attr.name.startsWith(":")) continue;

			const isSync = attr.name.startsWith(":sync:");
			const propName = attr.name.slice(1).replace(/^sync:/, "");

			try {
				const parsed = evaluateExpression(attr.value);

				// Parent → Component: Watch parent state changes
				const parentToChild = effect(() => {
					const parentValue = parsed._fn(parentContext);
					if (this.#state) {
						this.#state[propName] = parentValue;
					}
				});
				this.#cleanup.push(() => parentToChild._stop());

				// Component → Parent: For sync props, watch component state changes
				if (isSync && parsed._syncRef && this.#state) {
					const state = this.#state;
					const childToParent = effect(() => {
						const childValue = state[propName];
						parsed._syncRef?.(parentContext, childValue);
					});
					this.#cleanup.push(() => childToParent._stop());
				}
			} catch (err) {
				console.warn(`Failed to bind prop ${propName}:`, err);
			}
		}
	}

	#getParentContext(): {
		state?: Record<string, unknown>;
		element?: HTMLElement;
	} {
		// Walk up to find parent's data-mf-register
		let parent = this.parentElement;
		while (parent) {
			const storeName = parent.getAttribute("data-mf-register");
			if (storeName !== null) {
				const store = State.globalStores.get(storeName || undefined);
				if (store) {
					return { state: store, element: parent };
				}
			}
			parent = parent.parentElement;
		}
		return {};
	}
}

/**
 * Create a custom element class for a component
 */
function createComponentClass(
	builder: ComponentStateBuilder<IntermediateState>,
	styles?: string,
): typeof ManifoldComponent {
	return class extends ManifoldComponent {
		constructor() {
			super(builder, styles);
		}
	};
}

/**
 * Load and register a component from an HTML file (HTML-first approach)
 */
export async function useComponent(
	url: string,
	options?: {
		tagName?: string;
		shadowDom?: boolean;
		scopeStyles?: boolean;
	},
): Promise<void> {
	// Check if already registered
	const existing = componentRegistry.get(url);
	if (existing) {
		if (!customElements.get(existing.tagName)) {
			customElements.define(existing.tagName, existing.elementClass);
		}
		return;
	}

	try {
		// Fetch component HTML
		const response = await fetch(url);
		if (!response.ok) {
			throw new Error(`Failed to fetch component: ${response.statusText}`);
		}
		const html = await response.text();

		// Parse HTML
		const parser = new DOMParser();
		const doc = parser.parseFromString(html, "text/html");

		// Extract template
		const template = doc.querySelector("template");
		if (!template) {
			throw new Error(`Component ${url} missing <template> element`);
		}

		// Extract script and execute to get builder
		const script = doc.querySelector('script[type="module"]');
		if (!script || !script.textContent) {
			throw new Error(`Component ${url} missing <script type="module">`);
		}

		// Create a module blob to execute the script
		const scriptContent = script.textContent;
		const blob = new Blob([scriptContent], { type: "text/javascript" });
		const moduleUrl = URL.createObjectURL(blob);

		try {
			const module = await import(moduleUrl);
			URL.revokeObjectURL(moduleUrl);

			const builder = module.default || module.componentState;
			if (!builder || !(builder instanceof ComponentStateBuilder)) {
				throw new Error(
					`Component ${url} must export a ComponentStateBuilder as 'default' or 'componentState'`,
				);
			}

			// Extract styles
			const styles = Array.from(doc.querySelectorAll("style"))
				.map((s) => s.textContent)
				.join("\n");

			// Derive tag name from filename if not provided
			const tagName =
				options?.tagName ||
				url
					.split("/")
					.pop()
					?.replace(/\.mf\.html$/, "")
					.replace(/[^a-zA-Z0-9-]/g, "-")
					.toLowerCase();

			if (!tagName) {
				throw new Error(`Could not derive tag name from ${url}`);
			}

			// Create custom element class
			const elementClass = createComponentClass(builder, styles);

			// Store in registry
			componentRegistry.set(url, {
				tagName,
				builder,
				styles,
				elementClass,
			});

			// Register custom element
			if (!customElements.get(tagName)) {
				customElements.define(tagName, elementClass);
			}
		} catch (err) {
			URL.revokeObjectURL(moduleUrl);
			throw err;
		}
	} catch (err) {
		console.error(`Failed to load component ${url}:`, err);
		throw err;
	}
}

/**
 * Tagged template helper for HTML strings (syntax highlighting)
 */
export function html(
	strings: TemplateStringsArray,
	...values: unknown[]
): string {
	return strings.reduce((result, str, i) => {
		return result + str + (values[i] ?? "");
	}, "");
}

/**
 * Tagged template helper for CSS strings (syntax highlighting)
 */
export function css(
	strings: TemplateStringsArray,
	...values: unknown[]
): string {
	return strings.reduce((result, str, i) => {
		return result + str + (values[i] ?? "");
	}, "");
}
