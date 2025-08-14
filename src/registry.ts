import { Effect } from "./Effect.ts";
import evaluateExpression from "./expression-parser.ts";
import { currentState } from "./main.ts";

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

// Alias extraction (strip @ prefix everywhere)
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

// Build context (alias values captured live each evaluation)
const buildCtx = (
	aliases: Record<string, string[]>,
	extra?: Record<string, unknown>
) => {
	const ctx: Record<string, unknown> = extra ? { ...extra } : {};
	for (const [alias, path] of Object.entries(aliases))
		ctx[alias] = getPath(currentState, path);
	return ctx;
};

// Flags
const isConditionalAttr = (n: string) =>
	n === "data-if" || n === "data-elseif" || n === "data-else";
const isAsyncAttr = (n: string) =>
	n === "data-await" || n === "data-then" || n === "data-catch";
const isEachAttr = (n: string) => n === "data-each";

// Each clone record
interface EachItem {
	el: HTMLElement;
	key: unknown;
}

export class RegEl {
	static #registry = new WeakMap<Element, RegEl>();
	static register(el: HTMLElement | SVGElement | MathMLElement) {
		const existing = RegEl.#registry.get(el);
		return existing || new RegEl(el);
	}

	#el: HTMLElement | SVGElement | MathMLElement;
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

	constructor(el: HTMLElement | SVGElement | MathMLElement) {
		this.#el = el;
		RegEl.#registry.set(el, this);
		this.#processAttributes();
		this.#setupConditionals();
		this.#setupAwait();
		this.#setupEach();
		this.#traverseText(el);
	}

	dispose() {
		for (const e of this.#effects) e.stop();
		this.#effects.length = 0;
		RegEl.#registry.delete(this.#el);
	}

	#addEffect(fn: () => void) {
		const e = runEffect(fn);
		this.#effects.push(e);
		return e;
	}

	// ---------------- Attribute Processing ----------------
	#processAttributes() {
		for (const attr of Array.from(this.#el.attributes)) {
			const { name, value } = attr;
			if (!value.startsWith("${") || !value.endsWith("}")) continue;
			const inner = value.slice(2, -1);
			if (isConditionalAttr(name)) this.#parseShow(name, inner);
			else if (isAsyncAttr(name)) this.#parseAsync(name, inner);
			else if (isEachAttr(name)) this.#parseEach(inner);
			else if (name.startsWith("on")) this.#bindEvent(name, inner);
			else this.#bindProp(name, inner);
		}
	}

	#parseShow(attr: string, raw: string) {
		const { clean, aliases } = extractAliases(raw);
		this.#showAliases = aliases;
		if (attr === "data-else") {
			this.#showExpr = undefined;
			return;
		}
		const parsed = evaluateExpression(clean);
		this.#showExpr = parsed;
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

	// Generic property binding with optional sync (value >> (x)=> ... ) or shorthand (value >>)
	#bindProp(name: string, raw: string) {
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
			const v = bindingExpr.fn(buildCtx(aliases));
			if (v !== last) {
				last = v;
				this.#setProp(name, v);
			}
		});
		if (
			name === "value" ||
			name === "checked" ||
			name === "selectedIndex"
		) {
			const evt = name === "value" ? "input" : "change";
			(this.#el as HTMLElement).addEventListener(evt, () => {
				const elObj: Record<string, unknown> = this
					.#el as unknown as Record<string, unknown>;
				const newVal = elObj[name];
				if (assignPath && currentState)
					setPath(currentState, assignPath, newVal);
				else if (syncExpr) {
					const ctx = buildCtx(
						aliases,
						syncParam ? { [syncParam]: newVal } : undefined
					);
					syncExpr.fn(ctx);
				}
			});
		}
	}

	#bindEvent(name: string, raw: string) {
		const { clean, aliases } = extractAliases(raw);
		const parsed = evaluateExpression(clean);
		(this.#el as HTMLElement).addEventListener(name.slice(2), (event) => {
			parsed.fn(buildCtx(aliases, { event }));
		});
	}

	// ---------------- Conditionals ----------------
	#setupConditionals() {
		if (
			this.#showExpr === undefined &&
			this.#el.hasAttribute("data-else")
		) {
			this.#addEffect(() => {
				const prev = this.#collectPrevShows();
				this.#el.style.display = prev.some(Boolean) ? "none" : "";
			});
			return;
		}
		if (
			this.#showExpr === undefined &&
			this.#el.hasAttribute("data-elseif")
		) {
			this.#addEffect(() => {
				const prev = this.#collectPrevShows();
				const cur = this.#evalShow();
				this.#el.style.display =
					prev.some(Boolean) || !cur ? "none" : "";
			});
			return;
		}
		if (!this.#showExpr) return;
		this.#addEffect(() => {
			const v = this.#evalShow();
			this.#el.style.display = v ? "" : "none";
		});
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
			? this.#showExpr.fn(buildCtx(this.#showAliases))
			: false;
	}

	// ---------------- Await / Then / Catch ----------------
	#setupAwait() {
		if (!this.#awaitExpr) return;
		const baseDisplay = this.#el.style.display;
		this.#addEffect(() => {
			const expr = this.#awaitExpr;
			if (!expr) return;
			const p = expr.fn(buildCtx(this.#awaitAliases));
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
		RegEl.register(el);
		this.#traverseText(el, { [varName]: value });
	}

	// ---------------- Each ----------------
	#setupEach() {
		if (!this.#eachExpr) return;
		const template = this.#el;
		const parent = template.parentElement;
		if (!parent) return;
		template.style.display = "none";
		this.#addEffect(() => {
			const expr = this.#eachExpr;
			if (!expr) return;
			const arr = expr.fn(buildCtx(this.#eachAliases));
			if (!Array.isArray(arr)) return;
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
			const nextClones: EachItem[] = [];
			const oldMap = new Map<unknown, EachItem>();
			for (const c of old) oldMap.set(c.key, c);
			for (const item of newItems) {
				let clone = oldMap.get(item.key);
				if (!clone) {
					const el = template.cloneNode(true) as HTMLElement;
					el.removeAttribute("data-each");
					el.style.display = "";
					parent.insertBefore(el, template.nextSibling);
					RegEl.register(el);
					clone = { el, key: item.key };
					this.#traverseText(el, {
						[this.#eachItemAlias]: item.value,
						[this.#eachKeyAlias]: item.key,
					});
				} else {
					this.#traverseText(clone.el, {
						[this.#eachItemAlias]: item.value,
						[this.#eachKeyAlias]: item.key,
					});
				}
				nextClones.push(clone);
			}
			for (const c of old)
				if (!newItems.some((n) => n.key === c.key)) c.el.remove();
			this.#eachClones = nextClones;
		});
	}

	// ---------------- Text Interpolation (optimized) ----------------
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
	#processTextNode(node: Text, injectedCtx?: Record<string, unknown>) {
		const store = node as unknown as {
			_raw?: string;
			_parts?: {
				static: string;
				expr?: ReturnType<typeof evaluateExpression>;
				aliases?: Record<string, string[]>;
			}[];
		};
		const raw = store._raw ?? node.textContent ?? "";
		if (!store._raw) store._raw = raw;
		if (!raw.includes("${")) return;
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
		this.#addEffect(() => {
			if (!store._parts) return;
			let out = "";
			for (const p of store._parts) {
				if (!p.expr) {
					out += p.static;
					continue;
				}
				const ctx = buildCtx(p.aliases || {}, injectedCtx);
				const v = p.expr.fn(ctx);
				out += v == null ? "" : String(v);
			}
			node.textContent = out;
		});
	}

	#setProp(name: string, v: unknown) {
		const el = this.#el as unknown as Record<string, unknown>;
		if (name in el) (el as Record<string, unknown>)[name] = v as never;
		else this.#el.setAttribute(name, v == null ? "" : String(v));
	}
}

export default RegEl;
