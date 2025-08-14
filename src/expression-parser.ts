import { currentState } from "./main.ts";

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
const NUM = /^-?\d+(?:\.\d+)?$/;

// Evaluate dotted / indexed path with dynamic index expressions
interface ChainSegmentProp {
	t: "prop";
	k: string;
}
interface ChainSegmentIdx {
	t: "idx";
	e: ParsedExpression;
}
type ChainSeg = ChainSegmentProp | ChainSegmentIdx;

const buildChain = (
	expr: string
): { base: string; segs: ChainSeg[] } | null => {
	// Must start with identifier
	if (!/^[a-zA-Z_$]/.test(expr)) return null;
	let i = 0;
	let base = "";
	while (i < expr.length && /[\w$]/.test(expr[i])) {
		base += expr[i++];
	}
	const segs: ChainSeg[] = [];
	while (i < expr.length) {
		const c = expr[i];
		if (c === ".") {
			i++;
			let prop = "";
			if (!/[a-zA-Z_$]/.test(expr[i])) return null;
			while (i < expr.length && /[\w$]/.test(expr[i])) prop += expr[i++];
			segs.push({ t: "prop", k: prop });
			continue;
		}
		if (c === "[") {
			let depth = 1;
			i++;
			const start = i;
			while (i < expr.length && depth) {
				if (expr[i] === "[") depth++;
				else if (expr[i] === "]") depth--;
				i++;
			}
			if (depth !== 0) return null; // unmatched
			const inner = expr.slice(start, i - 1).trim();
			if (!inner) return null;
			segs.push({ t: "idx", e: parse(inner) });
			continue;
		}
		return null; // unexpected char
	}
	return { base, segs };
};

// Evaluate dynamic chain against ctx + currentState fallback
const evalChain = (
	chain: { base: string; segs: ChainSeg[] },
	ctx: Record<string, unknown>
) => {
	let root: unknown;
	if (ctx && chain.base in ctx)
		root = (ctx as Record<string, unknown>)[chain.base];
	else if (currentState && chain.base in currentState)
		root = (currentState as Record<string, unknown>)[chain.base];
	else root = undefined;
	let cur = root;
	for (const seg of chain.segs) {
		if (cur == null) return undefined;
		if (seg.t === "prop") {
			cur = (cur as Record<string, unknown>)[seg.k as never];
		} else {
			const key = seg.e.fn(ctx);
			cur = (cur as Record<string, unknown>)[key as never];
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
						// Walk for assignment only on currentState root
						if (currentState) {
							let obj: unknown = currentState;
							const keys: (string | number | unknown)[] = [
								chain.base,
								...chain.segs.map((s) =>
									s.t === "prop" ? s.k : s.e.fn(ctx)
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
							if (obj && typeof obj === "object")
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

	// Function call target(args)
	if (expr.endsWith(")")) {
		let depthCall = 0,
			bDepthCall = 0;
		let callIdx = -1;
		let quote2 = "";
		for (let i = 0; i < expr.length; i++) {
			const ch = expr[i];
			if (quote2) {
				if (ch === quote2 && expr[i - 1] !== "\\") quote2 = "";
				continue;
			}
			if (ch === '"' || ch === "'" || ch === "`") {
				quote2 = ch;
				continue;
			}
			if (ch === "(") {
				if (depthCall === 0 && bDepthCall === 0 && callIdx === -1)
					callIdx = i;
				depthCall++;
			} else if (ch === ")") depthCall--;
			else if (ch === "[") bDepthCall++;
			else if (ch === "]") bDepthCall--;
			if (
				depthCall === 0 &&
				bDepthCall === 0 &&
				callIdx !== -1 &&
				i === expr.length - 1
			) {
				const targetRaw = expr.slice(0, callIdx).trim();
				if (targetRaw) {
					const argsRaw = expr.slice(callIdx + 1, -1);
					const parts = splitArgs(argsRaw).map((a) => parse(a));
					const targetChain = buildChain(targetRaw);
					if (targetChain) {
						const rootRefs = new Set<string>([targetChain.base]);
						const argRefs = parts.flatMap((p) =>
							Array.from(p.stateRefs)
						);
						return {
							fn: (c = {}) => {
								const fnTarget = evalChain(targetChain, c);
								const argVals = parts.map((p) => p.fn(c));
								return typeof fnTarget === "function"
									? (
											fnTarget as (
												...x: unknown[]
											) => unknown
									  )(...argVals)
									: undefined;
							},
							stateRefs: new Set([...rootRefs, ...argRefs]),
						};
					}
				}
			}
		}
	}

	// Literals
	if (expr in LITS) return { fn: () => LITS[expr], stateRefs: new Set() };
	if (NUM.test(expr)) return { fn: () => +expr, stateRefs: new Set() };
	const str = expr.match(/^(?:'([^']*)'|"([^"]*)"|`([^`]*)`)$/);
	if (str)
		return { fn: () => str[1] ?? str[2] ?? str[3], stateRefs: new Set() };

	// Property / identifier chain (dynamic index capable)
	const chain = buildChain(expr);
	if (chain) {
		return {
			fn: (c = {}) => evalChain(chain, c as Record<string, unknown>),
			stateRefs: new Set([chain.base]),
		};
	}

	return { fn: () => expr, stateRefs: new Set() };
};

export const evaluateExpression = (expr: string) => {
	const existing = CACHE.get(expr);
	if (existing) return existing;
	const parsed = parse(expr);
	CACHE.set(expr, parsed);
	if (CACHE.size > CACHE_MAX) {
		const first = CACHE.keys().next().value;
		if (first !== undefined) CACHE.delete(first);
	}
	return parsed;
};
export default evaluateExpression;
