// Expression parser expects state injected via ctx.__state

export interface ParsedExpression {
	fn: (ctx?: Record<string, unknown>) => unknown;
	isAssignment?: boolean;
	assignTarget?: string;
	stateRefs: Set<string>;
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
}
interface ChainSegmentIdx {
	t: "idx";
	e: ParsedExpression;
}
interface ChainSegmentCall {
	t: "call";
	args: ParsedExpression[];
}
type ChainSeg = ChainSegmentProp | ChainSegmentIdx | ChainSegmentCall;

const splitCSV = (src: string): string[] => {
	const out: string[] = [];
	if (!src.trim()) return out;
	let p = 0,
		b = 0,
		cBr = 0,
		q = "",
		last = 0;
	for (let i = 0; i < src.length; i++) {
		const ch = src[i];
		if (q) {
			if (ch === q && src[i - 1] !== "\\") q = "";
			continue;
		}
		if (ch === '"' || ch === "'") {
			q = ch;
			continue;
		}
		if (ch === "(") p++;
		else if (ch === ")") p--;
		else if (ch === "[") b++;
		else if (ch === "]") b--;
		else if (ch === "{") cBr++;
		else if (ch === "}") cBr--;
		if (ch === "," && p === 0 && b === 0 && cBr === 0) {
			out.push(src.slice(last, i).trim());
			last = i + 1;
		}
	}
	out.push(src.slice(last).trim());
	return out.filter(Boolean);
};

// Find a top-level binary operator split using precedence and optional unary +/- guard
const splitOuterRightmost = (
	expr: string,
	ops: string[],
	guardUnaryPM = false
): [string, string, string] | null => {
	let p = 0,
		b = 0,
		q = "";
	for (let i = expr.length - 1; i >= 0; i--) {
		const c = expr[i];
		if (q) {
			if (c === q && expr[i - 1] !== "\\") q = "";
			continue;
		}
		if (c === '"' || c === "'") {
			q = c;
			continue;
		}
		if (c === ")") p++;
		else if (c === "(") p--;
		else if (c === "]") b++;
		else if (c === "[") b--;
		if (p !== 0 || b !== 0) continue;
		// ops must be ordered longest-first to avoid partial matches
		for (const op of ops) {
			const start = i - op.length + 1;
			if (start < 0) continue;
			if (expr.slice(start, i + 1) !== op) continue;
			const l = expr.slice(0, start).trim();
			const r = expr.slice(i + 1).trim();
			if (!l || !r) continue;
			if (guardUnaryPM && (op === "+" || op === "-")) {
				const last = l[l.length - 1] || "";
				if (/[!+\-*/%&|^(<>=?:]$/.test(last)) continue; // looks like unary, keep scanning
			}
			return [l, op, r];
		}
	}
	return null;
};

const splitByPrecedence = (expr: string): [string, string, string] | null => {
	// From lowest to higher precedence
	const levels: string[][] = [
		["??"],
		["||"],
		["&&"],
		["===", "!==", ">=", "<=", ">", "<"], // longest-first already
		["+", "-"],
		["*", "/"],
	];
	for (const ops of levels) {
		const res =
			ops.length === 2 && ops[0] === "+" && ops[1] === "-"
				? splitOuterRightmost(expr, ops, true)
				: splitOuterRightmost(expr, ops, false);
		if (res) return res;
	}
	return null;
};

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
			i++;
			let prop = "";
			if (!/[a-zA-Z_$]/.test(expr[i])) return null;
			while (i < expr.length && /[\w$]/.test(expr[i])) prop += expr[i++];
			segs.push({ t: "prop", k: prop });
			continue;
		}
		if (expr[i] === "[") {
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
			segs.push({ t: "idx", e: parse(inner) });
			continue;
		}
		if (expr[i] === "(") {
			let depth = 1;
			i++;
			const start = i;
			while (i < expr.length && depth) {
				if (expr[i] === "(") depth++;
				else if (expr[i] === ")") depth--;
				i++;
			}
			const innerArgs = expr.slice(start, i - 1);
			const argsRaw = splitCSV(innerArgs).map((a: string) => parse(a));
			segs.push({ t: "call", args: argsRaw });
			continue;
		}
		return null;
	}
	return { base, segs };
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
		// Remove the arrow param from root refs (treated as local)
		body.stateRefs.delete(singleParamArrow[1]);
		return body;
	}

	// Strip a single pair of outer parentheses if they wrap the whole expression
	if (expr[0] === "(" && expr[expr.length - 1] === ")") {
		let p = 0,
			b = 0,
			q = "";
		let wraps = false;
		for (let i = 0; i < expr.length; i++) {
			const c = expr[i];
			if (q) {
				if (c === q && expr[i - 1] !== "\\") q = "";
				continue;
			}
			if (c === '"' || c === "'") {
				q = c;
				continue;
			}
			if (c === "(") p++;
			else if (c === ")") p--;
			else if (c === "[") b++;
			else if (c === "]") b--;
			if (p === 0 && b === 0) {
				wraps = i === expr.length - 1;
				break;
			}
		}
		if (wraps) return parse(expr.slice(1, -1), allowAssign);
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
								] = val as never;
						}
						return val;
					},
					isAssignment: true,
					assignTarget: target,
					stateRefs: rhs.stateRefs,
				};
			}
		}
	}

	// Top-level ternary operator parsing: cond ? then : else
	{
		let p = 0,
			b = 0,
			cBr = 0;
		let q = "";
		let qDepth = 0;
		let qIdx = -1;
		let cIdx = -1;
		for (let i = 0; i < expr.length; i++) {
			const ch = expr[i];
			if (q) {
				if (ch === q && expr[i - 1] !== "\\") q = "";
				continue;
			}
			if (ch === '"' || ch === "'") {
				q = ch;
				continue;
			}
			if (ch === "(") p++;
			else if (ch === ")") p--;
			else if (ch === "[") b++;
			else if (ch === "]") b--;
			else if (ch === "{") cBr++;
			else if (ch === "}") cBr--;
			if (p || b || cBr) continue;
			if (ch === "?") {
				if (qDepth === 0) qIdx = i;
				qDepth++;
			} else if (ch === ":" && qDepth > 0) {
				qDepth--;
				if (qDepth === 0) {
					cIdx = i;
					break;
				}
			}
		}
		if (qIdx !== -1 && cIdx !== -1) {
			const cond = expr.slice(0, qIdx).trim();
			const thenP = expr.slice(qIdx + 1, cIdx).trim();
			const elseP = expr.slice(cIdx + 1).trim();
			if (cond && thenP && elseP) {
				const cnd = parse(cond);
				const thn = parse(thenP);
				const els = parse(elseP);
				return {
					fn: (ctx) => (cnd.fn(ctx) ? thn.fn(ctx) : els.fn(ctx)),
					stateRefs: new Set<string>([
						...cnd.stateRefs,
						...thn.stateRefs,
						...els.stateRefs,
					]),
				};
			}
		}
	}

	const bin = splitByPrecedence(expr);
	if (bin) {
		const [L, OP, R] = bin;
		const l = parse(L);
		const r = parse(R);
		switch (OP) {
			case "||":
				return {
					fn: (c) => l.fn(c) || r.fn(c),
					stateRefs: new Set<string>([
						...l.stateRefs,
						...r.stateRefs,
					]),
				};
			case "&&":
				return {
					fn: (c) => l.fn(c) && r.fn(c),
					stateRefs: new Set<string>([
						...l.stateRefs,
						...r.stateRefs,
					]),
				};
			case "??":
				return {
					fn: (c) => {
						const v = l.fn(c);
						return v == null ? r.fn(c) : v;
					},
					stateRefs: new Set<string>([
						...l.stateRefs,
						...r.stateRefs,
					]),
				};
			case "+":
			case "-":
			case "*":
			case "/":
				return {
					fn: (c) => {
						const A = l.fn(c) as unknown;
						const B = r.fn(c) as unknown;
						if (OP === "+")
							return typeof A === "string" ||
								typeof B === "string"
								? "" +
										(A as string | number) +
										(B as string | number)
								: (A as number) + (B as number);
						if (OP === "-") return (A as number) - (B as number);
						if (OP === "*") return (A as number) * (B as number);
						return (B as number) === 0
							? undefined
							: (A as number) / (B as number);
					},
					stateRefs: new Set<string>([
						...l.stateRefs,
						...r.stateRefs,
					]),
				};
			default:
				return {
					fn: (c) => {
						const A = l.fn(c) as unknown;
						const B = r.fn(c) as unknown;
						switch (OP) {
							case "===":
								return A === B;
							case "!==":
								return A !== B;
							case ">=":
								return (A as number) >= (B as number);
							case "<=":
								return (A as number) <= (B as number);
							case ">":
								return (A as number) > (B as number);
							case "<":
								return (A as number) < (B as number);
						}
					},
					stateRefs: new Set<string>([
						...l.stateRefs,
						...r.stateRefs,
					]),
				};
		}
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
	const str = expr.match(/^(?:'([^']*)'|"([^"]*)")$/);
	if (str) return { fn: () => str[1] ?? str[2], stateRefs: new Set() };

	const chain = buildChain(expr);
	if (chain)
		return {
			fn: (c = {}) => {
				const ctx = c as Record<string, unknown>;
				let root: unknown;
				const injected = (ctx as Record<string, unknown>).__state as
					| Record<string, unknown>
					| undefined;
				let baseOwner: unknown = undefined;
				if (ctx && chain.base in ctx) {
					root = (ctx as Record<string, unknown>)[chain.base];
					baseOwner = undefined; // local var/function, no bound this
				} else if (
					typeof globalThis !== "undefined" &&
					chain.base === "Promise" &&
					chain.base in (globalThis as Record<string, unknown>)
				) {
					root = (globalThis as Record<string, unknown>)[chain.base];
					baseOwner = undefined;
				} else if (injected && chain.base in injected) {
					root = (injected as Record<string, unknown>)[
						chain.base as never
					];
					baseOwner = injected; // bind base calls to state
				} else root = undefined;
				let cur = root,
					lastObjForCall: unknown = undefined;
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
								lastObjForCall !== undefined
									? lastObjForCall
									: baseOwner,
								argVals
							);
							lastObjForCall = cur;
						} else return undefined;
					}
				}
				return cur;
			},
			stateRefs: new Set([chain.base]),
		};

	// drop array/object literal creation

	// fallback: raw string
	return { fn: () => expr, stateRefs: new Set() };
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
