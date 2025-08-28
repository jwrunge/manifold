import type { WritableCSSKeys } from "./css";
import type { Effect, EffectFn } from "./Effect";
import evaluateExpression from "./expression-parser";
import { scopeProxy } from "./proxy";

type Registerable = HTMLElement | SVGElement | Element;

const prefixes = [":", "data-mf-"] as const;

const templLogicAttrs = [
	"if",
	"elseif",
	"else",
	"each",
	"await",
	"then",
	"catch",
] as const;

const templLogicAttrSet = new Set(templLogicAttrs);

const throwError = (msg: string, cause?: unknown) => {
	throw new Error(msg, { cause });
};

export default class RegEl {
	static registry = new WeakMap<Registerable, RegEl>();
	static globally_observing = false;
	state: Record<string, unknown>;
	el: Registerable;
	#cleanups: Set<() => void> = new Set();
	#disposed = false;

	static #observer = new MutationObserver((mRecord) => {
		const disposeNode = (el: Node) => {
			if (
				el.nodeType !== Node.ELEMENT_NODE ||
				(el as Element).isConnected
			)
				return;

			// Skip nodes that were moved (still connected elsewhere)
			const inst = RegEl.registry.get(el as Registerable);
			inst?.dispose?.();

			// Dispose any registered descendants
			for (const d of (el as Element).querySelectorAll("*")) {
				const di = RegEl.registry.get(d as Registerable);
				di?.dispose?.();
			}
		};
		for (const m of mRecord) {
			if (m.type !== "childList") continue;
			for (const n of m.removedNodes) disposeNode(n);
		}
	});

	static register(
		el: Registerable,
		state: Record<string, unknown>,
		effect: (fn: EffectFn) => Effect
	) {
		if (!RegEl.globally_observing) {
			RegEl.#observer.observe(document, {
				childList: true,
				subtree: true,
			});
			RegEl.globally_observing = true;
		}

		if (RegEl.registry.has(el))
			throwError("Element already registered", el);
		RegEl.registry.set(el, new RegEl(el, state, effect));
	}

	constructor(
		el: Registerable,
		state: Record<string, unknown>,
		effect: (fn: EffectFn) => Effect
	) {
		this.el = el;
		this.state = scopeProxy(state);

		// Recursively register children
		for (const child of el.children) {
			if (!child.getAttribute("data-mf-ignore")) {
				RegEl.register(child as Registerable, this.state, effect);
			}
		}

		const wasRegistered = new Set<string>();

		// Take a snapshot of attributes to avoid skipping due to live NamedNodeMap mutation
		for (const { name, value } of Array.from(el.attributes)) {
			let attrName = "";
			for (const prefix of prefixes) {
				if (name.startsWith(prefix)) {
					attrName = name.slice(prefix.length);
					break;
				}
			}

			if (!attrName || attrName === "register") continue; // not a manifold attribute, skip

			let sync = false;
			if (attrName.startsWith("sync:")) {
				sync = true;
				attrName = attrName.slice(5);
			}

			if (wasRegistered.has(attrName))
				throwError(`Attribute ${attrName} duplicate`, el); // Prevent double registration

			const { fn } = evaluateExpression(value);

			if (
				templLogicAttrSet.has(
					attrName as (typeof templLogicAttrs)[number]
				)
			) {
				if (["if", "elseif", "else"].includes(attrName)) {
				} else if (attrName === "each") {
				} else if (attrName === "await") {
				} else if (["then", "catch"].includes(attrName)) {
				}

				wasRegistered.add(attrName);
				continue;
			}

			// Event handlers e.g., on:click
			if (attrName.startsWith("on")) {
				if (sync)
					throwError(`Sync not supported on event handlers`, el);

				const type = attrName.slice(2);
				const handler = (e: Event) =>
					fn({ ...this.state, event: e, element: el });
				el.addEventListener(type, handler);
				this.#cleanups.add(() => el.removeEventListener(type, handler));

				el.removeAttribute(attrName);
				wasRegistered.add(attrName);
				continue;
			}

			// Bindings: class:foo, style:color, etc.
			const [attrPropName, attrProp] = attrName.split(":", 2);
			if (attrProp) {
				if (sync)
					throwError(
						`Sync not supported on granular bindings: ${attrName}`,
						el
					);

				if (attrPropName === "style" || attrPropName === "class") {
					effect(() => {
						const res = fn({ ...this.state, element: el });
						if (attrPropName === "class")
							if (res) el.classList.add(String(attrProp));
							else el.classList.remove(String(attrProp));
						else
							(el as HTMLElement).style[
								attrProp as WritableCSSKeys
							] = `${res}`;
					});
				} else {
					throwError(`Unsupported bind: ${attrName}`, el);
				}
			} else {
				// Handle general attributes
				effect(() => {
					const result = fn({ ...this.state, element: el });
					if (attrName in el) {
						// biome-ignore lint/suspicious/noExplicitAny: We're checking if the property exists on the element
						(el as any)[attrName] = result;
					} else {
						el.setAttribute(attrName, `${value}`);
					}
				});

				if (sync) {
					// If the property or attribute is changed and it is value or checked or any other values that might change, update the state
				}
			}

			wasRegistered.add(attrName);
			el.removeAttribute(name);
		}
	}

	dispose() {
		if (this.#disposed) return;
		for (const c of this.#cleanups) {
			try {
				c();
			} catch {}
		}
		this.#cleanups.clear();
		this.#disposed = true;

		RegEl.registry.delete(this.el);
	}
}
