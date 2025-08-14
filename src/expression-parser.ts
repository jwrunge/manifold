// Expression parser no longer falls back to a global currentState; callers must inject state via ctx.__state

export interface ParsedExpression {
	fn: (ctx?: Record<string, unknown>) => unknown;
	stateRefs: Set<string>;
	isAssignment?: boolean;
	assignTarget?: string;
}

// Exposed dev metrics
export let cacheHits = 0;
export let cacheMisses = 0;

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

// Evaluate dotted / indexed path with dynamic index expressions + optional chaining
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
	// Must start with identifier
	if (!/^[a-zA-Z_$]/.test(expr)) return null;
	let i = 0;
	let base = "";
	while (i < expr.length && /[\w$]/.test(expr[i])) base += expr[i++];
	const segs: ChainSeg[] = [];
	while (i < expr.length) {
		if (expr[i] === ".") {
			// . or ?. handled uniformly here (previous char could be ?)
			let opt = false;
			if (expr[i - 1] === "?" && segs.at(-1)?.t !== "call") opt = true; // "?." pattern captured because previous char ?
			// advance past dot
			i++;
			let prop = "";
			if (!/[a-zA-Z_$]/.test(expr[i])) return null;
			while (i < expr.length && /[\w$]/.test(expr[i])) prop += expr[i++];
			segs.push({ t: "prop", k: prop, opt });
			continue;
		}
		if (expr[i] === "[") {
			const opt = expr[i - 1] === "?"; // ?[
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
			// function call on previous segment / base
			const opt = expr[i - 1] === "?"; // ?(
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

// Evaluate dynamic chain against ctx with optional chaining semantics (state must be injected via ctx.__state)
const evalChain = (
	chain: { base: string; segs: ChainSeg[] },
	ctx: Record<string, unknown>
) => {
	let root: unknown;
	// 1. explicit injected state under __state (Option C)
	const injected = (ctx as Record<string, unknown>).__state as
		| Record<string, unknown>
		| undefined;
	if (ctx && chain.base in ctx)
		root = (ctx as Record<string, unknown>)[chain.base];
	else if (injected && chain.base in injected) root = injected[chain.base];
	else root = undefined;
	let cur = root;
	for (const seg of chain.segs) {
		if (cur == null) {
			if (seg.opt) return undefined;
			else return undefined;
		}
		if (seg.t === "prop")
			cur = (cur as Record<string, unknown>)[seg.k as never];
		else if (seg.t === "idx") {
			const key = seg.e.fn(ctx);
			cur = (cur as Record<string, unknown>)[key as never];
		} else if (seg.t === "call") {
			const fn = cur as unknown;
			if (typeof fn === "function") {
				const argVals = seg.args.map((a) => a.fn(ctx));
				cur = (fn as (...x: unknown[]) => unknown)(...argVals);
			} else return undefined;
		}
	}
	return cur;
};

// Split top level by lowest precedence operator among list (right-to-left scan ignoring strings / parens / brackets)
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

// Helper to split top-level two-char operator (e.g., ??)
const splitTop2 = (expr: string, op: string) => {
	let depth = 0,
		bDepth = 0;
	let quote = "";
	for (let i = expr.length - op.length; i >= 0; i--) {
		if (expr.slice(i, i + op.length) !== op) continue;
		if (quote) continue;
		// scan leftwards to ensure not inside quotes/paren
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

// Argument splitter for function calls (top-level commas only)
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

// Core recursive descent with tiny grammar
const parse = (raw: string, allowAssign = false): ParsedExpression => {
	const expr = raw.trim();
	if (!expr) return { fn: () => undefined, stateRefs: new Set() };

	// Zero-param wrapper arrow: ()=> <body>  (enables assignment parsing in body)
	const emptyArrow = expr.match(/^\(\)\s*=>\s*(.+)$/);
	if (emptyArrow) return parse(emptyArrow[1], true);

	// Single param arrow (immediately evaluated with context). No assignments allowed here.
	const singleParamArrow = expr.match(
		/^\(\s*([a-zA-Z_$][\w$]*)\s*\)\s*=>\s*(.+)$/
	);
	if (singleParamArrow) {
		const body = parse(singleParamArrow[2], false);
		// Exclude the parameter identifier from state refs (treat as local binding)
		body.stateRefs.delete(singleParamArrow[1]);
		return body;
	}

	// Assignment (only if allowed via zero-param arrow wrapper)
	if (allowAssign) {
		const assign = expr.match(/^(.*?)\s*=\s*([^=].*)$/);
		if (assign) {
			const target = assign[1].trim();
			// target must be a chain (dynamic allowed)
			const chain = buildChain(target);
			if (chain) {
				const rhs = parse(assign[2], false);
				return {
					fn: (ctx) => {
						const val = rhs.fn(ctx);
						// prefer injected state only (no global fallback)
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

	// Parentheses
	if (expr[0] === "(" && expr.endsWith(")")) {
		let d = 0;
		let b = 0;
		let ok = true;
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

	// Ternary a?b:c
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

	// Nullish coalescing ??
	const nullishSplit = splitTop2(expr, "??");
	if (nullishSplit) {
		const l = parse(nullishSplit[0]);
		const r = parse(nullishSplit[1]);
		return {
			fn: (c) => {
				const v = l.fn(c);
				return v === null || v === undefined ? r.fn(c) : v;
			},
			stateRefs: new Set([...l.stateRefs, ...r.stateRefs]),
		};
	}

	// Logical OR / AND
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

	// Arithmetic + - * /
	let arSplit = splitTop(expr, ["+", "-"]) || splitTop(expr, ["*", "/"]);
	if (arSplit && (arSplit[0] === "!" || arSplit[0] === "-")) arSplit = null; // avoid misparse of unary
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

	// Comparison
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

	// Unary ! -
	if (expr[0] === "!" && expr.length > 1) {
		const v = parse(expr.slice(1));
		return { fn: (c) => !v.fn(c), stateRefs: v.stateRefs };
	}
	if (expr[0] === "-" && expr.length > 1) {
		const v = parse(expr.slice(1));
		return { fn: (c) => -(v.fn(c) as number), stateRefs: v.stateRefs };
	}

	// Literals
	if (expr in LITS) return { fn: () => LITS[expr], stateRefs: new Set() };
	if (NUM.test(expr)) return { fn: () => +expr, stateRefs: new Set() };
	const str = expr.match(/^(?:'([^']*)'|"([^"]*)"|`([^`]*)`)$/);
	if (str)
		return { fn: () => str[1] ?? str[2] ?? str[3], stateRefs: new Set() };

	// Property / identifier chain (dynamic index capable + optional chaining + calls)
	const chain = buildChain(expr);
	if (chain)
		return {
			fn: (c = {}) => evalChain(chain, c as Record<string, unknown>),
			stateRefs: new Set([chain.base]),
		};

	return { fn: () => expr, stateRefs: new Set() };
};

export const evaluateExpression = (expr: string) => {
	const existing = CACHE.get(expr);
	if (existing) {
		cacheHits++;
		return existing;
	}
	cacheMisses++;
	const parsed = parse(expr);
	CACHE.set(expr, parsed);
	if (CACHE.size > CACHE_MAX) {
		const first = CACHE.keys().next().value;
		if (first !== undefined) CACHE.delete(first);
	}
	return parsed;
};
export default evaluateExpression;
