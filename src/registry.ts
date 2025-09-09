import type { WritableCSSKeys } from "./css";
import { type Effect, effect } from "./Effect";
import evaluateExpression, { type ParsedExpression } from "./expression-parser";
import { scopeProxy } from "./proxy";
type Registerable = HTMLElement | SVGElement | MathMLElement;
const templLogicAttrs = [
	"if",
	"elseif",
	"else",
	"each",
	"await",
	"then",
	"catch",
] as const;
type templLogicAttr = (typeof templLogicAttrs)[number];
const templLogicAttrSet = new Set(templLogicAttrs);
const prefixes = [":", "data-mf-"] as const;
const throwError = (msg: string, cause?: unknown) => {
	console.error(msg, cause);
	throw new Error("Manifold Error");
};
const observer = new MutationObserver((mRecord) => {
	for (const m of mRecord) {
		if (m.type === "childList")
			for (const el of m.removedNodes as Iterable<Registerable>) {
				if (el.nodeType !== Node.ELEMENT_NODE || el.isConnected)
					continue;
				RegEl._registry.get(el)?._dispose?.();
				for (const d of el.querySelectorAll(
					"*"
				) as Iterable<Registerable>) {
					RegEl._registry.get(d)?._dispose?.();
				}
			}
		if (m.type === "attributes") {
			const el = m.target as Registerable;
			const attrName = m.attributeName;
			if (!attrName) continue;
			RegEl._mutations.get(el)?.get(attrName)?.();
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
	_el: Registerable;
	_state: Record<string, unknown>;
	_show: ParsedExpression["_fn"] = () => false;
	_awaitShow?: ParsedExpression["_fn"];
	_each?: ParsedExpression["_fn"];
	constructor(el: Registerable, state: Record<string, unknown>) {
		if (RegEl._registry.has(el))
			throwError("Element already registered", el);
		RegEl._registry.set(el, this);
		this._state = scopeProxy(state);
		this._el = el;
		RegEl._mutations.set(el, this.#mutations);
		for (const child of el.children) {
			if (
				!child.getAttribute("data-mf-ignore") &&
				!RegEl._registry.has(child as Registerable)
			) {
				new RegEl(child as Registerable, state);
			}
		}
		const attrWasRegistered = new Set<string>();
		const registeredEvents = new Set<string>();
		for (const { name, value } of Array.from(el.attributes)) {
			let attrName = "";
			for (const prefix of prefixes) {
				if (name.startsWith(prefix)) {
					attrName = name.slice(prefix.length);
					break;
				}
			}
			if (!attrName || attrName === "register") continue;
			if (attrWasRegistered.has(attrName))
				throwError(`Attribute ${attrName} duplicate`, el);
			let sync = false;
			if (attrName.startsWith("sync:")) {
				sync = true;
				attrName = attrName.slice(5);
			}
			const { _fn, _syncRef } = evaluateExpression(value);
			let ef: Effect;
			if (templLogicAttrSet.has(attrName as templLogicAttr)) {
				if (sync)
					throwError(
						`Sync not supported on templating attributes`,
						el
					);
				const isElse = attrName === "else";
				const showDeps: RegEl[] = [];
				if (isElse || attrName === "elseif") {
					const prev =
						el.previousElementSibling as Registerable | null;
					if (
						!prev ||
						!prefixes.some(
							(p) =>
								prev?.hasAttribute(`${p}if`) ||
								prev?.hasAttribute(`${p}elseif`)
						)
					) {
						throwError("Malformed elseif/else sequence", el);
					}
					const rl = RegEl._registry.get(prev!);
					if (rl) showDeps.push(rl);
				}
				this._show = isElse ? () => true : _fn;
				ef = effect(() => {
					let show =
						(this._show({ ...state, element: el }) &&
							this._awaitShow?.({ ...state, element: el })) ??
						true;
					for (const rl of showDeps) {
						if (rl._show({ ...rl._state, element: rl._el }))
							show = false;
					}
					el.style.display = show ? "" : "none";
				});
				this.#cleanups.add(() => ef._stop());
				attrWasRegistered.add(attrName);
				continue;
			}
			if (attrName.startsWith("on")) {
				if (sync)
					throwError(`Sync not supported on event handlers`, el);
				const type = attrName.slice(2);
				const arrow = value.match(/^\(\s*([^)]*)?\s*\)\s*=>\s*(.+)$/);
				let handler: (e: Event) => void;
				if (arrow) {
					const [params, bodyExpr] = [
						(arrow[1] ?? "")
							.split(",")
							.map((s) => s.trim())
							.filter(Boolean),
						arrow[2],
					];
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
						bodyParsed._fn(ctx);
					};
				} else {
					handler = (e: Event) =>
						_fn({ ...state, event: e, element: el });
				}
				el.addEventListener(type, handler);
				registeredEvents.add(type);
				this.#cleanups.add(() => el.removeEventListener(type, handler));
				el.removeAttribute(name);
				attrWasRegistered.add(attrName);
				continue;
			}
			const [attrPropName, attrProp] = attrName.split(":", 2);
			if (attrProp) {
				if (sync)
					throwError(
						`Sync not supported on granular bindings: ${attrName}`,
						el
					);
				if (attrPropName === "style" || attrPropName === "class") {
					ef = effect(() => {
						const res = _fn({ ...state, element: el });
						if (attrPropName === "class") {
							if (res) el.classList.add(String(attrProp));
							else el.classList.remove(String(attrProp));
						} else {
							(el as HTMLElement).style[
								attrProp as WritableCSSKeys
							] = `${res}`;
						}
					});
				} else {
					throwError(`Unsupported bind: ${attrName}`, el);
				}
			} else {
				ef = effect(() => {
					const result = _fn({ ...state, element: el });
					if (attrName in el) {
						(el as any)[attrName] = result;
					} else {
						if (result === false || result == null)
							el.removeAttribute(attrName);
						else el.setAttribute(attrName, String(result));
					}
				});
				if (sync) {
					const capture = () => {
						try {
							const val =
								attrName in el
									? (el as any)[attrName]
									: el.getAttribute(attrName);
							if (_syncRef)
								_syncRef(
									{ __state: state } as unknown as Record<
										string,
										unknown
									>,
									val as unknown
								);
							else
								(state as Record<string, unknown>)[attrName] =
									val as unknown;
						} catch {}
					};
					this.#mutations.set(attrName, capture);
					if (
						attrName === "value" ||
						attrName === "checked" ||
						(attrName === "open" &&
							(el as HTMLElement).tagName.toLowerCase() ===
								"details")
					) {
						this.#cleanups.add(
							this._setupSyncEvents(
								attrName,
								registeredEvents,
								capture as EventListener
							)
						);
					}
				}
			}
			this.#cleanups.add(() => ef._stop());
			attrWasRegistered.add(attrName);
			el.removeAttribute(name);
		}
		for (const node of Array.from(el.childNodes))
			this._handleTextNode(node);
	}
	_setupSyncEvents = (
		attrName: "value" | "checked" | "open",
		registered: Set<string>,
		handler: EventListener
	) => {
		const { _el: el } = this;
		const [types, conflictAttrs] =
			attrName === "value"
				? [
						["input", "change"],
						["oninput", "onchange"],
				  ]
				: attrName === "checked"
				? [["change"], ["onchange", "onchecked"]]
				: [["toggle"], ["ontoggle"]];
		const errorMsg = `sync:${attrName} conflicts with existing :${conflictAttrs.join(
			" or :"
		)}`;
		for (const ca of conflictAttrs)
			if (el.hasAttribute(`:${ca}`) || el.hasAttribute(`data-mf-${ca}`))
				throwError(errorMsg, el);
		for (const t of types) {
			if (registered.has(t)) throwError(errorMsg, el);
			el.addEventListener(t, handler);
		}
		return () => {
			for (const t of types) el.removeEventListener(t, handler);
		};
	};
	_handleTextNode(node: Node) {
		if (node.nodeType !== Node.TEXT_NODE) return;
		const parts = (node.textContent ?? "").split(/(\$\{.+?\})/g);
		if (parts.length > 1) {
			const tokens = parts.map((part) => {
				if (part.startsWith("${") && part.endsWith("}")) {
					const { _fn: fn } = evaluateExpression(
						part.slice(2, -1).trim()
					);
					return { dynamic: true as const, fn };
				}
				return { dynamic: false as const, text: part };
			});
			const textEffect = effect(() => {
				node.textContent = tokens
					.map((t) =>
						t.dynamic
							? t.fn({ ...this._state, element: this._el })
							: t.text
					)
					.join("");
			});
			this.#cleanups.add(() => textEffect._stop());
		}
	}
	_dispose() {
		for (const c of this.#cleanups) {
			try {
				c();
			} catch {}
		}
		RegEl._registry.delete(this._el);
	}
}
