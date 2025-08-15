// Expression parser expects state injected via ctx.__state

export interface ParsedExpression {
	fn: (ctx?: Record<string, unknown>) => unknown;
	stateRefs: Set<string>;
	isAssignment?: boolean;
	assignTarget?: string;
}

// LRU cache (simple FIFO trim) for parsed expressions
const CACHE = new Map<string, ParsedExpression>();
const CACHE_MAX = 500;

// Simple literal / identifier helpers
const LITS: Record<string, unknown> = {
	true: true,
	false: false,
	null: null,
	undefined: undefined,
};
const NUM = /^-?\d+(?:\.[\d]+)?$/;

// Chain segments
interface ChainSegmentProp {
	t: "prop";
	k: string;
	opt?: boolean;
}
interface ChainSegmentIdx {
	t: "idx";
	e: ParsedExpression;
	opt?: boolean;
}
interface ChainSegmentCall {
	t: "call";
	args: ParsedExpression[];
	opt?: boolean;
}
type ChainSeg = ChainSegmentProp | ChainSegmentIdx | ChainSegmentCall;

const buildChain = (
	expr: string
): { base: string; segs: ChainSeg[] } | null => {
	if (!/^[a-zA-Z_$]/.test(expr)) return null;
	let i = 0,
		base = "";
	while (i < expr.length && /[\w$]/.test(expr[i])) base += expr[i++];
	const segs: ChainSeg[] = [];
	while (i < expr.length) {
		if (expr[i] === ".") {
			let opt = false;
			if (expr[i - 1] === "?" && segs.at(-1)?.t !== "call") opt = true;
			i++;
			let prop = "";
			if (!/[a-zA-Z_$]/.test(expr[i])) return null;
			while (i < expr.length && /[\w$]/.test(expr[i])) prop += expr[i++];
			segs.push({ t: "prop", k: prop, opt });
			continue;
		}
		if (expr[i] === "[") {
			const opt = expr[i - 1] === "?";
			let depth = 1;
			i++;
			const start = i;
			while (i < expr.length && depth) {
				if (expr[i] === "[") depth++;
				else if (expr[i] === "]") depth--;
				i++;
			}
			if (depth !== 0) return null;
			const inner = expr.slice(start, i - 1).trim();
			if (!inner) return null;
			segs.push({ t: "idx", e: parse(inner), opt });
			continue;
		}
		if (expr[i] === "(") {
			const opt = expr[i - 1] === "?";
			let depth = 1;
			i++;
			const start = i;
			while (i < expr.length && depth) {
				if (expr[i] === "(") depth++;
				else if (expr[i] === ")") depth--;
				i++;
			}
			const innerArgs = expr.slice(start, i - 1);
			const argsRaw = splitArgs(innerArgs).map((a) => parse(a));
			segs.push({ t: "call", args: argsRaw, opt });
			continue;
		}
		return null;
	}
	return { base, segs };
};

const evalChain = (
	chain: { base: string; segs: ChainSeg[] },
	ctx: Record<string, unknown>
) => {
	let root: unknown;
	const injected = (ctx as Record<string, unknown>).__state as
		| Record<string, unknown>
		| undefined;
	if (ctx && Object.hasOwn(ctx, chain.base))
		root = (ctx as Record<string, unknown>)[chain.base];
	else if (injected && Object.hasOwn(injected, chain.base))
		root = injected[chain.base];
	else if (
		typeof globalThis !== "undefined" &&
		chain.base === "Promise" &&
		chain.base in (globalThis as Record<string, unknown>)
	)
		root = (globalThis as Record<string, unknown>)[chain.base];
	else root = undefined;
	let cur = root,
		lastObjForCall: unknown;
	for (const seg of chain.segs) {
		if (cur == null) return undefined;
		if (seg.t === "prop") {
			lastObjForCall = cur;
			cur = (cur as Record<string, unknown>)[seg.k as never];
		} else if (seg.t === "idx") {
			lastObjForCall = cur;
			const key = seg.e.fn(ctx);
			cur = (cur as Record<string, unknown>)[key as never];
		} else if (seg.t === "call") {
			const fn = cur as unknown;
			if (typeof fn === "function") {
				const argVals = seg.args.map((a) => a.fn(ctx));
				cur = (fn as (...x: unknown[]) => unknown).apply(
					lastObjForCall !== undefined ? lastObjForCall : undefined,
					argVals
				);
				lastObjForCall = cur;
			} else return undefined;
		}
	}
	return cur;
};

const splitTop = (expr: string, ops: string[]) => {
	let depth = 0,
		bDepth = 0;
	let quote = "";
	for (let i = expr.length - 1; i >= 0; i--) {
		const c = expr[i];
		if (quote) {
			if (c === quote && expr[i - 1] !== "\\") quote = "";
			continue;
		}
		if (c === '"' || c === "'" || c === "`") {
			quote = c;
			continue;
		}
		if (c === ")") depth++;
		else if (c === "(") depth--;
		else if (c === "]") bDepth++;
		else if (c === "[") bDepth--;
		if (depth === 0 && bDepth === 0 && ops.includes(c)) {
			const l = expr.slice(0, i).trim();
			const r = expr.slice(i + 1).trim();
			if (l && r) return [l, c, r] as const;
		}
	}
	return null;
};

const splitTop2 = (expr: string, op: string) => {
	let depth = 0,
		bDepth = 0;
	let quote = "";
	for (let i = expr.length - op.length; i >= 0; i--) {
		if (expr.slice(i, i + op.length) !== op) continue;
		if (quote) continue;
		depth = 0;
		bDepth = 0;
		quote = "";
		for (let j = 0; j < i + op.length; j++) {
			const c = expr[j];
			if (quote) {
				if (c === quote && expr[j - 1] !== "\\") quote = "";
				continue;
			}
			if (c === '"' || c === "'" || c === "`") {
				quote = c;
				continue;
			}
			if (c === "(") depth++;
			else if (c === ")") depth--;
			else if (c === "[") bDepth++;
			else if (c === "]") bDepth--;
		}
		if (depth === 0 && bDepth === 0) {
			const l = expr.slice(0, i).trim();
			const r = expr.slice(i + op.length).trim();
			if (l && r) return [l, r] as const;
		}
	}
	return null;
};

const splitArgs = (raw: string) => {
	const out: string[] = [];
	if (!raw.trim()) return out;
	let depth = 0,
		bDepth = 0;
	let quote = "";
	let last = 0;
	for (let i = 0; i < raw.length; i++) {
		const c = raw[i];
		if (quote) {
			if (c === quote && raw[i - 1] !== "\\") quote = "";
			continue;
		}
		if (c === '"' || c === "'" || c === "`") {
			quote = c;
			continue;
		}
		if (c === "(") depth++;
		else if (c === ")") depth--;
		else if (c === "[") bDepth++;
		else if (c === "]") bDepth--;
		if (depth === 0 && bDepth === 0 && c === ",") {
			out.push(raw.slice(last, i).trim());
			last = i + 1;
		}
	}
	out.push(raw.slice(last).trim());
	return out.filter(Boolean);
};

const parse = (raw: string, allowAssign = false): ParsedExpression => {
	const expr = raw.trim();
	if (!expr) return { fn: () => undefined, stateRefs: new Set() };
	const emptyArrow = expr.match(/^\(\)\s*=>\s*(.+)$/);
	if (emptyArrow) return parse(emptyArrow[1], true);
	const singleParamArrow = expr.match(
		/^\(\s*([a-zA-Z_$][\w$]*)\s*\)\s*=>\s*(.+)$/
	);
	if (singleParamArrow) {
		const body = parse(singleParamArrow[2], false);
		body.stateRefs.delete(singleParamArrow[1]);
		return body;
	}
	if (allowAssign) {
		const assign = expr.match(/^(.*?)\s*=\s*([^=].*)$/);
		if (assign) {
			const target = assign[1].trim();
			const chain = buildChain(target);
			if (chain) {
				const rhs = parse(assign[2], false);
				return {
					fn: (ctx) => {
						const val = rhs.fn(ctx);
						const injected =
							ctx && (ctx as Record<string, unknown>).__state
								? ((ctx as Record<string, unknown>)
										.__state as Record<string, unknown>)
								: undefined;
						if (injected) {
							let obj: unknown = injected;
							const keys: (string | number | unknown)[] = [
								chain.base,
								...chain.segs.map((s) =>
									s.t === "prop"
										? s.k
										: s.t === "idx"
										? s.e.fn(ctx)
										: undefined
								),
							];
							for (let i = 0; i < keys.length - 1; i++) {
								if (obj == null || typeof obj !== "object")
									return val;
								obj = (obj as Record<string, unknown>)[
									keys[i] as never
								];
								if (obj == null) return val;
							}
							const lastKey = keys[keys.length - 1];
							if (
								obj &&
								typeof obj === "object" &&
								lastKey !== undefined
							)
								(obj as Record<string, unknown>)[
									lastKey as never
								] = val as unknown as never;
						}
						return val;
					},
					stateRefs: rhs.stateRefs,
					isAssignment: true,
					assignTarget: target,
				};
			}
		}
	}
	if (expr[0] === "(" && expr.endsWith(")")) {
		let d = 0,
			b = 0,
			ok = true;
		for (let i = 0; i < expr.length; i++) {
			const c = expr[i];
			if (c === "(") d++;
			else if (c === ")") d--;
			else if (c === "[") b++;
			else if (c === "]") b--;
			if (d === 0 && b === 0 && i < expr.length - 1) {
				ok = false;
				break;
			}
		}
		if (ok) return parse(expr.slice(1, -1), allowAssign);
	}
	let q = -1,
		cIdx = -1,
		depth = 0,
		bDepth = 0;
	for (let i = 0; i < expr.length; i++) {
		const ch = expr[i];
		if (ch === "?" && depth === 0 && bDepth === 0 && q === -1) {
			q = i;
			depth++;
		} else if (ch === ":" && depth === 1 && bDepth === 0 && q !== -1) {
			depth--;
			cIdx = i;
			break;
		} else if (ch === "(") depth++;
		else if (ch === ")") depth--;
		else if (ch === "[") bDepth++;
		else if (ch === "]") bDepth--;
	}
	if (q !== -1 && cIdx !== -1) {
		const a = parse(expr.slice(0, q));
		const b2 = parse(expr.slice(q + 1, cIdx));
		const d2 = parse(expr.slice(cIdx + 1));
		return {
			fn: (c) => (a.fn(c) ? b2.fn(c) : d2.fn(c)),
			stateRefs: new Set([
				...a.stateRefs,
				...b2.stateRefs,
				...d2.stateRefs,
			]),
		};
	}
	const nullishSplit = splitTop2(expr, "??");
	if (nullishSplit) {
		const l = parse(nullishSplit[0]);
		const r = parse(nullishSplit[1]);
		return {
			fn: (c) => {
				const v = l.fn(c);
				return v == null ? r.fn(c) : v;
			},
			stateRefs: new Set([...l.stateRefs, ...r.stateRefs]),
		};
	}
	const logic = /(.*)\|\|(.+)|(.*)&&(.+)/;
	const lm = expr.match(logic);
	if (lm) {
		if (lm[1] && lm[2]) {
			const l = parse(lm[1]);
			const r = parse(lm[2]);
			return {
				fn: (c) => l.fn(c) || r.fn(c),
				stateRefs: new Set([...l.stateRefs, ...r.stateRefs]),
			};
		}
		if (lm[3] && lm[4]) {
			const l = parse(lm[3]);
			const r = parse(lm[4]);
			return {
				fn: (c) => l.fn(c) && r.fn(c),
				stateRefs: new Set([...l.stateRefs, ...r.stateRefs]),
			};
		}
	}
	let arSplit = splitTop(expr, ["+", "-"]) || splitTop(expr, ["*", "/"]);
	if (arSplit && (arSplit[0] === "!" || arSplit[0] === "-")) arSplit = null;
	if (arSplit) {
		const l = parse(arSplit[0]);
		const op = arSplit[1];
		const r = parse(arSplit[2]);
		return {
			fn: (c) => {
				const A = l.fn(c) as unknown;
				const B = r.fn(c) as unknown;
				if (op === "+")
					return typeof A === "string" || typeof B === "string"
						? "" + (A as string | number) + (B as string | number)
						: (A as number) + (B as number);
				if (op === "-") return (A as number) - (B as number);
				if (op === "*") return (A as number) * (B as number);
				return (B as number) === 0
					? undefined
					: (A as number) / (B as number);
			},
			stateRefs: new Set([...l.stateRefs, ...r.stateRefs]),
		};
	}
	const comp = expr.match(/^(.*?)\s*(===|!==|>=|<=|>|<)\s*(.*)$/);
	if (comp?.[1] && comp?.[3]) {
		const l = parse(comp[1]);
		const r = parse(comp[3]);
		const op = comp[2];
		return {
			fn: (c) => {
				const A = l.fn(c) as unknown;
				const B = r.fn(c) as unknown;
				return op === "==="
					? A === B
					: op === "!=="
					? A !== B
					: op === ">="
					? (A as number) >= (B as number)
					: op === "<="
					? (A as number) <= (B as number)
					: op === ">"
					? (A as number) > (B as number)
					: (A as number) < (B as number);
			},
			stateRefs: new Set([...l.stateRefs, ...r.stateRefs]),
		};
	}
	if (expr[0] === "!" && expr.length > 1) {
		const v = parse(expr.slice(1));
		return { fn: (c) => !v.fn(c), stateRefs: v.stateRefs };
	}
	if (expr[0] === "-" && expr.length > 1) {
		const v = parse(expr.slice(1));
		return { fn: (c) => -(v.fn(c) as number), stateRefs: v.stateRefs };
	}
	if (expr in LITS) return { fn: () => LITS[expr], stateRefs: new Set() };
	if (NUM.test(expr)) return { fn: () => +expr, stateRefs: new Set() };
	const str = expr.match(/^(?:'([^']*)'|"([^"]*)"|`([^`]*)`)$/);
	if (str)
		return { fn: () => str[1] ?? str[2] ?? str[3], stateRefs: new Set() };
	const chain = buildChain(expr);
	if (chain)
		return {
			fn: (c = {}) => evalChain(chain, c as Record<string, unknown>),
			stateRefs: new Set([chain.base]),
		};
	if (expr.startsWith("[") && expr.endsWith("]")) {
		const inner = expr.slice(1, -1);
		const parts = splitArgs(inner);
		const parsedItems = parts.map((seg) => {
			const spread = seg.startsWith("...");
			const body = spread ? seg.slice(3).trim() : seg;
			const parsed = parse(body);
			return { spread, parsed };
		});
		return {
			fn: (c) => {
				const out: unknown[] = [];
				for (const it of parsedItems) {
					const val = it.parsed.fn(c);
					if (it.spread && Array.isArray(val)) out.push(...val);
					else out.push(val);
				}
				return out;
			},
			stateRefs: new Set(
				parsedItems.flatMap((it) => Array.from(it.parsed.stateRefs))
			),
		};
	}
	if (expr.startsWith("{") && expr.endsWith("}")) {
		const inner = expr.slice(1, -1);
		// object parts split respecting nesting
		const segsRaw: string[] = [];
		let p = 0,
			b = 0,
			cDepth = 0,
			q = "",
			last = 0;
		for (let i = 0; i < inner.length; i++) {
			const ch = inner[i];
			if (q) {
				if (ch === q && inner[i - 1] !== "\\") q = "";
				continue;
			}
			if (ch === '"' || ch === "'" || ch === "`") {
				q = ch;
				continue;
			}
			if (ch === "(") p++;
			else if (ch === ")") p--;
			else if (ch === "[") b++;
			else if (ch === "]") b--;
			else if (ch === "{") cDepth++;
			else if (ch === "}") cDepth--;
			if (ch === "," && p === 0 && b === 0 && cDepth === 0) {
				segsRaw.push(inner.slice(last, i).trim());
				last = i + 1;
			}
		}
		const tail = inner.slice(last).trim();
		if (tail) segsRaw.push(tail);
		interface ObjSeg {
			spread: boolean;
			k?: string | ParsedExpression;
			v?: ParsedExpression;
			computed?: boolean;
		}
		const segs: ObjSeg[] = [];
		for (const rawSeg of segsRaw) {
			if (!rawSeg) continue;
			if (rawSeg.startsWith("...")) {
				segs.push({ spread: true, v: parse(rawSeg.slice(3).trim()) });
				continue;
			}
			let key: string | ParsedExpression | undefined;
			let value: ParsedExpression | undefined;
			let computed = false;
			const colonIdx = rawSeg.indexOf(":");
			if (colonIdx !== -1) {
				const left = rawSeg.slice(0, colonIdx).trim();
				const right = rawSeg.slice(colonIdx + 1).trim();
				if (left.startsWith("[") && left.endsWith("]")) {
					computed = true;
					key = parse(left.slice(1, -1));
				} else if (/^['"`]/.test(left)) {
					key = (parse(left).fn() as string) ?? "";
				} else {
					key = left;
				}
				value = parse(right);
			} else {
				key = rawSeg;
				value = parse(rawSeg);
			}
			segs.push({ spread: false, k: key, v: value, computed });
		}
		return {
			fn: (c) => {
				const out: Record<string | number | symbol, unknown> = {};
				for (const s of segs) {
					if (s.spread) {
						const v = s.v?.fn(c);
						if (v && typeof v === "object") {
							for (const k in v as Record<string, unknown>)
								out[k] = (v as Record<string, unknown>)[k];
						}
					} else if (s.k && s.v) {
						const keyVal =
							typeof s.k === "string" && !s.computed
								? s.k
								: ((s.k as ParsedExpression).fn(c) as
										| string
										| number
										| symbol);
						out[keyVal as string] = s.v.fn(c);
					}
				}
				return out;
			},
			stateRefs: new Set(
				segs.flatMap((s) => {
					const out: string[] = [];
					if (s.v) out.push(...s.v.stateRefs);
					if (s.computed && s.k && typeof s.k !== "string")
						out.push(...s.k.stateRefs);
					else if (!s.spread && s.k && typeof s.k === "string") {
						if (s.v && s.v.stateRefs.has(s.k)) out.push(s.k);
					}
					return out;
				})
			),
		};
	}
	return { fn: () => expr, stateRefs: new Set() }; // fallback: raw string
};

const evaluateExpression = (expr: string): ParsedExpression => {
	const cached = CACHE.get(expr);
	if (cached) return cached;
	const parsed = parse(expr, false);
	CACHE.set(expr, parsed);
	if (CACHE.size > CACHE_MAX) {
		const k = CACHE.keys().next().value as string | undefined;
		if (k !== undefined) CACHE.delete(k);
	}
	return parsed;
};

export default evaluateExpression;
