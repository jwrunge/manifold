import type { WritableCSSKeys } from "./css";
import { type Effect, effect } from "./Effect";
import evaluateExpression, { type ParsedExpression } from "./expression-parser";
import { scopeProxy } from "./proxy";

type Registerable = (HTMLElement | SVGElement | MathMLElement) & {
	mfshow?: unknown;
	mfawait?: unknown;
};

const templLogicAttrs = ["if", "each", "await"] as const;

type Sibling = {
	el: Registerable;
	fn: ParsedExpression["_fn"] | null;
	attrName: templLogicAttr;
};

type templLogicAttr =
	| (typeof templLogicAttrs)[number]
	| "elseif"
	| "else"
	| "then"
	| "catch";
const templLogicAttrSet = new Set(templLogicAttrs);
const dependentLogicAttrSet = new Set(["elseif", "else", "then", "catch"]);
const prefixes = [":", "data-mf-"] as const;
const throwError = (msg: string, cause?: unknown) => {
	console.error(msg, cause);
	throw new Error("Manifold Error");
};

// Await alias parsing: supports identifier or destructured object pattern after optional 'as' part already split by caller.
// Examples:
// :then="user" => { base: 'user' }
// :then="user as {name,age}" => { base:'user', object:['name','age'] }
// :catch="err" => { base:'err' }
// :then="data as { a, b:bee }" => { base:'data', object:[{prop:'a',as:'a'},{prop:'b',as:'bee'}] }
interface AwaitAliasObjectProp {
	prop: string;
	as: string;
}
interface AwaitAlias {
	base: string; // variable holding resolved value / error passed from user (expRaw)
	object?: AwaitAliasObjectProp[]; // If destructuring pattern present
}
const IDENT = /^[A-Za-z_$][\w$]*$/;
const parseAwaitAlias = (
	expRaw: string,
	aliasStr?: string
): AwaitAlias | undefined => {
	const base = expRaw.trim();
	if (!base || !IDENT.test(base)) return undefined;
	if (!aliasStr) return { base };
	const pat = aliasStr.trim();
	if (!(pat.startsWith("{") && pat.endsWith("}"))) return { base }; // only object pattern supported in scaffold
	const inner = pat.slice(1, -1).trim();
	if (!inner) return { base, object: [] };
	const props: AwaitAliasObjectProp[] = [];
	for (const raw of inner.split(",")) {
		const seg = raw.trim();
		if (!seg) continue;
		const [left, right] = seg.split(":").map((s) => s.trim());
		if (!IDENT.test(left)) return { base }; // fallback silently
		if (right) {
			if (!IDENT.test(right)) return { base };
			props.push({ prop: left, as: right });
		} else props.push({ prop: left, as: left });
	}
	return { base, object: props };
};

// (helpers removed after condensation attempt; kept minimal to avoid unused warnings)

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

const getAttrName = (
	name: string
): { attrName: string; sync: boolean } | false => {
	let attrName = "";
	for (const prefix of prefixes) {
		if (name.startsWith(prefix)) {
			attrName = name.slice(prefix.length);
			break;
		}
	}
	if (!attrName || attrName === "register") return false;

	let sync = false;
	if (attrName.startsWith("sync:")) {
		sync = true;
		attrName = attrName.slice(5);
	}

	return { attrName, sync };
};

const getDependentAttr = (el: Element, root: "await" | "if") => {
	for (const p of prefixes) {
		for (const dep of root === "await"
			? ["then", "catch"]
			: ["elseif", "else"]) {
			const attr = `${p}${dep}`;
			if (el.hasAttribute(attr))
				return { prefixed: attr, unprefixed: dep };
		}
	}
	return { prefixed: null, unprefixed: null };
};

export default class RegEl {
	static _registry = new WeakMap<Registerable, RegEl>();
	static _mutations = new WeakMap<Registerable, Map<string, () => void>>();
	#mutations = new Map<string, () => void>();
	#cleanups = new Set<() => void>();
	_el: Registerable;
	_state: Record<string, unknown>;
	_show: unknown = false;
	_showAsync: unknown = false;
	_each?: ParsedExpression["_fn"];
	_cachedContent?: DocumentFragment;
	_thenAlias?: AwaitAlias;
	_catchAlias?: AwaitAlias;

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

		// Handle text nodes
		for (const node of Array.from(el.childNodes))
			this._handleTextNode(node);

		// Handle attributes
		for (const { name, value } of Array.from(el.attributes)) {
			const attrInfo = getAttrName(name);
			if (!attrInfo) continue;
			const { attrName, sync } = attrInfo;

			if (attrWasRegistered.has(attrName))
				throwError(`Attribute ${attrName} duplicate`, el);

			const [exp, aliasStr] = value
				.split(/\s*as\s*/)
				.map((s) => s.trim());

			const { _fn, _syncRef } = evaluateExpression(exp);

			if (templLogicAttrSet.has(attrName as "if" | "each" | "await")) {
				if (sync)
					throwError(
						`Sync not supported on templating logic: ${attrName}`,
						el
					);
				this._handleTemplating(attrName as templLogicAttr, name, _fn);
				attrWasRegistered.add(attrName);
				continue;
			} else if (
				dependentLogicAttrSet.has(
					attrName as "elseif" | "else" | "then" | "catch"
				)
			) {
				continue;
			}

			if (aliasStr) throwError(`Aliasing not supported on ${value}`, el);

			if (attrName.startsWith("on")) {
				if (sync)
					throwError(`Sync not supported on event handlers`, el);
				const type = attrName.slice(2);
				const arrow = exp.match(/^\(\s*([^)]*)?\s*\)\s*=>\s*(.+)$/);
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
			let ef: Effect;

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
						// biome-ignore lint/suspicious/noExplicitAny: Unknown element properties
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
									? // biome-ignore lint/suspicious/noExplicitAny: Unknown element properties
									  (el as any)[attrName]
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

	_handleTemplating(
		attrName: templLogicAttr,
		attrTagName: string,
		_fn: (ctx?: Record<string, unknown> | undefined) => unknown
	) {
		const isConditional = attrName === "if";
		const isAsync = attrName === "await";

		if (isConditional || isAsync) {
			const siblings: Sibling[] = [
				{
					el: this._el,
					attrName,
					fn: _fn,
				},
			];

			this._el.removeAttribute(attrTagName);

			// Get dependent siblings
			let sib = this._el.nextElementSibling;
			while (sib) {
				const { prefixed, unprefixed } = getDependentAttr(
					sib,
					attrName
				);
				if (!unprefixed || !prefixed) break;

				const fn =
					unprefixed === "else"
						? null
						: evaluateExpression(sib.getAttribute(prefixed) || "")
								._fn;
				siblings.push({
					el: sib as Registerable,
					attrName: unprefixed as templLogicAttr,
					fn,
				});
				sib.removeAttribute(prefixed);
				sib = sib.nextElementSibling;
			}

			// Effect on root and dependents
			const ef = effect(() => {
				let matched = false;

				for (const { el, fn, attrName } of siblings) {
					let res = false;

					if (isConditional) {
						if (!matched) {
							if (attrName === "else") res = true; // fallback
							else {
								res = !!fn?.({
									...this._state,
									element: el,
								});
								matched = !!res;
							}
						}
						el.mfshow = res;
					} else {
						if (!matched) {
						}

						el.mfawait = res;
					}

					(el as HTMLElement).style.display =
						(el.mfshow ?? true) && (el.mfawait ?? true)
							? ""
							: "none";
				}
			});

			this.#cleanups.add(() => ef._stop());
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
