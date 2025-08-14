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
	#thenVar?: string;
	#catchVar?: string;
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
		this.#setupEach();
		// IMPORTANT: Skip processing text on :each template itself so placeholders remain for clones.
		// Skip only the original :each template so its raw interpolation remains for cloning
		if (!el.hasAttribute(":each") && !el.hasAttribute("data-each")) {
			this.#traverseText(el);
		}
		// Recursively scan descendants for binding attributes or interpolation.
		// When a descendant with bindings is found, register it and skip scanning inside it (its own constructor will handle deeper levels).
		const scan = (rootEl: Element) => {
			for (const child of Array.from(rootEl.children)) {
				if (child.hasAttribute("data-mf-register")) {
					// separate registration boundary
					continue;
				}
				let hasBinding = false;
				for (const attr of Array.from(child.attributes)) {
					const v = attr.value;
					if (
						(v.startsWith("${") && v.endsWith("}")) ||
						attr.name.startsWith(":")
					) {
						hasBinding = true;
						break;
					}
				}
				if (
					!hasBinding &&
					child.textContent &&
					child.textContent.includes("${")
				)
					hasBinding = true;
				if (hasBinding) {
					RegEl.register(child as HTMLElement, state);
					// do not recurse into this child; its own RegEl instance will scan deeper
					continue;
				}
				// No bindings here; still need to traverse text for potential interpolation in grandchildren after later dynamic injection
				this.#traverseText(child);
				scan(child);
			}
		};
		scan(el);
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
			const assign =
				/\b[a-zA-Z_$][\w$]*(?:\.[a-zA-Z_$][\w$]*)*\s*=[^=]/.test(clean);
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
		} else if (attr === "data-then")
			this.#thenVar = raw
				.trim()
				.replace(/@/g, "")
				.replace(/[^a-zA-Z0-9_$].*$/, "");
		else if (attr === "data-catch")
			this.#catchVar = raw
				.trim()
				.replace(/@/g, "")
				.replace(/[^a-zA-Z0-9_$].*$/, "");
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
		this.#addEffect(() => {
			const expr = this.#awaitExpr;
			if (!expr) return;
			const p = expr.fn(buildCtx(this.#awaitAliases, this.#state));
			if (!(p instanceof Promise)) return;
			this.#awaitPending = true;
			this.#el.style.display = "";
			p.then((res) =>
				this.#handlePromiseResult(res, true, baseDisplay)
			).catch((err) =>
				this.#handlePromiseResult(err, false, baseDisplay)
			);
		});
	}
	#handlePromiseResult(val: unknown, ok: boolean, base: string) {
		if (!this.#awaitPending) return;
		this.#awaitPending = false;
		this.#el.style.display = "none";
		const sibs = Array.from(this.#el.parentElement?.children || []);
		for (const sib of sibs) {
			if (
				ok &&
				this.#thenVar &&
				sib.getAttribute("data-then") === this.#thenVar
			)
				this.#injectThenCatch(
					sib as HTMLElement,
					this.#thenVar,
					val,
					base
				);
			else if (
				!ok &&
				this.#catchVar &&
				sib.getAttribute("data-catch") === this.#catchVar
			)
				this.#injectThenCatch(
					sib as HTMLElement,
					this.#catchVar,
					val,
					base
				);
		}
	}
	#injectThenCatch(
		el: HTMLElement,
		varName: string,
		value: unknown,
		base: string
	) {
		el.style.display = base;
		if (this.#state) RegEl.register(el, this.#state);
		this.#traverseText(el, { [varName]: value });
	}

	#setupEach() {
		if (!this.#eachExpr) return;
		const template = this.#el;
		const parent = template.parentElement;
		if (!parent) return;
		template.style.display = "none";
		this.#addEffect(() => {
			const expr = this.#eachExpr;
			if (!expr) return;
			const arr = expr.fn(buildCtx(this.#eachAliases, this.#state));
			if (!Array.isArray(arr)) return;
			void arr.length;
			const newItems: { key: unknown; value: unknown; index: number }[] =
				[];
			for (let i = 0; i < arr.length; i++) {
				const v = arr[i] as Record<string, unknown> | undefined;
				const keyCandidate = v
					? v[this.#eachKeyAlias as keyof typeof v]
					: undefined;
				const key = keyCandidate !== undefined ? keyCandidate : i;
				newItems.push({ key, value: arr[i], index: i });
			}
			const old = this.#eachClones;
			const next: EachItem[] = [];
			const oldMap = new Map<unknown, EachItem>();
			for (const c of old) oldMap.set(c.key, c);
			// Maintain stable DOM order matching array order by inserting/moving after the previous processed element.
			let last: Node = template; // anchor (template remains hidden)
			for (const item of newItems) {
				let clone = oldMap.get(item.key);
				if (!clone) {
					const el = template.cloneNode(true) as HTMLElement;
					el.removeAttribute("data-each");
					el.removeAttribute(":each");
					el.style.display = "";
					el.dataset.mfEachClone = "1";
					parent.insertBefore(el, last.nextSibling);
					if (this.#state) RegEl.register(el, this.#state);
					// Process text after registration so effects attach and injected context is applied
					this.#traverseText(el, {
						[this.#eachItemAlias]: item.value,
						[this.#eachKeyAlias]: item.key,
					});
					clone = { el, key: item.key };
				} else {
					// Reposition if necessary to maintain order
					if (clone.el.previousSibling !== last) {
						parent.insertBefore(clone.el, last.nextSibling);
					}
					this.#traverseText(clone.el, {
						[this.#eachItemAlias]: item.value,
						[this.#eachKeyAlias]: item.key,
					});
				}
				last = clone.el;
				next.push(clone);
			}
			for (const c of old)
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
		while (walker.nextNode())
			this.#processTextNode(walker.currentNode as Text, injectedCtx);
	}
	// DEBUG helper to verify text node processing (will print once per node with interpolation)
	#processTextNode(node: Text, injectedCtx?: Record<string, unknown>) {
		const store = node as unknown as {
			_raw?: string;
			_parts?: {
				static: string;
				expr?: ReturnType<typeof evaluateExpression>;
				aliases?: Record<string, string[]>;
			}[];
			_effect?: Effect;
		};
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
