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

	static #observer = new MutationObserver((mRecord) => {
		const disposeNode = (el: Node) => {
			if (
				el.nodeType !== Node.ELEMENT_NODE ||
				(el as Element).isConnected
			)
				return;

			// Skip nodes that were moved (still connected elsewhere)
			RegEl.registry.get(el as Registerable)?.dispose?.();

			// Dispose any registered descendants
			for (const d of (el as Element).querySelectorAll("*")) {
				RegEl.registry.get(d as Registerable)?.dispose?.();
			}
		};

		for (const m of mRecord) {
			if (m.type === "childList")
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

			const parsed = evaluateExpression(value);

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

				// Support arrow-function syntax ONLY for event handlers: (e, state, el) => BODY
				const arrow = value.match(/^\(\s*([^)]*)?\s*\)\s*=>\s*(.+)$/);
				let handler: (e: Event) => void;
				if (arrow) {
					const params = (arrow[1] ?? "")
						.split(",")
						.map((s) => s.trim())
						.filter(Boolean);
					const bodyExpr = arrow[2];
					const bodyParsed = evaluateExpression(bodyExpr);
					handler = (e: Event) => {
						const ctx: Record<string, unknown> = {
							...this.state,
							event: e,
							element: el,
						};
						if (params[0]) ctx[params[0]] = e;
						if (params[1]) ctx[params[1]] = this.state;
						if (params[2]) ctx[params[2]] = el;
						bodyParsed.fn(ctx);
					};
				} else {
					handler = (e: Event) =>
						parsed.fn({
							...this.state,
							event: e,
							element: el,
						});
				}
				el.addEventListener(type, handler);
				this.#cleanups.add(() => el.removeEventListener(type, handler));

				// Remove the original attribute (with prefix), not the sliced name
				el.removeAttribute(name);
				wasRegistered.add(attrName);
				continue;
			}

			// Bindings: class:foo, style:color, etc.
			const [attrPropName, attrProp] = attrName.split(":", 2);
			let ef: Effect;
			if (attrProp) {
				if (sync)
					throwError(
						`Sync not supported on granular bindings: ${attrName}`,
						el
					);

				if (attrPropName === "style" || attrPropName === "class") {
					ef = effect(() => {
						const res = parsed.fn({ ...this.state, element: el });
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
				ef = effect(() => {
					const result = parsed.fn({ ...this.state, element: el });
					if (attrName in el) {
						// biome-ignore lint/suspicious/noExplicitAny: We're checking if the property exists on the element
						(el as any)[attrName] = result;
					} else {
						if (result === false || result == null) {
							el.removeAttribute(attrName);
						} else {
							el.setAttribute(attrName, String(result));
						}
					}
				});

				if (sync) {
					// If the property or attribute is changed and it is value or checked or any other values that might change, update the state
				}
			}

			this.#cleanups.add(() => ef.stop());
			wasRegistered.add(attrName);
			el.removeAttribute(name);
		}
	}

	dispose() {
		for (const c of this.#cleanups) {
			try {
				c();
			} catch {}
		}
		this.#cleanups.clear();
		RegEl.registry.delete(this.el);
	}
}
