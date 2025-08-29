import type { WritableCSSKeys } from "./css";
import { type Effect, effect } from "./Effect";
import evaluateExpression from "./expression-parser";

type Registerable = HTMLElement | SVGElement | Element;

type templLogicAttr =
	| "if"
	| "elseif"
	| "else"
	| "each"
	| "await"
	| "then"
	| "catch";

const templLogicAttrSet = new Set([
	"if",
	"elseif",
	"else",
	"each",
	"await",
	"then",
	"catch",
] as const);

const throwError = (msg: string, cause?: unknown) => {
	throw new Error(msg, { cause });
};

const observer = new MutationObserver((mRecord) => {
	for (const m of mRecord) {
		if (m.type === "childList")
			for (const el of m.removedNodes as Iterable<Registerable>) {
				if (el.nodeType !== Node.ELEMENT_NODE || el.isConnected)
					continue;
				RegEl._registry.get(el)?.dispose?.(el as Registerable);

				for (const d of el.querySelectorAll("*")) {
					RegEl._registry.get(d)?.dispose?.(d);
				}
			}
	}
});

observer.observe(document, {
	childList: true,
	subtree: true,
});

export default class RegEl {
	static _registry = new WeakMap<Registerable, RegEl>();
	#cleanups = new Set<() => void>();

	constructor(el: Registerable, state: Record<string, unknown>) {
		// Register self or throw
		if (RegEl._registry.has(el))
			throwError("Element already registered", el);
		RegEl._registry.set(el, this);

		// Recursively register children
		for (const child of el.children) {
			if (
				!child.getAttribute("data-mf-ignore") &&
				!RegEl._registry.has(child)
			) {
				new RegEl(child as Registerable, state);
			}
		}

		const attrWasRegistered = new Set<string>();

		// Take a snapshot of attributes to avoid skipping due to live NamedNodeMap mutation
		for (const { name, value } of Array.from(el.attributes)) {
			let attrName = "";
			for (const prefix of [":", "data-mf-"] as const) {
				if (name.startsWith(prefix)) {
					attrName = name.slice(prefix.length);
					break;
				}
			}

			// Early aborts
			if (!attrName || attrName === "register") continue; // not a manifold attribute, skip
			if (attrWasRegistered.has(attrName))
				throwError(`Attribute ${attrName} duplicate`, el); // Prevent double registration

			// Sync flag
			let sync = false;
			if (attrName.startsWith("sync:")) {
				sync = true;
				attrName = attrName.slice(5);
			}

			const { fn } = evaluateExpression(value);

			if (templLogicAttrSet.has(attrName as templLogicAttr)) {
				if (["if", "elseif", "else"].includes(attrName)) {
				} else if (attrName === "each") {
				} else if (attrName === "await") {
				} else if (["then", "catch"].includes(attrName)) {
				}

				attrWasRegistered.add(attrName);
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
							...state,
							event: e,
							element: el,
						};
						if (params[0]) ctx[params[0]] = e;
						if (params[1]) ctx[params[1]] = state;
						if (params[2]) ctx[params[2]] = el;
						bodyParsed.fn(ctx);
					};
				} else {
					handler = (e: Event) =>
						fn({
							...state,
							event: e,
							element: el,
						});
				}
				el.addEventListener(type, handler);
				this.#cleanups.add(() => el.removeEventListener(type, handler));

				// Remove the original attribute (with prefix), not the sliced name
				el.removeAttribute(name);
				attrWasRegistered.add(attrName);
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
						const res = fn({ ...state, element: el });
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
					const result = fn({ ...state, element: el });
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
			attrWasRegistered.add(attrName);
			el.removeAttribute(name);
		}
	}

	dispose(el: Registerable) {
		for (const c of this.#cleanups) {
			try {
				c();
			} catch {}
		}
		RegEl._registry.delete(el);
	}
}
