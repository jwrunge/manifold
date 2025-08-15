import { Effect } from "./Effect.ts";
import evaluateExpression from "./expression-parser.ts";

// Lightweight effect helper
const runEffect = (fn: () => void) => {
	const e = new Effect(fn);
	e.run();
	return e;
};

// Path helpers
const getPath = (obj: unknown, path: string[]): unknown => {
	let cur: unknown = obj;
	for (const k of path) {
		if (cur == null || typeof cur !== "object") return undefined;
		cur = (cur as Record<string, unknown>)[k];
	}
	return cur;
};
const setPath = (obj: unknown, path: string[], value: unknown) => {
	let cur: unknown = obj;
	for (let i = 0; i < path.length - 1; i++) {
		if (cur == null || typeof cur !== "object") return;
		cur = (cur as Record<string, unknown>)[path[i]];
	}
	if (cur && typeof cur === "object")
		(cur as Record<string, unknown>)[path[path.length - 1]] = value;
};

// Alias extraction
interface ParsedExprMeta {
	clean: string;
	aliases: Record<string, string[]>;
}
const aliasRegex =
	/@([a-zA-Z_$][\w$]*(?:\.[a-zA-Z_$][\w$]*)*)\s+as\s+([a-zA-Z_$][\w$]*)/g;
const extractAliases = (raw: string): ParsedExprMeta => {
	const aliases: Record<string, string[]> = {};
	let clean = raw;
	let m: RegExpExecArray | null = aliasRegex.exec(raw);
	while (m) {
		const full = m[0];
		const path = m[1];
		const alias = m[2];
		if (path && alias) {
			aliases[alias] = path.split(".");
			clean = clean.replace(full, alias);
		}
		m = aliasRegex.exec(raw);
	}
	aliasRegex.lastIndex = 0;
	clean = clean.replace(/@([a-zA-Z_$][\w$]*)/g, "$1");
	return { clean: clean.trim(), aliases };
};

// Build context
const buildCtx = (
	aliases: Record<string, string[]>,
	stateRef: Record<string, unknown> | undefined,
	extra?: Record<string, unknown>
) => {
	const ctx: Record<string, unknown> = extra ? { ...extra } : {};
	// Resolve alias paths against either injected extra context (loop/async vars) or state
	for (const [alias, path] of Object.entries(aliases)) {
		if (!path.length) {
			ctx[alias] = undefined;
			continue;
		}
		const rootKey = path[0];
		let base: Record<string, unknown> | undefined;
		if (extra && Object.hasOwn(extra, rootKey)) {
			base = extra as Record<string, unknown>;
		} else if (stateRef && Object.hasOwn(stateRef, rootKey)) {
			base = stateRef;
		} else {
			// Fallback: attempt state first
			base = stateRef;
		}
		ctx[alias] = getPath(base, path);
	}
	ctx.__state = stateRef;
	return ctx;
};

// Flags
const isConditionalAttr = (n: string) =>
	n === "data-if" || n === "data-elseif" || n === "data-else";
const isAsyncAttr = (n: string) =>
	n === "data-await" || n === "data-then" || n === "data-catch";
const isEachAttr = (n: string) => n === "data-each";

interface EachItem {
	el: HTMLElement;
	key: unknown;
}

// Debug symbol for attaching state reference to root registered elements
const STATE_SYM = Symbol.for("mf.state");

export class RegEl {
	static #registry = new WeakMap<Element, RegEl>();
	static #delegated = false;
	// Maintain strong refs only in debug mode; guarded to avoid memory leaks in production usage.
	static #all = new Set<RegEl>();
	static #ensureDelegation() {
		if (RegEl.#delegated) return;
		RegEl.#delegated = true;
		document.addEventListener(
			"click",
			(e) => {
				const target = e.target as HTMLElement | null;
				if (!target) return;
				let el: HTMLElement | null = target;
				while (el) {
					if (
						el.hasAttribute(":onclick") &&
						!RegEl.#registry.has(el)
					) {
						let cur: HTMLElement | null = el.parentElement;
						while (cur) {
							const inst = RegEl.#registry.get(cur);
							if (inst && (inst as RegEl).#state) {
								RegEl.register(
									el,
									(inst as RegEl).#state as Record<
										string,
										unknown
									>
								);
								break;
							}
							cur = cur.parentElement;
						}
					}
					el = el.parentElement;
				}
			},
			true
		);
	}
	static register(
		el: HTMLElement | SVGElement | MathMLElement,
		state: Record<string, unknown>
	) {
		const existing = RegEl.#registry.get(el);
		return existing || new RegEl(el, state);
	}
	static isRegistered(el: Element) {
		return RegEl.#registry.has(el);
	}

	#el: HTMLElement | SVGElement | MathMLElement;
	#state?: Record<string, unknown>;
	#showExpr?: ReturnType<typeof evaluateExpression>;
	#showAliases: Record<string, string[]> = {};
	#awaitExpr?: ReturnType<typeof evaluateExpression>;
	#awaitAliases: Record<string, string[]> = {};
	#eachExpr?: ReturnType<typeof evaluateExpression>;
	#eachAliases: Record<string, string[]> = {};
	#eachItemAlias = "item";
	#eachKeyAlias = "index";
	#eachClones: EachItem[] = [];
	#awaitPending = false;
	#effects: Effect[] = [];

	constructor(
		el: HTMLElement | SVGElement | MathMLElement,
		state: Record<string, unknown>
	) {
		try {
			console.log(
				"[mf][RegEl:create]",
				el.tagName,
				(el as HTMLElement).id || "(no id)",
				"attrs",
				Array.from(el.attributes).map((a) => a.name + ":" + a.value)
			);
		} catch {}
		this.#el = el;
		this.#state = state;
		RegEl.#registry.set(el, this);
		// Attach debug state reference on the element (root) for inspection
		try {
			(this.#el as unknown as Record<string, unknown>)[
				STATE_SYM as unknown as string
			] = state;
		} catch {}
		const gg = globalThis as unknown as Record<string, unknown>;
		if (gg?.MF_DEBUG || gg?.MF_TRACE || gg?.MF_DEV_DEBUG)
			RegEl.#all.add(this);
		this.#processAttributes();
		this.#setupConditionals();
		this.#setupAwait();
		// Initialize :each (loop) handling for this element if present
		this.#setupEach();
		// Register descendant elements (unless this element itself is an :each template; clones will register themselves)
		if (
			!this.#el.hasAttribute("data-each") &&
			!this.#el.hasAttribute(":each") &&
			this.#state
		) {
			const stateRef = this.#state;
			const shouldRegister = (node: Element) => {
				if (node === this.#el) return false;
				for (const attr of Array.from(node.attributes)) {
					if (attr.name.startsWith(":")) return true;
					if (
						attr.name === "data-if" ||
						attr.name === "data-elseif" ||
						attr.name === "data-else" ||
						attr.name === "data-await" ||
						attr.name === "data-then" ||
						attr.name === "data-catch" ||
						attr.name === "data-each"
					)
						return true;
				}
				return false;
			};
			const walk = (node: Element) => {
				for (const child of Array.from(node.children)) {
					const elChild = child as HTMLElement;
					if (elChild.hasAttribute("data-mf-ignore")) continue; // boundary break
					if (elChild.hasAttribute("data-mf-register")) continue; // separate registration root
					if (
						shouldRegister(elChild) &&
						!RegEl.isRegistered(elChild)
					) {
						RegEl.register(elChild, stateRef);
					}
					// Recurse only if not a new registration root
					walk(elChild);
				}
			};
			walk(this.#el);
		}
		// Process this element's own text nodes for interpolation (skip if flagged)
		if (!this.#el.hasAttribute("data-mf-skip-text"))
			this.#traverseText(this.#el);
	}

	dispose() {
		for (const e of this.#effects) e.stop();
		this.#effects.length = 0;
		RegEl.#registry.delete(this.#el);
	}
	// Debug helpers
	static debugEntries() {
		return Array.from(RegEl.#all).map((r) => ({
			el: r.#el,
			tag: r.#el.tagName,
			id: (r.#el as HTMLElement).id || "",
			stateKeys: r.#state ? Object.keys(r.#state) : [],
			hasOnclick: r.#el.hasAttribute(":onclick"),
			addr: (() => {
				try {
					const maybe = r.#state as
						| Record<string, unknown>
						| undefined;
					return (maybe && (maybe["__mfId"] as unknown)) || undefined;
				} catch {
					return undefined;
				}
			})(),
		}));
	}
	static getState(el: Element) {
		const inst = RegEl.#registry.get(el);
		return inst
			? inst.#state
			: (el as unknown as Record<string, unknown>)[
					STATE_SYM as unknown as string
			  ];
	}
	#addEffect(fn: () => void) {
		const e = runEffect(fn);
		this.#effects.push(e);
		return e;
	}

	#processAttributes() {
		for (const attr of Array.from(this.#el.attributes)) {
			const { name, value } = attr;
			const g = globalThis as unknown as Record<string, unknown>;
			if (g?.MF_TRACE) {
				try {
					console.log(
						"[mf][attr]",
						name,
						"=",
						value,
						"on",
						this.#el.tagName,
						"#",
						(this.#el as HTMLElement).id || "(no id)"
					);
				} catch {}
			}
			if (name.startsWith(":")) {
				if (name === ":onclick") RegEl.#ensureDelegation();
				const bindName = name.slice(1);
				if (
					[
						"if",
						"elseif",
						"else",
						"await",
						"then",
						"catch",
						"each",
					].includes(bindName)
				) {
					const mapped = `data-${bindName}`;
					// Mirror colon conditionals to data-* attributes so sibling chains (if/elseif/else) are detectable consistently
					if (
						["if", "elseif"].includes(bindName) &&
						!this.#el.hasAttribute(mapped)
					) {
						// Wrap expression as ${...} to reuse existing data-* parsing logic paths if needed elsewhere
						this.#el.setAttribute(mapped, `\${${value.trim()}}`);
					}
					if (bindName === "else" && !this.#el.hasAttribute(mapped)) {
						this.#el.setAttribute(mapped, "");
					}
					if (
						bindName === "each" &&
						!this.#el.hasAttribute("data-each")
					) {
						// Mirror to data-each so tests selecting :not([data-each]) exclude template
						this.#el.setAttribute(
							"data-each",
							`\${${value.trim()}}`
						);
					}
					if (["if", "elseif", "else"].includes(bindName))
						this.#parseShow(mapped, value.trim());
					else if (["await", "then", "catch"].includes(bindName))
						this.#parseAsync(mapped, value.trim());
					else if (bindName === "each") {
						this.#parseEach(value.trim());
						for (const child of Array.from(this.#el.children))
							if (this.#state)
								RegEl.register(
									child as HTMLElement,
									this.#state
								);
					}
					continue;
				}
				if (bindName.startsWith("on")) {
					this.#bindEvent(bindName.slice(2), value.trim());
					continue;
				}
				this.#bindProp(bindName, value.trim());
				continue;
			}
			if (
				isConditionalAttr(name) ||
				isAsyncAttr(name) ||
				isEachAttr(name)
			) {
				let inner = value;
				if (name === "data-then" || name === "data-catch")
					inner = value.trim();
				else {
					if (!value.startsWith("${") || !value.endsWith("}"))
						continue;
					inner = value.slice(2, -1);
				}
				if (isConditionalAttr(name)) this.#parseShow(name, inner);
				else if (isAsyncAttr(name)) this.#parseAsync(name, inner);
				else if (isEachAttr(name)) {
					this.#parseEach(inner);
					for (const child of Array.from(this.#el.children))
						if (this.#state)
							RegEl.register(child as HTMLElement, this.#state);
				}
			}
		}
	}

	#bindEvent(evt: string, raw: string) {
		const g = globalThis as unknown as Record<string, unknown>;
		let exprRaw = raw;
		let injectedParam: string | undefined;
		const arrowBlock = exprRaw.match(
			/^(?:\(\s*([a-zA-Z_$][\w$]*)?\s*\)|([a-zA-Z_$][\w$]*))\s*=>\s*\{([\s\S]*)\}$/
		);
		if (arrowBlock) {
			injectedParam = arrowBlock[1] || arrowBlock[2] || undefined;
			exprRaw = arrowBlock[3].replace(/\}\s*$/m, "").trim();
		}
		const statements: string[] = [];
		{
			let depthP = 0,
				depthB = 0;
			let quote = "";
			let last = 0;
			for (let i = 0; i < exprRaw.length; i++) {
				const c = exprRaw[i];
				if (quote) {
					if (c === quote && exprRaw[i - 1] !== "\\") quote = "";
					continue;
				}
				if (c === '"' || c === "'" || c === "`") {
					quote = c;
					continue;
				}
				if (c === "(") depthP++;
				else if (c === ")") depthP--;
				else if (c === "[") depthB++;
				else if (c === "]") depthB--;
				if (c === ";" && depthP === 0 && depthB === 0) {
					const seg = exprRaw.slice(last, i).trim();
					if (seg) statements.push(seg);
					last = i + 1;
				}
			}
			const tail = exprRaw.slice(last).trim();
			if (tail) statements.push(tail);
		}
		if (!statements.length) statements.push(exprRaw);
		interface ParsedStmt {
			parsed: ReturnType<typeof evaluateExpression>;
			aliases: Record<string, string[]>;
		}
		const parsedStmts: ParsedStmt[] = statements.map((stmt) => {
			const { clean, aliases } = extractAliases(stmt);
			// Detect assignment including dotted and bracket index chains on LHS (e.g., obj.prop[expr].val = ...)
			// We conservatively look for a valid chain followed by a single '=' not part of '==' or '==='.
			const assignChainPattern =
				/^[a-zA-Z_$][\w$]*(?:\s*(?:\.[a-zA-Z_$][\w$]*|\[[^\]]+\]))*\s*=[^=]/;
			const assign = assignChainPattern.test(clean);
			const toParse = assign ? `(()=> ${clean})` : clean;
			return { parsed: evaluateExpression(toParse), aliases };
		});
		try {
			console.log(
				"[mf][attach-event]",
				evt,
				"on",
				this.#el.tagName,
				(this.#el as HTMLElement).id || "(no id)"
			);
		} catch {}
		try {
			console.log("[mf][event-expr]", evt, "stmts:", statements);
		} catch {}
		const handler = (event: Event) => {
			try {
				if (g?.MF_TRACE) {
					try {
						console.log("[mf][event:invoke]", evt, statements);
					} catch {}
				}
				for (const { parsed, aliases } of parsedStmts) {
					const extra: Record<string, unknown> = { event };
					if (injectedParam) extra[injectedParam] = event;
					parsed.fn(buildCtx(aliases, this.#state, extra));
				}
			} catch (err) {
				try {
					console.error("[mf][event:error]", evt, err);
				} catch {}
			}
		};
		(this.#el as HTMLElement).addEventListener(evt, handler);
	}

	#parseShow(attr: string, raw: string) {
		const { clean, aliases } = extractAliases(raw);
		this.#showAliases = aliases;
		if (attr === "data-else") {
			this.#showExpr = undefined;
			return;
		}
		this.#showExpr = evaluateExpression(clean);
	}
	#parseAsync(attr: string, raw: string) {
		if (attr === "data-await") {
			const { clean, aliases } = extractAliases(raw);
			this.#awaitAliases = aliases;
			this.#awaitExpr = evaluateExpression(clean);
			this.#awaitPending = true;
		} else if (attr === "data-then") {
			// Variable name extracted on demand from attribute later
		} else if (attr === "data-catch") {
			// Variable name extracted on demand from attribute later
		}
	}
	#parseEach(raw: string) {
		const { clean, aliases } = extractAliases(raw);
		this.#eachAliases = aliases;
		let expr = clean;
		const m = clean.match(
			/^(.*?)\s+as\s+([a-zA-Z_$][\w$]*)(?:\s*,\s*([a-zA-Z_$][\w$]*))?$/
		);
		if (m) {
			expr = m[1].trim();
			this.#eachItemAlias = m[2];
			if (m[3]) this.#eachKeyAlias = m[3];
		}
		this.#eachExpr = evaluateExpression(expr);
	}

	#bindProp(name: string, raw: string) {
		if (name === "selectedindex") name = "selectedIndex";
		const [bindingPart, syncPartRaw] = raw.split(">>");
		const { clean, aliases } = extractAliases(bindingPart);
		const bindingExpr = evaluateExpression(clean);
		const syncPart = syncPartRaw?.trim();
		let syncExpr: ReturnType<typeof evaluateExpression> | undefined;
		let syncParam: string | undefined;
		let assignPath: string[] | undefined;
		if (syncPart !== undefined) {
			if (syncPart === "") {
				const chain = clean.match(
					/^[a-zA-Z_$][\w$]*(?:\.[a-zA-Z_$][\w$]*)*$/
				);
				if (chain) assignPath = clean.split(".");
			} else {
				const arrow = syncPart.match(
					/^\(\s*([a-zA-Z_$][\w$]*)\s*\)\s*=>/
				);
				if (arrow) syncParam = arrow[1];
				const { clean: syncClean, aliases: syncAliases } =
					extractAliases(syncPart);
				syncExpr = evaluateExpression(syncClean);
				Object.assign(aliases, syncAliases);
			}
		}
		let last: unknown;
		this.#addEffect(() => {
			const v = bindingExpr.fn(buildCtx(aliases, this.#state));
			if (v !== last) {
				const g = globalThis as unknown as Record<string, unknown>;
				if (g?.MF_TRACE) {
					try {
						console.log(
							"[mf][prop]",
							name,
							"=",
							v,
							"on",
							this.#el.tagName,
							(this.#el as HTMLElement).id || "(no id)"
						);
					} catch {}
				}
				last = v;
				this.#setProp(name, v);
			}
		});
		if (["value", "checked", "selectedIndex"].includes(name)) {
			const evt = name === "value" ? "input" : "change";
			(this.#el as HTMLElement).addEventListener(evt, () => {
				const elObj: Record<string, unknown> = this
					.#el as unknown as Record<string, unknown>;
				let newVal = elObj[name];
				if (
					name === "value" &&
					this.#el instanceof HTMLInputElement &&
					this.#el.type === "number"
				) {
					const num = Number(newVal as string);
					if (!Number.isNaN(num)) newVal = num;
				}
				if (assignPath && this.#state)
					setPath(this.#state, assignPath, newVal);
				else if (syncExpr) {
					const ctx = buildCtx(
						aliases,
						this.#state,
						syncParam ? { [syncParam]: newVal } : undefined
					);
					syncExpr.fn(ctx);
				}
			});
		}
	}

	#setupConditionals() {
		const isIf = this.#el.hasAttribute("data-if");
		const isElseIf = this.#el.hasAttribute("data-elseif");
		const isElse = this.#el.hasAttribute("data-else");
		if (!(isIf || isElseIf || isElse)) return;
		if (isElse) {
			this.#addEffect(() => {
				const prev = this.#collectPrevShows();
				this.#el.style.display = prev.some(Boolean) ? "none" : "";
			});
			return;
		}
		if (isElseIf) {
			this.#addEffect(() => {
				const prev = this.#collectPrevShows();
				const cur = this.#evalShow();
				this.#el.style.display =
					prev.some(Boolean) || !cur ? "none" : "";
			});
			return;
		}
		if (this.#showExpr) {
			this.#addEffect(() => {
				const v = this.#evalShow();
				this.#el.style.display = v ? "" : "none";
			});
		}
	}
	#collectPrevShows(): boolean[] {
		const out: boolean[] = [];
		let prev = this.#el.previousElementSibling;
		while (prev) {
			if (
				prev.hasAttribute("data-if") ||
				prev.hasAttribute("data-elseif")
			) {
				const reg = RegEl.#registry.get(prev);
				if (reg && (reg as RegEl).#showExpr)
					out.unshift(!!(reg as RegEl).#evalShow());
				if (prev.hasAttribute("data-if")) break;
			}
			prev = prev.previousElementSibling;
		}
		return out;
	}
	#evalShow() {
		return this.#showExpr
			? this.#showExpr.fn(buildCtx(this.#showAliases, this.#state))
			: false;
	}

	#setupAwait() {
		if (!this.#awaitExpr) return;
		const baseDisplay = this.#el.style.display;
		// Initial hide of then/catch siblings (handle both colon ':' and normalized data-* forms)
		const parent = this.#el.parentElement;
		const allSibs = Array.from(parent?.children || []);
		for (const sib of allSibs) {
			if (
				sib.hasAttribute("data-then") ||
				sib.hasAttribute("data-catch") ||
				sib.hasAttribute(":then") ||
				sib.hasAttribute(":catch")
			) {
				(sib as HTMLElement).style.display = "none";
				// Prevent initial text interpolation (no value yet)
				sib.setAttribute("data-mf-skip-text", "");
			}
		}
		this.#addEffect(() => {
			const expr = this.#awaitExpr;
			if (!expr) return;
			const p = expr.fn(buildCtx(this.#awaitAliases, this.#state));
			// Accept any thenable (addresses potential cross-realm Promise issues in test environment)
			if (!p || typeof (p as { then?: unknown }).then !== "function")
				return;
			this.#awaitPending = true;
			// Re-hide any then/catch branches for new pending promise (preserve skip-text until injection)
			for (const sib of Array.from(parent?.children || []))
				if (
					sib.hasAttribute("data-then") ||
					sib.hasAttribute("data-catch") ||
					sib.hasAttribute(":then") ||
					sib.hasAttribute(":catch")
				) {
					(sib as HTMLElement).style.display = "none";
					if (!sib.hasAttribute("data-mf-skip-text"))
						sib.setAttribute("data-mf-skip-text", "");
				}
			this.#el.style.display = ""; // show loading block
			Promise.resolve(p)
				.then((res) =>
					this.#handlePromiseResult(res, true, baseDisplay)
				)
				.catch((err) =>
					this.#handlePromiseResult(err, false, baseDisplay)
				);
		});
	}
	#handlePromiseResult(val: unknown, ok: boolean, base: string) {
		if (!this.#awaitPending) return;
		this.#awaitPending = false;
		this.#el.style.display = "none";
		const sibs = Array.from(this.#el.parentElement?.children || []);
		// Hide all then/catch before showing the chosen one
		for (const sib of sibs)
			if (
				sib.hasAttribute("data-then") ||
				sib.hasAttribute("data-catch") ||
				sib.hasAttribute(":then") ||
				sib.hasAttribute(":catch")
			)
				(sib as HTMLElement).style.display = "none";
		for (const sib of sibs) {
			if (
				ok &&
				(sib.hasAttribute("data-then") || sib.hasAttribute(":then"))
			) {
				const varName =
					sib.getAttribute("data-then") ||
					sib.getAttribute(":then") ||
					"value";
				this.#injectThenCatch(sib as HTMLElement, varName, val, base);
				break;
			} else if (
				!ok &&
				(sib.hasAttribute("data-catch") || sib.hasAttribute(":catch"))
			) {
				const varName =
					sib.getAttribute("data-catch") ||
					sib.getAttribute(":catch") ||
					"err";
				this.#injectThenCatch(sib as HTMLElement, varName, val, base);
				break;
			}
		}
	}
	#injectThenCatch(
		el: HTMLElement,
		varName: string,
		value: unknown,
		base: string
	) {
		el.style.display = base;
		el.removeAttribute("data-mf-skip-text");
		// Dispose existing registration (if any) to avoid duplicate effects
		const existing = RegEl.#registry.get(el);
		(existing as RegEl | undefined)?.dispose();
		if (this.#state) RegEl.register(el, this.#state);
		this.#traverseText(el, { [varName]: value });
	}

	#setupEach() {
		if (!this.#eachExpr) return;
		const template = this.#el;
		const parent = template.parentElement;
		if (!parent) return;
		const templateHTML = template.innerHTML; // pristine HTML for fresh clones
		template.style.display = "none";
		// Mark template to skip its own text interpolation (placeholders kept for clones)
		template.setAttribute("data-mf-skip-text", "");
		// Synchronous initial build so items render immediately on registration (before any effect/microtask)
		const initialCtx = buildCtx(this.#eachAliases, this.#state);
		const initialArr = this.#eachExpr?.fn(initialCtx);
		if (Array.isArray(initialArr) && this.#eachClones.length === 0) {
			try {
				console.log(
					"[mf][each:init-sync]",
					"template",
					template.tagName,
					"count",
					initialArr.length
				);
			} catch {}
			interface NewItem {
				key: unknown;
				value: unknown;
				index: number;
			}
			const newItems: NewItem[] = [];
			for (let i = 0; i < initialArr.length; i++) {
				const value = initialArr[i];
				let key: unknown = i;
				if (
					value &&
					typeof value === "object" &&
					this.#eachKeyAlias in (value as Record<string, unknown>)
				) {
					key = (value as Record<string, unknown>)[
						this.#eachKeyAlias
					];
				}
				newItems.push({ key, value, index: i });
			}
			let last: Node = template;
			for (const item of newItems) {
				try {
					console.log(
						"[mf][each:init-sync:clone]",
						"index",
						item.index,
						"key",
						item.key,
						"value",
						item.value
					);
				} catch {}
				const el = document.createElement(template.tagName);
				for (const attr of Array.from(template.attributes)) {
					if (attr.name === "data-each" || attr.name === ":each")
						continue;
					if (attr.name === "data-mf-skip-text") continue;
					if (attr.name === "style") continue;
					el.setAttribute(attr.name, attr.value);
				}
				el.innerHTML = templateHTML;
				el.style.display = "";
				parent.insertBefore(el, last.nextSibling);
				const immediateCtx: Record<string, unknown> = {
					[this.#eachItemAlias]: item.value,
					[this.#eachKeyAlias]: item.key,
				};
				for (const tn of Array.from(el.childNodes)) {
					if (
						tn.nodeType === Node.TEXT_NODE &&
						tn.textContent &&
						tn.textContent.includes("${")
					) {
						try {
							console.log(
								"[mf][each:init-sync:text:raw]",
								tn.textContent
							);
						} catch {}
						(tn as unknown as Record<string, unknown>)._rawOrig =
							tn.textContent;
						let txt = tn.textContent;
						txt = txt.replace(/\$\{([^}]+)\}/g, (_m, code) => {
							const k = code.trim();
							if (k in immediateCtx)
								return String(
									immediateCtx[k as keyof typeof immediateCtx]
								);
							// leave placeholder intact for reactive evaluation
							return `\${${code}}`;
						});
						tn.textContent = txt;
						try {
							console.log("[mf][each:init-sync:text:after]", txt);
						} catch {}
					}
				}
				if (this.#state) RegEl.register(el, this.#state);
				this.#traverseText(el, {
					[this.#eachItemAlias]: item.value,
					[this.#eachKeyAlias]: item.key,
				});
				try {
					console.log(
						"[mf][each:init-sync:traverse:done]",
						"key",
						item.key
					);
				} catch {}
				this.#eachClones.push({ el, key: item.key });
				last = el;
			}
			try {
				console.log(
					"[mf][each:init-sync:complete]",
					"totalClones",
					this.#eachClones.length
				);
			} catch {}
		}
		this.#addEffect(() => {
			const expr = this.#eachExpr;
			if (!expr) return;
			const arr = expr.fn(buildCtx(this.#eachAliases, this.#state));
			if (!this.#eachClones.length && Array.isArray(arr)) {
				try {
					console.log(
						"[mf][each:effect:firstRun]",
						"arrLen",
						arr.length
					);
				} catch {}
			}
			// Force tracking of the collection itself (not just .length or indices) so direct index assignments
			// that notify the base path cause re-runs. Access a dummy property that will register the base path.
			// (Reading valueOf creates a property access on the proxy root.)
			try {
				// biome-ignore lint/suspicious/noExplicitAny: internal instrumentation
				(arr as any)?.valueOf;
			} catch {}
			if (!Array.isArray(arr)) {
				// Clear any existing clones if array becomes non-array
				for (const c of this.#eachClones) {
					const inst = RegEl.#registry.get(c.el);
					(inst as RegEl | undefined)?.dispose();
					c.el.remove();
				}
				this.#eachClones = [];
				return;
			}
			interface NewItem {
				key: unknown;
				value: unknown;
				index: number;
			}
			const newItems: NewItem[] = [];
			for (let i = 0; i < arr.length; i++) {
				const value = arr[i];
				let key: unknown = i;
				if (
					value &&
					typeof value === "object" &&
					this.#eachKeyAlias in (value as Record<string, unknown>)
				) {
					key = (value as Record<string, unknown>)[
						this.#eachKeyAlias
					];
				}
				newItems.push({ key, value, index: i });
			}
			const oldMap = new Map<unknown, EachItem>(
				this.#eachClones.map((c) => [c.key, c])
			);
			const next: EachItem[] = [];
			let last: Node = template;
			for (const item of newItems) {
				let cur = oldMap.get(item.key);
				if (!cur) {
					const el = document.createElement(template.tagName);
					for (const attr of Array.from(template.attributes)) {
						if (attr.name === "data-each" || attr.name === ":each")
							continue;
						if (attr.name === "data-mf-skip-text") continue; // do not propagate template skip flag
						if (attr.name === "style") continue; // avoid copying display:none
						el.setAttribute(attr.name, attr.value);
					}
					el.innerHTML = templateHTML;
					el.style.display = "";
					parent.insertBefore(el, last.nextSibling);
					// Fallback immediate interpolation so user sees values before reactive effects settle
					const immediateCtx: Record<string, unknown> = {
						[this.#eachItemAlias]: item.value,
						[this.#eachKeyAlias]: item.key,
					};
					for (const tn of Array.from(el.childNodes)) {
						if (
							tn.nodeType === Node.TEXT_NODE &&
							tn.textContent &&
							tn.textContent.includes("${")
						) {
							// Preserve original raw with placeholders for later reactive interpolation
							// so that processTextNode can still parse expressions.
							(
								tn as unknown as Record<string, unknown>
							)._rawOrig = tn.textContent;
							let txt = tn.textContent;
							txt = txt.replace(/\$\{([^}]+)\}/g, (_m, code) => {
								const k = code.trim();
								if (k in immediateCtx)
									return String(
										immediateCtx[
											k as keyof typeof immediateCtx
										]
									);
								return `\${${code}}`;
							});
							tn.textContent = txt;
						}
					}
					if (this.#state) RegEl.register(el, this.#state);
					this.#traverseText(el, {
						[this.#eachItemAlias]: item.value,
						[this.#eachKeyAlias]: item.key,
					});
					cur = { el, key: item.key };
				} else {
					if (cur.el.previousSibling !== last) {
						parent.insertBefore(cur.el, last.nextSibling);
					}
					this.#traverseText(cur.el, {
						[this.#eachItemAlias]: item.value,
						[this.#eachKeyAlias]: item.key,
					});
				}
				last = cur.el;
				next.push(cur);
			}
			for (const c of this.#eachClones)
				if (!newItems.some((n) => n.key === c.key)) {
					const inst = RegEl.#registry.get(c.el);
					(inst as RegEl | undefined)?.dispose();
					c.el.remove();
				}
			this.#eachClones = next;
		});
	}

	#traverseText(
		root: Element | DocumentFragment,
		injectedCtx?: Record<string, unknown>
	) {
		const walker = document.createTreeWalker(
			root,
			NodeFilter.SHOW_TEXT,
			null
		);
		const rootEl = root instanceof Element ? root : undefined;
		while (walker.nextNode()) {
			const textNode = walker.currentNode as Text;
			const parentEl = textNode.parentElement;
			if (parentEl?.hasAttribute("data-mf-skip-text")) continue;
			// Skip text nodes whose nearest registered ancestor is not this element (avoid parent double-processing descendant scoped nodes)
			let cur: Element | null = parentEl;
			let skip = false;
			while (cur && cur !== this.#el) {
				if (RegEl.isRegistered(cur)) {
					// Allow if this traversal root IS that registered element (updating its own subtree)
					if (rootEl && cur === rootEl) {
						break;
					}
					skip = true;
					break;
				}
				cur = cur.parentElement;
			}
			if (skip) continue;
			this.#processTextNode(textNode, injectedCtx);
		}
	}
	// DEBUG helper to verify text node processing (will print once per node with interpolation)
	#processTextNode(node: Text, injectedCtx?: Record<string, unknown>) {
		const store = node as unknown as {
			_raw?: string;
			_rawOrig?: string;
			_parts?: {
				static: string;
				expr?: ReturnType<typeof evaluateExpression>;
				aliases?: Record<string, string[]>;
			}[];
			_effect?: Effect;
		};
		// Preserve original raw (with placeholders) the first time we see the node
		if (!store._rawOrig) store._rawOrig = node.textContent ?? "";
		// When injecting context for loops/async, DON'T replace raw with possibly placeholder-stripped rendered content.
		// Instead reuse original raw so expressions remain discoverable. Just rebuild effect to capture injected context.
		if (injectedCtx) {
			store._raw = store._rawOrig;
			// Keep existing parsed parts if already built; they are based on original raw placeholders.
		}
		const raw = store._raw ?? node.textContent ?? "";
		if (!store._raw) store._raw = raw;
		if (!raw.includes("${")) return;
		try {
			if ((globalThis as unknown as Record<string, unknown>)?.MF_TRACE)
				console.log("[mf][text:init]", raw.trim());
		} catch {}
		if (!store._parts) {
			const parts: {
				static: string;
				expr?: ReturnType<typeof evaluateExpression>;
				aliases?: Record<string, string[]>;
			}[] = [];
			let lastIndex = 0;
			const regex = /\$\{([^}]+)\}/g;
			let m: RegExpExecArray | null = regex.exec(raw);
			while (m) {
				const before = raw.slice(lastIndex, m.index);
				if (before) parts.push({ static: before });
				const inner = m[1].trim();
				const { clean, aliases } = extractAliases(inner);
				parts.push({
					static: "",
					expr: evaluateExpression(clean),
					aliases,
				});
				lastIndex = m.index + m[0].length;
				m = regex.exec(raw);
			}
			const tail = raw.slice(lastIndex);
			if (tail) parts.push({ static: tail });
			store._parts = parts;
		}
		if (store._effect) store._effect.stop();
		store._effect = this.#addEffect(() => {
			if (!store._parts) return;
			let out = "";
			for (const p of store._parts) {
				if (!p.expr) {
					out += p.static;
					continue;
				}
				const ctx = buildCtx(p.aliases || {}, this.#state, injectedCtx);
				const v = p.expr.fn(ctx);
				out += v == null ? "" : String(v);
			}
			try {
				if (
					(globalThis as unknown as Record<string, unknown>)?.MF_TRACE
				)
					console.log("[mf][text:update]", out.trim());
			} catch {}
			node.textContent = out;
		});
	}

	#setProp(name: string, v: unknown) {
		const g = globalThis as unknown as Record<string, unknown>;
		if (g?.MF_DEBUG) {
			try {
				console.log("[manifold] setProp", name, v);
			} catch {}
		}
		if (g?.MF_TRACE) {
			try {
				console.log(
					"[mf][setProp]",
					name,
					"=",
					v,
					"on",
					this.#el.tagName,
					(this.#el as HTMLElement).id || "(no id)"
				);
			} catch {}
		}
		const el = this.#el as unknown as Record<string, unknown>;
		if (name in el) (el as Record<string, unknown>)[name] = v as never;
		else this.#el.setAttribute(name, v == null ? "" : String(v));
	}
}
export default RegEl;
