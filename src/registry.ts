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
	console.error(msg, cause);
	throw new Error("Manifold Error");
};

// Check if a Manifold event attribute (e.g., :oninput or data-mf-oninput) exists on an element
const hasMfEventAttr = (el: Element, evt: string) =>
	el.hasAttribute(`:${evt}`) || el.hasAttribute(`data-mf-${evt}`);

// Setup sync event listeners with conflict checks; returns a cleanup function
const setupSyncEvents = (
	el: Element,
	types: string[],
	conflictAttrs: string[],
	registered: Set<string>,
	handler: EventListener,
	errorMsg: string
) => {
	for (const ca of conflictAttrs)
		if (hasMfEventAttr(el, ca)) throwError(errorMsg, el);
	for (const t of types) if (registered.has(t)) throwError(errorMsg, el);
	for (const t of types) el.addEventListener(t, handler);
	return () => {
		for (const t of types) el.removeEventListener(t, handler);
	};
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

		// Handle attribute changes for sync (mapped in RegEl._mutations)
		if (m.type === "attributes") {
			const el = m.target as Registerable;
			const attrName = m.attributeName;
			if (!attrName) continue;

			const map = RegEl._mutations.get(el);
			const fn = map?.get(attrName);
			if (fn) fn();
		}
	}
});

observer.observe(document, {
	childList: true,
	subtree: true,
	attributes: true,
});

export default class RegEl {
	static _registry = new WeakMap<Registerable, RegEl>();
	static _mutations = new WeakMap<Registerable, Map<string, () => void>>();
	#mutations = new Map<string, () => void>();
	#cleanups = new Set<() => void>();

	constructor(el: Registerable, state: Record<string, unknown>) {
		// Register self or throw
		if (RegEl._registry.has(el))
			throwError("Element already registered", el);
		RegEl._registry.set(el, this);

		// Prepare per-element mutation map once
		RegEl._mutations.set(el, this.#mutations);

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
		// Track events actually registered on this element to avoid duplicates regardless of order
		const registeredEvents = new Set<string>();

		// (helper moved to module scope)

		// Clone attributes to avoid skipping due to live NamedNodeMap mutation
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

			// (mutation map set once per element above)

			// Sync flag
			let sync = false;
			if (attrName.startsWith("sync:")) {
				sync = true;
				attrName = attrName.slice(5);
			}

			const { fn, syncRef } = evaluateExpression(value);

			// Handle templating
			if (templLogicAttrSet.has(attrName as templLogicAttr)) {
				if (sync)
					throwError(
						`Sync not supported on templating attributes`,
						el
					);

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
				registeredEvents.add(type);
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
					// Update state when attribute/property changes; prefer user-driven events for properties
					const capture = () => {
						try {
							const val =
								attrName in el
									? // biome-ignore lint/suspicious/noExplicitAny: We're checking if the property exists on the element
									  (el as any)[attrName]
									: el.getAttribute(attrName);

							// Prefer syncRef (if provided) to update the actual referenced state slot
							syncRef?.(
								{ __state: state } as unknown as Record<
									string,
									unknown
								>,
								val as unknown
							);
							// Fallback: write to state[attrName]
							if (!syncRef)
								(state as Record<string, unknown>)[attrName] =
									val as unknown;
						} catch {}
					};
					this.#mutations.set(attrName, capture);

					// Attach user-driven event listeners for interactive properties that do not emit attribute mutations
					if (attrName === "value") {
						const cleanup = setupSyncEvents(
							el,
							["input", "change"],
							["oninput", "onchange"],
							registeredEvents,
							capture as EventListener,
							"sync:value conflicts with existing :oninput or :onchange on element"
						);
						this.#cleanups.add(cleanup);
					} else if (attrName === "checked") {
						const cleanup = setupSyncEvents(
							el,
							["change"],
							["onchange", "onchecked"],
							registeredEvents,
							capture as EventListener,
							"sync:checked conflicts with existing :onchange or :onchecked on element"
						);
						this.#cleanups.add(cleanup);
					} else if (
						attrName === "open" &&
						typeof (el as HTMLElement).tagName === "string" &&
						(el as HTMLElement).tagName.toLowerCase() === "details"
					) {
						const cleanup = setupSyncEvents(
							el,
							["toggle"],
							["ontoggle"],
							registeredEvents,
							capture as EventListener,
							"sync:open conflicts with existing :ontoggle on <details> element"
						);
						this.#cleanups.add(cleanup);
					}
				}
			}

			// Cleanup and maintenance
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
