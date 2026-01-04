import {
	mfDelete,
	mfGet,
	mfHead,
	mfOptions,
	mfPatch,
	mfPost,
	mfPut,
	State,
} from "../main.ts";
import evaluateExpression from "../parsing/expression-parser.ts";
import { splitAs } from "../parsing/util.ts";
import { type Effect, effect } from "../reactivity/effect.ts";
import { scopeProxy } from "../reactivity/proxy.ts";
import { handleAsync } from "./templating/async-handler.ts";
import { handleEach } from "./templating/each-handler.ts";
import { findDependentSiblings } from "./templating/sibling-resolver.ts";
import {
	dependentLogicAttrSet,
	prefixes,
	type Registerable,
	type Sibling,
	type templLogicAttr,
	templLogicAttrSet,
} from "./templating/types.ts";
import {
	areViewTransitionsEnabled,
	ensureViewTransitionName,
	runViewTransition,
	scheduleViewTransitionBuffer,
	type TransitionClassResolver,
	type TransitionElement,
	withTransitionStaging,
} from "./transition.ts";

// Shared registration logic for both new and existing elements
const _registerElement = (el: Element) => {
	const attr = el.getAttribute("data-mf-register");
	if (attr !== null) {
		const storeName = attr || undefined;
		const store = State.globalStores.get(storeName);
		if (store) {
			new RegEl(el as HTMLElement | SVGElement | MathMLElement, store);
			// Remove mf-hidden class after registration
			el.classList.remove("mf-hidden");
		}
	}
};

// Handle incremental registration of new elements
const _handleNewElements = (addedNodes: NodeList) => {
	for (const node of Array.from(addedNodes)) {
		if (node.nodeType !== 1) continue; // ELEMENT_NODE = 1
		const el = node as Element;

		// Check if this element or any descendant needs registration
		const candidates = [
			el,
			...Array.from(el.querySelectorAll("[data-mf-register]")),
		];
		for (const candidate of candidates) {
			_registerElement(candidate);
		}
	}
};

// Inlined conditional handler (was 26 lines in separate file)
const handleConditional = (
	state: Record<string, unknown>,
	siblings: Sibling[],
	updateDisplay: (sibs: Pick<Sibling, "el">[]) => void,
): Effect =>
	effect(() => {
		let matched = false;
		for (const { el, fn, attrName } of siblings) {
			el.mfshow = false;
			if (!matched) {
				el.mfshow = attrName === "else" ? true : !!fn?.({ state, element: el });
				matched = !!el.mfshow;
			}
		}
		updateDisplay(siblings);
	});

// Common context creation helper
const makeContext = (state: Record<string, unknown>, el: Registerable) => {
	const ctx = {
		state,
		element: el,
		$element: el,
		$state: state,
		mfDelete,
		mfGet,
		mfHead,
		mfOptions,
		mfPatch,
		mfPost,
		mfPut,
		__mf_state: state,
	};
	return ctx;
};

const throwError = (msg: string, cause: unknown, unsupported = false) => {
	let hint = "";
	if (cause && typeof Node !== "undefined" && cause instanceof Node) {
		const el = cause as Element;
		if (el && el.nodeType === 1) {
			const tag = el.tagName?.toLowerCase?.() || "element";
			const id = el.id ? `#${el.id}` : "";
			const cls = el.classList?.length
				? `.${Array.from(el.classList).join(".")}`
				: "";
			hint = ` @ <${tag}${id}${cls}>`;
		}
	}
	throw new Error(
		`Manifold: ${unsupported ? "Unsupported: " : ""}${msg}${hint}`,
	);
};

const hasAnyPrefixedAttr = (el: Element, attrName: string): boolean => {
	return (
		el.hasAttribute(`:${attrName}`) || el.hasAttribute(`data-mf-${attrName}`)
	);
};

const observer = new MutationObserver((mRecord) => {
	for (const m of mRecord) {
		if (m.type === "childList") {
			// Handle removal
			for (const el of Array.from(m.removedNodes) as Registerable[]) {
				if (el.nodeType !== 1 || el.isConnected)
					// ELEMENT_NODE = 1
					continue;
				RegEl._registry.get(el)?._dispose?.();
				for (const d of Array.from(
					el.querySelectorAll("*"),
				) as Registerable[]) {
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
	name: string,
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
	_vtClassIn?: string;
	_vtClassOut?: string;

	static _registerOrGet(el: Registerable, state: Record<string, unknown>) {
		return RegEl._registry.get(el) ?? new RegEl(el, state);
	}

	// Helper to reduce view transition boilerplate for callers like :each
	_transition(callback: () => void) {
		return runViewTransition(callback);
	}

	static _handleExistingElements(storeName?: string) {
		// Process each element individually using the same shared logic
		for (const node of Array.from(
			document?.querySelectorAll(
				`[data-mf-register${
					storeName !== undefined && storeName !== null
						? `="${String(storeName)}"`
						: ``
				}]`,
			) ?? [],
		)) {
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
		scheduleViewTransitionBuffer();
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
		if (!areViewTransitionsEnabled()) {
			scheduleViewTransitionBuffer();
		}

		// ═══════════════════════════════════════════════════════════════
		// TEMPLATE LOGIC EXECUTION ORDER
		// ═══════════════════════════════════════════════════════════════
		// Template logic attributes are processed in priority order to ensure
		// proper variable scoping:
		//
		// 1. :each - Creates loop variables (e.g., "item"), treats element as
		//    template. Must return early to prevent content interpolation.
		//
		// 2. :await - Async evaluation, creates promise context. Processed
		//    before conditionals so they can reference async results.
		//
		// 3. :if/:elseif/:else - Conditionals that use variables from :each
		//    or :await blocks. Processed last in main attribute loop.
		//
		// Note: :then/:catch create variables via destructuring (like :each),
		// but they're dependent attributes tied to :await siblings, not roots.
		// ═══════════════════════════════════════════════════════════════

		// EARLY HANDLE :each to avoid text interpolation on template
		// :each must be handled first as it treats element as a template
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

		for (const child of Array.from(el.children)) {
			if (
				!child.getAttribute("data-mf-ignore") &&
				!RegEl._registry.has(child as Registerable)
			) {
				// Cascade overlay so child scopes can see parent aliases
				new RegEl(child as Registerable, this._stateAsRecord());
			}
		}

		// Handle text nodes (template elements used by :each are hidden and preserved; clones get their own effects)
		for (const node of Array.from(el.childNodes)) this._handleTextNode(node);

		// Handle attributes in priority order for template logic
		// Priority: 1. :await (async evaluation, establishes promise context)
		//          2. :if (conditionals, uses established context)
		//          3. Other attributes
		const attributes = Array.from(el.attributes);
		const templateRootOrder = ["await", "if"] as const;

		// Process template roots in priority order first
		for (const priorityAttr of templateRootOrder) {
			for (const a of attributes) {
				const name = a.name;
				const value = a.value;
				const attrInfo = getAttrName(name);
				if (!attrInfo) continue;
				const { attrName, sync } = attrInfo;

				if (attrName !== priorityAttr) continue;
				if (attrWasRegistered.has(attrName))
					throwError(`Attr ${attrName} duplicate`, el);

				const [exp, rootAlias] = splitAs(value);
				if (sync) throwError(`Sync on template logic: ${attrName}`, el, true);
				const { _fn } = evaluateExpression(exp);
				this._handleTemplating(
					attrName as templLogicAttr,
					name,
					_fn,
					rootAlias,
				);
				attrWasRegistered.add(attrName);
			}
		}

		// Then process all other attributes
		for (const a of attributes) {
			const name = a.name;
			const value = a.value;
			const attrInfo = getAttrName(name);
			if (!attrInfo) continue;
			const { attrName, sync } = attrInfo;

			if (attrWasRegistered.has(attrName)) continue; // Already processed

			// Parse out expression and optional alias (for :each)
			const [exp] = splitAs(value);

			// Determine if this is a style value for better expression parsing
			const isStyleValue = attrName.startsWith("style:");

			const allowAssignments = attrName.startsWith("on");
			const { _fn, _syncRef } = evaluateExpression(exp, {
				isStyleValue,
				allowAssignments,
			});
			const isTemplateRoot = templLogicAttrSet.has(
				attrName as "if" | "each" | "await",
			);
			const isTemplateDependent = dependentLogicAttrSet.has(
				attrName as "elseif" | "else" | "then" | "catch",
			);

			// Handle special attributes
			if (isTemplateRoot) {
				// Template roots should have been handled in priority order above
				// If we reach here, something went wrong
				throwError(
					`Template root ${attrName} should be handled in early processing`,
					el,
					true,
				);
			} else if (isTemplateDependent) {
				continue;
			}

			// Handle event bindings
			if (attrName.startsWith("on")) {
				if (sync) throwError(`Sync on events`, el, true);
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
					const bodyParsed = evaluateExpression(bodyExpr, {
						allowAssignments: true,
					});
					handler = (e: Event) => {
						const ctx = {
							...makeContext(this._state, el),
							event: e,
							$state: this._state,
							$element: el,
						} as Record<string, unknown>;
						if (params[0]) ctx[params[0]] = e;
						if (params[1]) ctx[params[1]] = this._state;
						if (params[2]) ctx[params[2]] = el;
						bodyParsed._fn(ctx);
					};
				} else {
					handler = (e: Event) =>
						_fn({
							...makeContext(this._state, el),
							event: e,
							$state: this._state,
							$element: el,
						});
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
				throwError(`Sync on granular bind: ${attrName}`, el, true);

			// Handle transition attributes specially
			if (
				attrName === "transition" ||
				attrName === "transition-in" ||
				attrName === "transition-out"
			) {
				const ef: Effect = effect(() => {
					const prefix = String(_fn(makeContext(this._state, el)) ?? "").trim();
					ensureViewTransitionName(el as HTMLElement, prefix);
					if (attrName === "transition") {
						this._vtClass = prefix || this._vtClass;
					} else if (attrName === "transition-in") {
						this._vtClassIn = prefix || this._vtClassIn;
					} else if (attrName === "transition-out") {
						this._vtClassOut = prefix || this._vtClassOut;
					}
				});
				this.#cleanups.add(() => ef._stop());
				el.removeAttribute(name);
				attrWasRegistered.add(attrName);
				continue;
			}

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
						throwError(`Bind ${attrName}`, el, true);
					}
				} else {
					// For standard DOM properties, set the property
					// For custom attributes, set the attribute
					const isProperty =
						attrName in el &&
						!(
							attrName.includes("-") ||
							attrName.startsWith("data") ||
							attrName.startsWith("aria")
						);
					if (isProperty) {
						if (val !== undefined) {
							// biome-ignore lint/suspicious/noExplicitAny: Unknown element properties
							(el as any)[attrName] = val;
						}
					} else {
						if (val === false || val == null) el.removeAttribute(attrName);
						else el.setAttribute(attrName, String(val));
					}
				}
			};

			const ef: Effect = effect(() => {
				const v = _fn(makeContext(this._state, el));
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
								val as unknown,
							);
						else (state as Record<string, unknown>)[attrName] = val as unknown;
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
							capture as EventListener,
						),
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
		handler: EventListener,
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

		const errorMsg = `sync:${attrName} conflicts with :${conflictAttrs.join(
			" or :",
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
					const { _fn: fn } = evaluateExpression(part.slice(2, -1).trim());
					return { dynamic: true as const, fn };
				}
				return { dynamic: false as const, text: part };
			});
			const render = () => {
				node.textContent = tokens
					.map((t) =>
						t.dynamic ? t.fn(makeContext(this._state, this._el)) : t.text,
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
		eachAlias?: string,
	) {
		const ef =
			attrName === "each"
				? handleEach(
						// biome-ignore lint/suspicious/noExplicitAny: temporary for refactoring
						this as any,
						// biome-ignore lint/suspicious/noExplicitAny: temporary for refactoring
						RegEl as any,
						attrTagName,
						_fn,
						throwError,
						eachAlias,
					)
				: (() => {
						const siblings = findDependentSiblings(
							this._el,
							attrName,
							attrTagName,
						);
						siblings[0].fn = _fn;
						return attrName === "if"
							? handleConditional(
									this._state,
									siblings,
									this._updateDisplay.bind(this),
								)
							: handleAsync(
									this._state,
									siblings,
									// biome-ignore lint/suspicious/noExplicitAny: temporary for refactoring
									RegEl as any,
									this._updateDisplay.bind(this),
								);
					})();

		this.#cleanups.add(() => ef._stop());
	}

	// Small helper to stage unified view-transition styling, run update, and cleanup
	private _withTransitionStaging(
		nodes: Registerable[],
		run: () => void,
		appearing?: boolean[],
	) {
		const elements = nodes.map((n) => n as HTMLElement);

		// Determine which class to use based on whether elements are appearing or disappearing
		let vtClass: TransitionClassResolver | undefined;

		if (this._vtClassIn || this._vtClassOut) {
			// Use separate in/out classes if defined
			vtClass = (_el: TransitionElement, idx: number) => {
				const isAppearing = appearing?.[idx] ?? true;
				return isAppearing ? this._vtClassIn : this._vtClassOut;
			};
		} else {
			// Fall back to unified class
			vtClass = this._vtClass;
		}

		withTransitionStaging(elements, run, vtClass, (cb) => this._transition(cb));
	}

	_updateDisplay(sibs: Pick<Sibling, "el">[]) {
		// Check if any elements will change display state
		const elementsChanging = sibs.filter(({ el }) => {
			const shouldShow = this._shouldShow(el);
			const newDisplay = shouldShow ? "" : "none";
			return el.style.display !== newDisplay;
		});

		if (elementsChanging.length > 0) {
			// Track which elements are appearing vs disappearing
			const appearing = elementsChanging.map(({ el }) => this._shouldShow(el));

			const run = () => {
				for (const { el } of elementsChanging) {
					el.style.display = this._shouldShow(el) ? "" : "none";
				}
			};

			// Stage VT properties, run within transition, and cleanup
			this._withTransitionStaging(
				elementsChanging.map(({ el }) => el),
				run,
				appearing,
			);
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
