import applyAliasPattern from "./alias-destructure";
import type { WritableCSSKeys } from "./css";
import { type Effect, effect } from "./Effect";
import evaluateExpression, { type ParsedExpression } from "./expression-parser";
import { globalStores } from "./main";
import { indexOfTopLevel, isIdent } from "./parsing-utils";
import { scopeProxy } from "./proxy";

type Registerable = (HTMLElement | SVGElement | MathMLElement) & {
	mfshow?: unknown;
	mfawait?: unknown;
	mfeach?: number;
};

const templLogicAttrs = ["if", "each", "await"] as const;
type templLogicAttr =
	| (typeof templLogicAttrs)[number]
	| "elseif"
	| "else"
	| "then"
	| "catch";
type Sibling = {
	el: Registerable;
	fn: ParsedExpression["_fn"] | null;
	attrName: templLogicAttr;
	alias?: string;
};
const templLogicAttrSet = new Set(templLogicAttrs);
const dependentLogicAttrSet = new Set(["elseif", "else", "then", "catch"]);
const prefixes = [":", "data-mf-"] as const;

// View transition management
type TransitionQueueItem = {
	element: HTMLElement;
	transitionName: string;
	queuedAt: number;
};

const transitionQueue = new Set<TransitionQueueItem>();
let isTransitioning = false;
let pendingTransition: ReturnType<typeof setTimeout> | null = null;

const queueElementForTransition = (el: HTMLElement, transitionName: string) => {
	// Only queue if view transitions are supported
	if (!document.startViewTransition) return;

	transitionQueue.add({
		element: el,
		transitionName,
		queuedAt: Date.now(),
	});

	// Debounce transition execution to batch multiple changes
	if (pendingTransition) {
		clearTimeout(pendingTransition);
	}

	pendingTransition = setTimeout(() => {
		executeQueuedTransition();
	}, 16); // One frame delay to batch changes
};

const executeQueuedTransition = () => {
	if (isTransitioning || transitionQueue.size === 0) return;

	isTransitioning = true;
	transitionQueue.clear();

	// Start view transition
	document
		.startViewTransition(() => {
			// The actual DOM changes have already happened,
			// this just triggers the transition capture
			return Promise.resolve();
		})
		.finished.finally(() => {
			isTransitioning = false;
		});
};

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

// Utility to split on "as" and trim parts
const splitAs = (str: string): string[] =>
	str.split(/\s*as\s*/).map((s) => s.trim());
const throwError = (msg: string, cause: unknown, unsupported = false) => {
	console.error(`${unsupported ? "Unsupported: " : ""}${msg}`, cause);
	throw new Error("Manifold Error");
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
	#mutations = new Map<string, () => void>();
	#cleanups = new Set<() => void>();
	#displayStates = new Map<HTMLElement, boolean>(); // Track previous visibility states
	_el: Registerable;
	_state: Record<string, unknown>;
	_cachedContent?: Registerable;
	_eachEndPtr?: Registerable;
	_eachStart?: Comment;
	_eachEnd?: Comment;
	_eachInstances?: Registerable[];

	static _registerOrGet(el: Registerable, state: Record<string, unknown>) {
		return RegEl._registry.get(el) ?? new RegEl(el, state);
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
	}

	constructor(el: Registerable, state: Record<string, unknown>) {
		this._state = scopeProxy(state);
		this._el = el;
		RegEl._registry.set(el, this);
		RegEl._mutations.set(el, this.#mutations);
		const attrWasRegistered = new Set<string>();
		const registeredEvents = new Set<string>();

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
				new RegEl(
					child as Registerable,
					this._state as unknown as Record<string, unknown>
				);
			}
		}

		// Handle text nodes (template elements used by :each are hidden and preserved; clones get their own effects)
		for (const node of el.childNodes) this._handleTextNode(node);

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

			const { _fn, _syncRef } = evaluateExpression(exp);
			const isTemplateRoot = templLogicAttrSet.has(
				attrName as "if" | "each" | "await"
			);
			const isTemplateDependent = dependentLogicAttrSet.has(
				attrName as "elseif" | "else" | "then" | "catch"
			);

			if (isTemplateDependent || isTemplateRoot) {
				el.style.viewTransitionName ??= `mf${Math.random()
					.toString(36)
					.slice(2)}`;
			}

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
						(el as HTMLElement).style[
							attrProp as WritableCSSKeys
						] = `${val}`;
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

	_handleTemplating(
		attrName: templLogicAttr,
		attrTagName: string,
		_fn: (ctx?: Record<string, unknown> | undefined) => unknown,
		eachAlias?: string
	) {
		const isConditional = attrName === "if";
		const isAsync = attrName === "await";
		let ef: Effect;

		const siblings: Sibling[] = [
			{
				el: this._el,
				attrName,
				fn: _fn,
			},
		];

		this._el.removeAttribute(attrTagName);

		if (attrName === "each") {
			// Cache a pristine template clone for repeated use (without the :each attribute)
			if (!this._cachedContent) {
				const tmpl = this._el.cloneNode(true) as Registerable;
				// Remove the templating attribute so clones don't re-trigger :each handling
				tmpl.removeAttribute(attrTagName);
				this._cachedContent = tmpl;
			}

			// Establish stable start/end anchors and remove the original template element
			if (!this._eachStart || !this._eachEnd) {
				const start = document.createComment(":each-start");
				const end = document.createComment(":each-end");
				const parent = this._el.parentNode;
				if (parent) {
					parent.insertBefore(start, this._el);
					parent.insertBefore(end, this._el.nextSibling);
					// Keep the template element in the DOM but hidden to avoid disposal
					(this._el as HTMLElement).style.display = "none";
				}
				this._eachStart = start;
				this._eachEnd = end;
			}

			this._eachInstances ??= [];

			ef = effect(() => {
				const list =
					(_fn({
						state: this._state,
						element: this._eachStart ?? this._el,
					}) as unknown[] | undefined) ?? [];
				if (!Array.isArray(list)) {
					throwError(`Non-array in :each`, this._el);
				}

				const end = this._eachEnd;
				const parent = end?.parentNode;
				if (!end || !parent) return;

				const instances = this._eachInstances;
				const cur = instances?.length ?? 0;
				const next = list.length;

				// Debug output for diagnosing :each behavior

				const bindEachAliases = (
					inst: RegEl | undefined,
					val: unknown,
					idx: number
				) => {
					if (!inst || !eachAlias) return;
					const alias = eachAlias.trim();
					if (!alias) return;
					const comma = indexOfTopLevel(alias, ",");
					if (comma !== -1) {
						const left = alias.slice(0, comma).trim();
						const right = alias.slice(comma + 1).trim();
						if (left) applyAliasPattern(left, val, inst._state);
						if (right && isIdent(right))
							(inst._state as Record<string, unknown>)[right] =
								idx;
						return;
					}
					if (alias.startsWith("[")) {
						applyAliasPattern(alias, [val, idx], inst._state);
						return;
					}
					if (alias.startsWith("{") || alias.startsWith("[")) {
						applyAliasPattern(alias, val, inst._state);
						return;
					}
					applyAliasPattern(alias, val, inst._state);
				};

				// Update aliases for existing instances (ensures index/value kept in sync)
				const minLen = Math.min(cur, next);
				for (let i = 0; i < minLen; i++) {
					const node = instances?.[i];
					if (!node) continue;
					const childReg = RegEl._registry.get(node);
					if (!childReg) continue;
					bindEachAliases(childReg, list[i], i);
				}

				if (next > cur) {
					const frag = document.createDocumentFragment();
					for (let i = cur; i < next; i++) {
						const clone = this._cachedContent?.cloneNode(
							true
						) as Registerable;
						// Create a per-item overlay state and pre-apply aliases so initial text effects see values
						const childBase = scopeProxy(
							this._state as unknown as Record<string, unknown>
						) as Record<string, unknown>;
						bindEachAliases(
							{ _state: childBase } as unknown as RegEl,
							list[i],
							i
						);
						RegEl._registerOrGet(clone, childBase);
						instances?.push(clone);
						frag.appendChild(clone);
						// Safety: ensure text nodes on the clone are handled if registration did not due to early :each intercept
						try {
							const childReg = RegEl._registry.get(clone);
							if (childReg) {
								for (const n of clone.childNodes)
									childReg._handleTextNode(n);
							}
						} catch {}
					}
					parent.insertBefore(frag, end);
				} else if (next < cur) {
					for (let i = cur - 1; i >= next; i--) {
						const node = instances?.[i];
						instances?.pop();
						node?.remove(); // disposal handled by mutation observer
					}
				}
			});
		} else if (isConditional || isAsync) {
			// Get dependent siblings
			let sib = this._el.nextElementSibling;

			while (sib) {
				// Inline getDependentAttr
				let prefixed: string | null = null;
				let unprefixed: string | null = null;
				for (const p of prefixes) {
					for (const dep of attrName === "await"
						? ["then", "catch"]
						: ["elseif", "else"]) {
						const attr = `${p}${dep}`;
						if (sib.hasAttribute(attr)) {
							prefixed = attr;
							unprefixed = dep;
							break;
						}
					}
					if (prefixed) break;
				}

				if (!unprefixed || !prefixed) break;

				let fn: ParsedExpression["_fn"] | null = null;
				let alias: string | undefined;

				if (unprefixed !== "else") {
					const raw = sib.getAttribute(prefixed) || "";
					const [left, right] = splitAs(raw);
					// For :then/:catch, treat entire value as alias if no 'as' part provided
					if (
						attrName === "await" &&
						(unprefixed === "then" || unprefixed === "catch")
					) {
						alias = right || left || undefined;
						fn = null;
					} else {
						fn = evaluateExpression(left)._fn;
						alias = right || undefined;
					}
				}

				siblings.push({
					el: sib as Registerable,
					attrName: unprefixed as templLogicAttr,
					fn,
					alias,
				});

				sib.removeAttribute(prefixed);
				sib = sib.nextElementSibling;
			}

			// Effect on root and dependents
			let lastPromise: Promise<unknown> | null = null;
			ef = effect(() => {
				if (isConditional) {
					let matched = false;
					for (const { el, fn, attrName } of siblings) {
						el.mfshow = false;
						if (!matched) {
							el.mfshow =
								attrName === "else"
									? true
									: !!fn?.({
											state: this._state,
											element: el,
									  });
							matched = !!el.mfshow;
						}
						this._updateDisplay([{ el }]);
					}
				} else {
					// Async :await / :then / :catch handling
					const root = siblings[0];
					const thenLink = siblings.find(
						(s) => s.attrName === "then"
					);
					const catchLink = siblings.find(
						(s) => s.attrName === "catch"
					);

					// Evaluate expression to obtain maybe-promise
					const result = root.fn?.({
						state: this._state,
						element: root.el,
					});

					const isThenable =
						result &&
						// biome-ignore lint/suspicious/noExplicitAny: explicit any for thenable check
						(typeof (result as any).then === "function" ||
							// biome-ignore lint/suspicious/noExplicitAny: explicit any for thenable check
							typeof (result as any).catch === "function");

					// Reset gating
					root.el.mfawait = isThenable; // show loader
					if (thenLink) thenLink.el.mfawait = !isThenable;
					if (catchLink) catchLink.el.mfawait = false;

					this._updateDisplay(siblings);

					if (!isThenable) {
						// Treat non-promise as immediate success
						root.el.mfawait = false;
						if (thenLink) thenLink.el.mfawait = true;
						// Apply alias pattern for immediate value to then-link's scope
						if (thenLink?.alias) {
							const thenInst = RegEl._registerOrGet(
								thenLink.el,
								this._state
							);
							if (thenInst)
								applyAliasPattern(
									thenLink.alias,
									result,
									thenInst._state
								);
						}
						this._updateDisplay(siblings);
						return;
					}

					if ((result as Promise<unknown>) === lastPromise) return; // avoid duplicating handlers
					lastPromise = result as Promise<unknown>;

					(result as Promise<unknown>).then(
						(_val) => {
							root.el.mfawait = false;
							if (thenLink) thenLink.el.mfawait = true;
							// Destructure aliases for :then value using the sibling's expression string
							if (thenLink?.alias) {
								const thenInst = RegEl._registerOrGet(
									thenLink.el,
									this._state
								);

								if (thenInst)
									applyAliasPattern(
										thenLink.alias,
										_val,
										thenInst._state
									);
							}
							this._updateDisplay(siblings);
						},
						(_err) => {
							root.el.mfawait = false;
							if (catchLink) catchLink.el.mfawait = true;
							if (catchLink?.alias) {
								const catchInst = RegEl._registry.get(
									catchLink.el
								);
								if (catchInst)
									applyAliasPattern(
										catchLink.alias,
										_err,
										catchInst._state
									);
							}
							this._updateDisplay(siblings);
						}
					);
				}
			});
		}

		this.#cleanups.add(() => ef._stop());
	}

	_updateDisplay(sibs: Pick<Sibling, "el">[]) {
		for (const { el } of sibs) {
			const htmlEl = el as HTMLElement;
			const shouldShow = (el.mfshow ?? true) && (el.mfawait ?? true);
			const newDisplay = shouldShow ? "" : "none";

			// Track previous visibility state
			const wasVisible = this.#displayStates.get(htmlEl) ?? true;
			const isVisible = Boolean(shouldShow);

			// Queue for view transition if element is becoming hidden
			if (wasVisible && !isVisible && htmlEl.style.viewTransitionName) {
				queueElementForTransition(
					htmlEl,
					htmlEl.style.viewTransitionName
				);
			}

			// Update display and track new state
			htmlEl.style.display = newDisplay;
			this.#displayStates.set(htmlEl, isVisible);
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
