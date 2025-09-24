import { type Effect, effect } from "./Effect";
import evaluateExpression from "./expression-parser";
import { globalStores } from "./main";
import { scopeProxy } from "./proxy";
import { handleAsync } from "./templating/async-handler";
import { handleConditional } from "./templating/conditional-handler";
import { handleEach } from "./templating/each-handler";
import { findDependentSiblings } from "./templating/sibling-resolver";
import {
	dependentLogicAttrSet,
	prefixes,
	type Registerable,
	type Sibling,
	type templLogicAttr,
	templLogicAttrSet,
} from "./templating/types";

// Shared registration logic for both new and existing elements
const _registerElement = (el: Element) => {
	const attr = el.getAttribute("data-mf-register");
	if (attr !== null) {
		const storeName = attr || undefined;
		const store = globalStores.get(storeName);
		if (store) {
			new RegEl(el as HTMLElement | SVGElement | MathMLElement, store);
			// Remove mf-hidden class after registration
			el.classList.remove("mf-hidden");
		}
	}
};

// Handle incremental registration of new elements
const _handleNewElements = (addedNodes: NodeList) => {
	for (const node of addedNodes) {
		if (node.nodeType !== 1) continue; // ELEMENT_NODE = 1
		const el = node as Element;

		// Check if this element or any descendant needs registration
		const candidates = [el, ...el.querySelectorAll("[data-mf-register]")];
		for (const candidate of candidates) {
			_registerElement(candidate);
		}
	}
};

import { VT_CLASS, VT_NAME } from "./css";
import { splitAs } from "./parsing-utils";
const throwError = (msg: string, cause: unknown, unsupported = false) => {
	let hint = "";
	if (cause && typeof Node !== "undefined" && cause instanceof Node) {
		const el = cause as Element;
		if (el && el.nodeType === 1) {
			const tag = (el as Element).tagName?.toLowerCase?.() || "element";
			const id = (el as Element).id ? `#${(el as Element).id}` : "";
			const cls = (el as Element).classList?.length
				? `.${Array.from((el as Element).classList).join(".")}`
				: "";
			hint = ` @ <${tag}${id}${cls}>`;
		}
	}
	const prefix = unsupported ? "Unsupported: " : "";
	throw new Error(`Manifold: ${prefix}${msg}${hint}`);
};

const hasAnyPrefixedAttr = (el: Element, attrName: string): boolean => {
	return (
		el.hasAttribute(`:${attrName}`) ||
		el.hasAttribute(`data-mf-${attrName}`)
	);
};

const observer = new MutationObserver((mRecord) => {
	for (const m of mRecord) {
		if (m.type === "childList") {
			// Handle removal
			for (const el of m.removedNodes as Iterable<Registerable>) {
				if (el.nodeType !== 1 || el.isConnected)
					// ELEMENT_NODE = 1
					continue;
				RegEl._registry.get(el)?._dispose?.();
				for (const d of el.querySelectorAll(
					"*"
				) as Iterable<Registerable>) {
					RegEl._registry.get(d)?._dispose?.();
				}
			}
			// Handle incremental registration of added nodes
			if (m.addedNodes.length > 0) {
				_handleNewElements(m.addedNodes);
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

export default class RegEl {
	static _registry = new WeakMap<Registerable, RegEl>();
	static _mutations = new WeakMap<Registerable, Map<string, () => void>>();
	static _viewTransitionsEnabled = false;
	static _initialBufferTimeout: number | null = null;
	#mutations = new Map<string, () => void>();
	#cleanups = new Set<() => void>();
	_el: Registerable;
	_state: Record<string, unknown>;
	_cachedContent?: Registerable;
	_eachEndPtr?: Registerable;
	_eachStart?: Comment;
	_eachEnd?: Comment;
	_eachInstances?: Registerable[];
	_vtClass?: string;

	static _registerOrGet(el: Registerable, state: Record<string, unknown>) {
		return RegEl._registry.get(el) ?? new RegEl(el, state);
	}

	// Helper to reduce view transition boilerplate for callers like :each
	_transition(callback: () => void) {
		const trans =
			RegEl._viewTransitionsEnabled &&
			typeof document !== "undefined" &&
			"startViewTransition" in document &&
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			(document as any).startViewTransition?.(callback);
		if (!trans) {
			callback();
			return null as unknown as { finished: Promise<unknown> } | null;
		}
		return trans as unknown as { finished: Promise<unknown> };
	}

	static _handleExistingElements(storeName?: string) {
		// Process each element individually using the same shared logic
		for (const node of document?.querySelectorAll(
			`[data-mf-register${
				storeName !== undefined && storeName !== null
					? `="${String(storeName)}"`
					: ``
			}]`
		) ?? []) {
			if (node.nodeType !== 1) continue; // ELEMENT_NODE = 1
			const el = node as Element;

			// Use shared registration logic but filter by store name
			const attr = el.getAttribute("data-mf-register");
			if (attr !== null) {
				const candidateStoreName = attr || undefined;
				if (candidateStoreName === storeName) {
					_registerElement(el);
				}
			}
		}

		// Schedule view transitions to be enabled after initial setup
		RegEl._scheduleViewTransitionBuffer();
	}

	static _scheduleViewTransitionBuffer() {
		// Clear any existing timeout
		if (RegEl._initialBufferTimeout) {
			clearTimeout(RegEl._initialBufferTimeout);
		}

		// Enable view transitions after a brief delay to prevent transitions on initial load
		RegEl._initialBufferTimeout = setTimeout(() => {
			RegEl._viewTransitionsEnabled = true;
			RegEl._initialBufferTimeout = null;
		}, 100) as unknown as number; // Brief delay for initial setup
	}

	constructor(el: Registerable, state: Record<string, unknown>) {
		this._state = scopeProxy(state);
		this._el = el;
		RegEl._registry.set(el, this);
		RegEl._mutations.set(el, this.#mutations);
		const attrWasRegistered = new Set<string>();
		const registeredEvents = new Set<string>();

		// If this is a new registration and view transitions aren't enabled yet,
		// schedule the buffer (this handles dynamic element registration)
		if (!RegEl._viewTransitionsEnabled) {
			RegEl._scheduleViewTransitionBuffer();
		}

		// EARLY HANDLE :each to avoid text interpolation on template
		for (const a of Array.from(el.attributes)) {
			const name = a.name;
			const value = a.value;
			const info = getAttrName(name);
			if (!info) continue;
			const { attrName } = info;
			if (attrName === "each") {
				const [exp, rootAlias] = splitAs(value);
				const { _fn } = evaluateExpression(exp);
				this._handleTemplating("each", name, _fn, rootAlias);
				return;
			}
		}

		for (const child of el.children) {
			if (
				!child.getAttribute("data-mf-ignore") &&
				!RegEl._registry.has(child as Registerable)
			) {
				// Cascade overlay so child scopes can see parent aliases
				new RegEl(child as Registerable, this._stateAsRecord());
			}
		}

		// Handle text nodes (template elements used by :each are hidden and preserved; clones get their own effects)
		for (const node of el.childNodes) this._handleTextNode(node);

		// Pre-process transition attributes (support both raw and data-mf-)
		let transitionValue: string | null = null;
		if (el.hasAttribute("transition")) {
			transitionValue = el.getAttribute("transition");
			el.removeAttribute("transition");
		} else if (el.hasAttribute("data-mf-transition")) {
			transitionValue = el.getAttribute("data-mf-transition");
			el.removeAttribute("data-mf-transition");
		}
		if (transitionValue !== null) {
			const prefix = (transitionValue ?? "").trim();
			const rand = Math.random().toString(36).slice(2);
			if (!el.style.viewTransitionName) {
				el.style.viewTransitionName = prefix
					? `${prefix}-${rand}`
					: `mf${rand}`;
			}
			this._vtClass = prefix; // unified class applied to both old/new
		}

		// Handle attributes
		// Snapshot attributes first since we remove them during processing
		for (const a of Array.from(el.attributes)) {
			const name = a.name;
			const value = a.value;
			const attrInfo = getAttrName(name);
			if (!attrInfo) continue;
			const { attrName, sync } = attrInfo;

			if (attrWasRegistered.has(attrName))
				throwError(`Attribute ${attrName} duplicate`, el);

			// Parse out expression and optional alias (for :each)
			const [exp, rootAlias] = splitAs(value);

			// Determine if this is a style value for better expression parsing
			const isStyleValue = attrName.startsWith("style:");

			const { _fn, _syncRef } = evaluateExpression(exp, { isStyleValue });
			const isTemplateRoot = templLogicAttrSet.has(
				attrName as "if" | "each" | "await"
			);
			const isTemplateDependent = dependentLogicAttrSet.has(
				attrName as "elseif" | "else" | "then" | "catch"
			);
			// Note: transition-related handling occurs above (pre-processed)

			// Remove support for :intro and :outro in favor of unified transition

			// Handle special attributes
			if (isTemplateRoot) {
				if (sync)
					throwError(
						`Sync on templating logic: ${attrName}`,
						el,
						true
					);
				this._handleTemplating(
					attrName as templLogicAttr,
					name,
					_fn,
					rootAlias
				);
				attrWasRegistered.add(attrName);
				continue;
			} else if (isTemplateDependent) {
				continue;
			}

			// Handle :transition binding (unified attr)
			if (attrName === "transition") {
				const prefix = (value ?? "").trim();
				if (!el.style.viewTransitionName) {
					const rand = Math.random().toString(36).slice(2);
					el.style.viewTransitionName = prefix
						? `${prefix}-${rand}`
						: `mf${rand}`;
				}
				this._vtClass = prefix || this._vtClass;
			}

			// Handle event bindings
			if (attrName.startsWith("on")) {
				if (sync) throwError(`Sync on event handlers`, el, true);
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
							state: this._state,
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
						_fn({ state: this._state, event: e, element: el });
				}
				el.addEventListener(type, handler);
				registeredEvents.add(type);
				this.#cleanups.add(() => el.removeEventListener(type, handler));
				el.removeAttribute(name);
				attrWasRegistered.add(attrName);
				continue;
			}

			// Handle prop/attribute bindings
			const [attrPropName, attrProp] = attrName.split(":", 2);
			if (attrProp && sync)
				throwError(`Sync on granular bindings: ${attrName}`, el, true);

			const apply = (val: unknown) => {
				if (attrProp) {
					if (attrPropName === "class") {
						if (val) el.classList.add(String(attrProp));
						else el.classList.remove(String(attrProp));
					} else if (attrPropName === "style") {
						const style = (el as HTMLElement).style;
						const prop = String(attrProp);
						// Use setProperty/removeProperty to support hyphenated CSS props
						if (val === false || val == null || val === "")
							style.removeProperty(prop);
						else style.setProperty(prop, String(val));
					} else {
						throwError(`bind ${attrName}`, el, true);
					}
				} else {
					if (attrName in el) {
						if (val !== undefined) {
							// biome-ignore lint/suspicious/noExplicitAny: Unknown element properties
							(el as any)[attrName] = val;
						}
					} else {
						if (val === false || val == null)
							el.removeAttribute(attrName);
						else el.setAttribute(attrName, String(val));
					}
				}
			};

			const ef: Effect = effect(() => {
				const v = _fn({ state: this._state, element: el });
				apply(v);
			});

			// Sync back special cases (only for non-granular bindings)
			if (!attrProp && sync) {
				const capture = () => {
					try {
						const val =
							attrName in el
								? // biome-ignore lint/suspicious/noExplicitAny: Unknown element properties
								  (el as any)[attrName]
								: el.getAttribute(attrName);
						if (_syncRef)
							_syncRef(
								{ state } as unknown as Record<string, unknown>,
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
						(el as HTMLElement).tagName.toLowerCase() === "details")
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

			// Wrap up
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
			if (hasAnyPrefixedAttr(el, ca)) throwError(errorMsg, el);

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
			const render = () => {
				node.textContent = tokens
					.map((t) =>
						t.dynamic
							? t.fn({ state: this._state, element: this._el })
							: t.text
					)
					.join("");
			};
			// Do an immediate render so text appears even before any effect flush
			render();
			const textEffect = effect(render);
			this.#cleanups.add(() => textEffect._stop());
		}
	}

	// Helper to determine if element should be shown
	private _shouldShow(el: Registerable): boolean {
		return Boolean(el.mfshow ?? true) && Boolean(el.mfawait ?? true);
	}

	// Helper to cast state as record
	private _stateAsRecord(): Record<string, unknown> {
		return this._state as unknown as Record<string, unknown>;
	}

	_handleTemplating(
		attrName: templLogicAttr,
		attrTagName: string,
		_fn: (ctx?: Record<string, unknown> | undefined) => unknown,
		eachAlias?: string
	) {
		const isConditional = attrName === "if";
		const isAsync = attrName === "await";
		let ef: Effect;

		if (attrName === "each") {
			ef = handleEach(
				// biome-ignore lint/suspicious/noExplicitAny: temporary for refactoring
				this as any,
				// biome-ignore lint/suspicious/noExplicitAny: temporary for refactoring
				RegEl as any,
				attrTagName,
				_fn,
				throwError,
				eachAlias
			);
		} else if (isConditional || isAsync) {
			const siblings = findDependentSiblings(
				this._el,
				attrName,
				attrTagName
			);
			// Set the function for the root element
			siblings[0].fn = _fn;

			if (isConditional) {
				ef = handleConditional(
					this._state,
					siblings,
					this._updateDisplay.bind(this)
				);
			} else {
				ef = handleAsync(
					this._state,
					siblings,
					// biome-ignore lint/suspicious/noExplicitAny: temporary for refactoring
					RegEl as any,
					this._updateDisplay.bind(this)
				);
			}
		} else {
			throw new Error(`Unknown templating attribute: ${attrName}`);
		}

		this.#cleanups.add(() => ef._stop());
	}

	_updateDisplay(sibs: Pick<Sibling, "el">[]) {
		// Check if any elements will change display state
		const elementsChanging = sibs.filter(({ el }) => {
			const shouldShow = this._shouldShow(el);
			const newDisplay = shouldShow ? "" : "none";
			return el.style.display !== newDisplay;
		});

		if (elementsChanging.length > 0) {
			// Apply unified view-transition-class to both old and new snapshots
			if (this._vtClass) {
				for (const { el } of elementsChanging) {
					(el as HTMLElement).style.setProperty(
						VT_CLASS,
						this._vtClass
					);
				}
			}

			// Give changing siblings a temporary shared name so old/new pair
			const tempName = `mfpair-${Math.random().toString(36).slice(2)}`;
			const prevNames: Array<{ el: HTMLElement; prev: string }> = [];
			for (const { el } of elementsChanging) {
				const hel = el as HTMLElement;
				prevNames.push({ el: hel, prev: hel.style.viewTransitionName });
				hel.style.setProperty(VT_NAME, tempName);
			}

			// Flush styles to ensure properties are applied before capture
			try {
				// biome-ignore lint/style/noUnusedExpressions: intentional reflow
				void (elementsChanging[0]?.el as HTMLElement).offsetWidth;
			} catch {}

			const run = () => {
				for (const { el } of elementsChanging) {
					el.style.display = this._shouldShow(el) ? "" : "none";
				}
			};

			const trans =
				RegEl._viewTransitionsEnabled &&
				document.startViewTransition?.(run);
			const cleanup = () => {
				for (const { el } of elementsChanging) {
					(el as HTMLElement).style.removeProperty(VT_CLASS);
				}
				for (const { el, prev } of prevNames) {
					if (prev) el.style.setProperty(VT_NAME, prev);
					else el.style.removeProperty(VT_NAME);
				}
			};

			if (!trans) {
				run();
				cleanup();
			} else {
				trans.finished.finally(cleanup);
			}
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
