const ID = "[a-zA-Z_$][a-zA-Z0-9_$]*";
const PROP = `${ID}(?:\\.${ID})*`;
const STATE_PROP = `@${PROP}`;
const PROP_RE = new RegExp(`^${PROP}$`);
const VALUE = `(?:${STATE_PROP}|${PROP}|-?\\d+(?:\\.\\d+)?|["'][^"']*["']|\`[^\`]*\`|true|false|null|undefined)`;
const COMP_RE = new RegExp(`^(${VALUE})\\s*(===|!==|>=|<=|==|!=|>|<)\\s*(.+)$`);
const NUM_RE = /^-?\d+(\.\d+)?$/;
const STR_RE = /^["'`](.*)["'`]$/;
const OR_RE = /^(.+?)\s*\|\|\s*(.+)$/;
const NULL_RE = /^(.+?)\s*\?\?\s*(.+)$/;
const AND_RE = /^(.+?)\s*&&\s*(.+)$/;
const ARITH_RE = /^([^"'`\|\&]+?)\s*([+\-*/])\s*(.+)$/;
export const STATE_RE = new RegExp(STATE_PROP, "g");

const LITERALS: Record<string, unknown> = {
	true: true,
	false: false,
	null: null,
	undefined: undefined,
};

const parseTernary = (expr: string) => {
	let qIdx = -1,
		cIdx = -1,
		depth = 0;
	for (let i = 0; i < expr.length; i++) {
		const char = expr[i];
		if (char === "?") {
			if (depth === 0 && qIdx === -1) qIdx = i;
			depth++;
		} else if (char === ":") {
			depth--;
			if (depth === 0 && qIdx !== -1 && cIdx === -1) {
				cIdx = i;
				break;
			}
		}
	}
	return qIdx === -1 || cIdx === -1
		? null
		: {
				_condition: expr.slice(0, qIdx).trim(),
				_trueValue: expr.slice(qIdx + 1, cIdx).trim(),
				_falseValue: expr.slice(cIdx + 1).trim(),
		  };
};

export const evalProp = (
	expr: string,
	ctx: Record<string, unknown>
): unknown => {
	const parts = expr.split(".");
	let result: unknown = ctx;
	for (const part of parts) {
		if (result == null) return undefined;
		result = (result as any)[part];
	}
	return result;
};

const parseValue = (val: string, ctx: Record<string, unknown>): any => {
	val = val.trim();
	if (val in LITERALS) return LITERALS[val];
	if (NUM_RE.test(val)) return parseFloat(val);
	const strMatch = val.match(STR_RE);
	if (strMatch) return strMatch[1];

	// Handle state properties with @ prefix
	if (val.startsWith("@")) {
		const propName = val.slice(1); // Remove the @ prefix
		if (PROP_RE.test(propName)) return evalProp(propName, ctx);
	}

	if (PROP_RE.test(val)) return evalProp(val, ctx);
	return val;
};

const evalComparison = (
	expr: string,
	ctx: Record<string, unknown>
): boolean => {
	const match = expr.match(COMP_RE);
	if (!match?.[1] || !match[3]) return false;
	const [, left, op, right] = match;
	const rightTrimmed = right.trim();
	if (!rightTrimmed || "=><".includes(rightTrimmed[0]!)) return false;
	const leftVal = parseValue(left, ctx);
	const rightVal = parseValue(rightTrimmed, ctx);

	return op == "==="
		? leftVal === rightVal
		: op == "!=="
		? leftVal !== rightVal
		: op == "=="
		? leftVal == rightVal
		: op == "!="
		? leftVal != rightVal
		: op == ">="
		? leftVal >= rightVal
		: op == "<="
		? leftVal <= rightVal
		: op == ">"
		? leftVal > rightVal
		: op == "<"
		? leftVal < rightVal
		: false;
};

export interface ExpressionResult {
	fn: (ctx: Record<string, unknown>) => unknown;
	stateRefs: string[]; // State references found in the expression (e.g., ["user", "counter"])
}

export const evaluateExpression = (
	expr: string | undefined
): ExpressionResult => {
	expr = expr?.trim();
	if (!expr) return { fn: () => undefined, stateRefs: [] };

	// Extract state references from the expression
	const stateRefs: string[] = [];
	const stateMatches = Array.from(expr.matchAll(STATE_RE));
	for (const match of stateMatches) {
		const fullRef = match[0]; // e.g., "@user.name"
		const baseState = fullRef.slice(1).split(".")[0]; // Extract "user" from "@user.name"
		if (baseState && !stateRefs.includes(baseState)) {
			stateRefs.push(baseState);
		}
	}

	// Handle literals
	if (expr in LITERALS) {
		const literalValue = LITERALS[expr];
		return { fn: () => literalValue, stateRefs };
	}

	// Handle numbers
	if (NUM_RE.test(expr)) {
		const numValue = parseFloat(expr);
		return { fn: () => numValue, stateRefs };
	}

	// Handle strings
	const strMatch = expr.match(STR_RE);
	if (strMatch) {
		const strValue = strMatch[1];
		return { fn: () => strValue, stateRefs };
	}

	// Handle ternary expressions
	const ternary = parseTernary(expr);
	if (ternary) {
		const conditionEval = evaluateExpression(ternary._condition);
		const trueEval = evaluateExpression(ternary._trueValue);
		const falseEval = evaluateExpression(ternary._falseValue);
		const allStateRefs = [
			...conditionEval.stateRefs,
			...trueEval.stateRefs,
			...falseEval.stateRefs,
		];
		const uniqueStateRefs = [...new Set([...stateRefs, ...allStateRefs])];
		return {
			fn: (ctx) =>
				conditionEval.fn(ctx) ? trueEval.fn(ctx) : falseEval.fn(ctx),
			stateRefs: uniqueStateRefs,
		};
	}

	// Handle OR expressions
	const orMatch = expr.match(OR_RE);
	if (orMatch?.[1] && orMatch[2]) {
		const leftEval = evaluateExpression(orMatch[1]);
		const rightEval = evaluateExpression(orMatch[2]);
		const allStateRefs = [...leftEval.stateRefs, ...rightEval.stateRefs];
		const uniqueStateRefs = [...new Set([...stateRefs, ...allStateRefs])];
		return {
			fn: (ctx) => leftEval.fn(ctx) || rightEval.fn(ctx),
			stateRefs: uniqueStateRefs,
		};
	}

	// Handle AND expressions
	const andMatch = expr.match(AND_RE);
	if (andMatch?.[1] && andMatch[2]) {
		const leftEval = evaluateExpression(andMatch[1]);
		const rightEval = evaluateExpression(andMatch[2]);
		const allStateRefs = [...leftEval.stateRefs, ...rightEval.stateRefs];
		const uniqueStateRefs = [...new Set([...stateRefs, ...allStateRefs])];
		return {
			fn: (ctx) => leftEval.fn(ctx) && rightEval.fn(ctx),
			stateRefs: uniqueStateRefs,
		};
	}

	// Handle arithmetic expressions
	const arithMatch = expr.match(ARITH_RE);
	if (arithMatch?.[1] && arithMatch[3]) {
		const leftEval = evaluateExpression(arithMatch[1]);
		const rightEval = evaluateExpression(arithMatch[3]);
		const op = arithMatch[2];
		const allStateRefs = [...leftEval.stateRefs, ...rightEval.stateRefs];
		const uniqueStateRefs = [...new Set([...stateRefs, ...allStateRefs])];
		return {
			fn: (ctx) => {
				const leftVal = leftEval.fn(ctx);
				const rightVal = rightEval.fn(ctx);
				if (leftVal && rightVal) {
					return op === "+"
						? (leftVal as number) + (rightVal as number)
						: op === "-"
						? (leftVal as number) - (rightVal as number)
						: op === "*"
						? (leftVal as number) * (rightVal as number)
						: op === "/"
						? (leftVal as number) / (rightVal as number)
						: undefined;
				}
				return undefined;
			},
			stateRefs: uniqueStateRefs,
		};
	}

	// Handle nullish coalescing
	const nullMatch = expr.match(NULL_RE);
	if (nullMatch?.[1] && nullMatch[2]) {
		const leftEval = evaluateExpression(nullMatch[1]);
		const rightEval = evaluateExpression(nullMatch[2]);
		const allStateRefs = [...leftEval.stateRefs, ...rightEval.stateRefs];
		const uniqueStateRefs = [...new Set([...stateRefs, ...allStateRefs])];
		return {
			fn: (ctx) => leftEval.fn(ctx) ?? rightEval.fn(ctx),
			stateRefs: uniqueStateRefs,
		};
	}

	// Handle property access
	if (PROP_RE.test(expr)) {
		return {
			fn: (ctx) => {
				const result = evalProp(expr, ctx);
				return result === undefined &&
					!expr.includes(".") &&
					Object.keys(ctx).length === 0
					? expr
					: result;
			},
			stateRefs,
		};
	}

	// Handle comparison expressions
	if (COMP_RE.test(expr)) {
		const compMatch = expr.match(COMP_RE);
		if (compMatch?.[1] && compMatch[3]) {
			const rightTrimmed = compMatch[3].trim();
			if (rightTrimmed && !"=><".includes(rightTrimmed[0]!)) {
				return {
					fn: (ctx) => evalComparison(expr, ctx),
					stateRefs,
				};
			}
		}
		return { fn: () => expr, stateRefs };
	}

	// Handle general property access or fallback to string
	if (expr.includes(".") || /^[a-zA-Z_$]/.test(expr)) {
		return {
			fn: (ctx) => {
				const result = evalProp(expr, ctx);
				return result !== undefined ? result : expr;
			},
			stateRefs,
		};
	}

	// Fallback to string literal
	return { fn: () => expr, stateRefs };
};
