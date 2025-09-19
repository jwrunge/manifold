import { splitTopLevel } from "./parsing-utils.js";

// Expression parser expects state injected via ctx.state
export interface ParsedExpression {
	_fn: (ctx?: Record<string, unknown>) => unknown | Promise<unknown>;
	// For simple reference chains (e.g., foo, foo.bar, foo[0].baz), provide a setter to update state
	// Not provided for expressions with operators or function calls
	_syncRef?: (
		ctx: Record<string, unknown> | undefined,
		value: unknown
	) => void;
}
const CACHE = new Map<string, ParsedExpression>();
const CACHE_MAX = 1000;
const NUM = /^-?\d+(?:\.[\d]+)?$/;
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
		for (const op of ops) {
			const start = i - op.length + 1;
			if (start < 0) continue;
			if (expr.slice(start, i + 1) !== op) continue;
			const l = expr.slice(0, start).trim();
			const r = expr.slice(i + 1).trim();
			if (!l || !r) continue;
			if (
				guardUnaryPM &&
				(op === "+" || op === "-") &&
				/[!+\-*/%&|^(<>=?:]$/.test(l[l.length - 1] || "")
			)
				continue;
			return [l, op, r];
		}
	}
	return null;
};
const splitByPrecedence = (expr: string): [string, string, string] | null => {
	const levels: string[][] = [
		["??"],
		["||"],
		["&&"],
		["===", "!==", ">=", "<=", ">", "<"],
		["+", "-"],
		["*", "/", "%"],
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
): { _base: string; _segs: ChainSeg[] } | null => {
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
			const argsRaw = splitTopLevel(innerArgs, ",")
				.filter(Boolean)
				.map((a: string) => parse(a));
			segs.push({ t: "call", args: argsRaw });
			continue;
		}
		return null;
	}
	return { _base: base, _segs: segs };
};
const parse = (raw: string): ParsedExpression => {
	const expr = raw.trim();
	if (!expr) return { _fn: () => undefined };
	if (expr[0] === "(" && expr[expr.length - 1] === ")") {
		let p = 0,
			b = 0,
			q = "";
		let wraps = true;
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
			if (p === 0 && b === 0 && i < expr.length - 1) {
				wraps = false;
				break;
			}
		}
		if (wraps) return parse(expr.slice(1, -1));
	}
	// Array literal: [a, b, c]
	if (expr[0] === "[" && expr[expr.length - 1] === "]") {
		const inner = expr.slice(1, -1);
		const parts = splitTopLevel(inner, ",")
			.filter(Boolean)
			.map((s) => parse(s));
		return { _fn: (c) => parts.map((p) => p._fn(c)) };
	}
	{
		let p = 0,
			b = 0,
			cBr = 0,
			q = "",
			qDepth = 0,
			qIdx = -1,
			cIdx = -1;
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
			const cond = parse(expr.slice(0, qIdx).trim());
			const thenP = parse(expr.slice(qIdx + 1, cIdx).trim());
			const elseP = parse(expr.slice(cIdx + 1).trim());
			if (cond && thenP && elseP)
				return {
					_fn: (ctx) =>
						cond._fn(ctx) ? thenP._fn(ctx) : elseP._fn(ctx),
				};
		}
	}
	const bin = splitByPrecedence(expr);
	if (bin) {
		const [L, OP, R] = bin;
		const l = parse(L);
		const r = parse(R);
		switch (OP) {
			case "||":
				return { _fn: (c) => l._fn(c) || r._fn(c) };
			case "&&":
				return { _fn: (c) => l._fn(c) && r._fn(c) };
			case "??":
				return {
					_fn: (c) => {
						const v = l._fn(c);
						return v == null ? r._fn(c) : v;
					},
				};
			case "+":
			case "-":
			case "*":
			case "/":
			case "%":
				return {
					_fn: (c) => {
						const A = l._fn(c) as unknown;
						const B = r._fn(c) as unknown;
						if (OP === "+")
							return typeof A === "string" ||
								typeof B === "string"
								? "" +
										(A as string | number) +
										(B as string | number)
								: (A as number) + (B as number);
						if (OP === "-") return (A as number) - (B as number);
						if (OP === "*") return (A as number) * (B as number);
						if (OP === "/")
							return (B as number) === 0
								? undefined
								: (A as number) / (B as number);
						return (B as number) === 0
							? undefined
							: (A as number) % (B as number);
					},
				};
			default:
				return {
					_fn: (c) => {
						const A = l._fn(c) as unknown;
						const B = r._fn(c) as unknown;
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
				};
		}
	}
	if (expr[0] === "!" && expr.length > 1)
		return { _fn: (c) => !parse(expr.slice(1))._fn(c) };
	if (expr[0] === "-" && expr.length > 1)
		return { _fn: (c) => -(parse(expr.slice(1))._fn(c) as number) };
	if (expr === "true") return { _fn: () => true };
	if (expr === "false") return { _fn: () => false };
	if (expr === "null") return { _fn: () => null };
	if (expr === "undefined") return { _fn: () => undefined };
	if (NUM.test(expr)) return { _fn: () => +expr };
	const str = expr.match(/^(?:'([^']*)'|"([^"]*)")$/);
	if (str) return { _fn: () => str[1] ?? str[2] };
	const chain = buildChain(expr);
	if (chain) {
		const fn = (c = {}) => {
			const ctx = c as Record<string, unknown>;
			let root: unknown;
			const injected = ctx.state as Record<string, unknown> | undefined;
			if (ctx && chain._base in ctx) root = ctx[chain._base];
			else if (
				typeof globalThis !== "undefined" &&
				chain._base === "Promise" &&
				chain._base in (globalThis as Record<string, unknown>)
			)
				root = (globalThis as Record<string, unknown>)[chain._base];
			else if (injected) root = injected[chain._base as never];
			else root = undefined;
			let cur = root,
				lastObjForCall: unknown;
			for (const seg of chain._segs) {
				if (cur == null) return undefined;
				if (seg.t === "prop") {
					lastObjForCall = cur;
					cur = (cur as Record<string, unknown>)[seg.k as never];
				} else if (seg.t === "idx") {
					lastObjForCall = cur;
					const key = seg.e._fn(ctx);
					cur = (cur as Record<string, unknown>)[key as never];
				} else if (seg.t === "call") {
					const fn = cur as unknown;
					if (typeof fn === "function") {
						const argVals = seg.args.map((a) => a._fn(ctx));
						cur = (fn as (...x: unknown[]) => unknown).apply(
							lastObjForCall !== undefined
								? lastObjForCall
								: undefined,
							argVals
						);
						lastObjForCall = cur;
					} else return undefined;
				}
			}
			return cur;
		};
		const syncRef = chain._segs.some((s) => s.t === "call")
			? undefined
			: (c: Record<string, unknown> | undefined, value: unknown) => {
					const ctx = (c || {}) as Record<string, unknown>;
					const injected = ctx.state as
						| Record<string, unknown>
						| undefined;
					let rootHolder: Record<string, unknown> | undefined;
					if (injected && chain._base in injected)
						rootHolder = injected;
					else if (ctx && chain._base in ctx) rootHolder = ctx;
					else return;
					if (chain._segs.length === 0) {
						(rootHolder as Record<string, unknown>)[chain._base] =
							value as unknown;
						return;
					}
					let obj: unknown = (rootHolder as Record<string, unknown>)[
						chain._base as never
					];
					for (let i = 0; i < chain._segs.length - 1; i++) {
						const seg = chain._segs[i];
						if (obj == null) return;
						if (seg.t === "prop")
							obj = (obj as Record<string, unknown>)[
								seg.k as never
							];
						else if (seg.t === "idx")
							obj = (obj as Record<string, unknown>)[
								seg.e._fn(ctx) as never
							];
					}
					if (obj == null) return;
					const last = chain._segs[chain._segs.length - 1];
					if (last.t === "prop")
						(obj as Record<string, unknown>)[last.k as never] =
							value as unknown;
					else if (last.t === "idx")
						(obj as Record<string, unknown>)[
							last.e._fn(ctx) as never
						] = value as unknown;
			  };
		return { _fn: fn, _syncRef: syncRef };
	}
	return { _fn: () => expr };
};
const evaluateExpression = (expr: string): ParsedExpression => {
	const cached = CACHE.get(expr);
	if (cached) return cached;
	const parsed = parse(expr);
	CACHE.set(expr, parsed);
	// Remove multiple entries when limit hit
	if (CACHE.size > CACHE_MAX) {
		const entries = Array.from(CACHE.keys());
		const toDelete = entries.slice(0, Math.floor(CACHE_MAX * 0.25)); // Remove 25%
		for (const key of toDelete) CACHE.delete(key);
	}
	return parsed;
};
export default evaluateExpression;
