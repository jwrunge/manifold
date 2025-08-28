import type { WritableCSSKeys } from "./css";
import type { Effect, EffectFn } from "./Effect";
import evaluateExpression from "./expression-parser";
import { scopeProxy } from "./proxy";

type Registerable = HTMLElement | SVGElement | Element;

const prefixes = [":", "data-mf."] as const;

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
	static #registry: Map<Registerable, RegEl> = new Map();
	state: Record<string, unknown>;

	static register(
		el: Registerable,
		state: Record<string, unknown>,
		effect: (fn: EffectFn) => Effect
	) {
		if (RegEl.#registry.has(el))
			throwError("Element already registered", el);
		RegEl.#registry.set(el, new RegEl(el, state, effect));
	}

	constructor(
		el: Registerable,
		state: Record<string, unknown>,
		effect: (fn: EffectFn) => Effect
	) {
		this.state = scopeProxy(state);

		// Register children (which register their own children)
		for (const child of el.children) {
			if (!child.getAttribute("data-mf-ignore")) {
				RegEl.register(child as Registerable, this.state, effect);
			}
		}

		const wasRegistered = new Set<string>();

		for (const { name, value } of el.attributes) {
			let attrName = "";
			for (const prefix of prefixes) {
				if (name.startsWith(prefix)) {
					attrName = name.slice(prefix.length);
					break;
				}
			}

			if (!attrName) continue; // not a manifold attribute, skip

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

				el.addEventListener(attrName.slice(2), (e) =>
					fn({ ...this.state, event: e, element: el })
				);

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

				if (attrPropName === "class") {
					effect(() => {
						if (fn({ ...this.state, element: el }))
							el.classList.add(String(attrProp));
						else el.classList.remove(String(attrProp));
					});
				} else if (attrPropName === "style") {
					if (!attrProp) throwError(`Style property missing`, el);
					effect(() => {
						(el as HTMLElement).style[
							attrProp as WritableCSSKeys
						] = `${fn({ ...this.state, element: el }) ?? ""}`;
					});
				} else {
					throwError(`Unsupported bind: ${attrName}`, el);
				}
			} else {
				// Handle general attributes
				effect(() => {
					const result = fn({ ...this.state, element: el });
					if (result) {
						el.setAttribute(attrName, String(result));
					} else {
						el.removeAttribute(attrName);
					}
				});

				if (sync) {
					// If the attribute is changed, update the state
				}
			}

			wasRegistered.add(attrName);
			el.removeAttribute(name);
		}
	}
}
