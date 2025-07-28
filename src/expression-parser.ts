const ID = "[a-zA-Z_$][a-zA-Z0-9_$]*";
const PROP = `${ID}(?:\\.${ID})*`;
const PROP_RE = new RegExp(`^${PROP}$`);
const COMP_RE = new RegExp(`^(${PROP})\\s*(===|!==|>=|<=|==|!=|>|<)\\s*(.+)$`);
const NUM_RE = /^-?\d+(\.\d+)?$/;
const STR_RE = /^["'`](.*)["'`]$/;
const OR_RE = /^(.+?)\s*\|\|\s*(.+)$/;
const NULL_RE = /^(.+?)\s*\?\?\s*(.+)$/;
const AND_RE = /^(.+?)\s*&&\s*(.+)$/;
const ARITH_RE = /^([^"'`\|\&]+?)\s*([+\-*/])\s*(.+)$/;
export const STATE_RE = new RegExp(`@(${PROP})`, "g");

const LITERALS: Record<string, unknown> = {
	true: true,
	false: false,
	null: null,
	undefined: undefined,
};

function parseTernary(expr: string) {
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
				condition: expr.slice(0, qIdx).trim(),
				trueValue: expr.slice(qIdx + 1, cIdx).trim(),
				falseValue: expr.slice(cIdx + 1).trim(),
		  };
}

function evalProp(expr: string, ctx: Record<string, unknown>): unknown {
	const parts = expr.split(".");
	let result: unknown = ctx;
	for (const part of parts) {
		if (result == null) return undefined;
		result = (result as any)[part];
	}
	return result;
}

function parseValue(val: string, ctx: Record<string, unknown>): any {
	val = val.trim();
	if (val in LITERALS) return LITERALS[val];
	if (NUM_RE.test(val)) return parseFloat(val);
	const strMatch = val.match(STR_RE);
	if (strMatch) return strMatch[1];
	if (PROP_RE.test(val)) return evalProp(val, ctx);
	return val;
}

function evalComparison(expr: string, ctx: Record<string, unknown>): boolean {
	const match = expr.match(COMP_RE);
	if (!match?.[1] || !match[3]) return false;
	const [, left, op, right] = match;
	const rightTrimmed = right.trim();
	if (!rightTrimmed || "=><".includes(rightTrimmed[0]!)) return false;
	const leftVal = parseValue(left, ctx);
	const rightVal = parseValue(rightTrimmed, ctx);
	switch (op) {
		case "===":
			return leftVal === rightVal;
		case "!==":
			return leftVal !== rightVal;
		case "==":
			return leftVal == rightVal;
		case "!=":
			return leftVal != rightVal;
		case ">=":
			return leftVal >= rightVal;
		case "<=":
			return leftVal <= rightVal;
		case ">":
			return leftVal > rightVal;
		case "<":
			return leftVal < rightVal;
		default:
			return false;
	}
}

export function evaluateExpression(
	expr: string | undefined
): (ctx: Record<string, unknown>) => unknown {
	expr = expr?.trim();
	if (!expr) return () => undefined;

	// Handle literals
	if (expr in LITERALS) {
		const literalValue = LITERALS[expr];
		return () => literalValue;
	}

	// Handle numbers
	if (NUM_RE.test(expr)) {
		const numValue = parseFloat(expr);
		return () => numValue;
	}

	// Handle strings
	const strMatch = expr.match(STR_RE);
	if (strMatch) {
		const strValue = strMatch[1];
		return () => strValue;
	}

	// Handle ternary expressions
	const ternary = parseTernary(expr);
	if (ternary) {
		const conditionEval = evaluateExpression(ternary.condition);
		const trueEval = evaluateExpression(ternary.trueValue);
		const falseEval = evaluateExpression(ternary.falseValue);
		return (ctx) => (conditionEval(ctx) ? trueEval(ctx) : falseEval(ctx));
	}

	// Handle OR expressions
	const orMatch = expr.match(OR_RE);
	if (orMatch?.[1] && orMatch[2]) {
		const leftEval = evaluateExpression(orMatch[1]);
		const rightEval = evaluateExpression(orMatch[2]);
		return (ctx) => leftEval(ctx) || rightEval(ctx);
	}

	// Handle AND expressions
	const andMatch = expr.match(AND_RE);
	if (andMatch?.[1] && andMatch[2]) {
		const leftEval = evaluateExpression(andMatch[1]);
		const rightEval = evaluateExpression(andMatch[2]);
		return (ctx) => leftEval(ctx) && rightEval(ctx);
	}

	// Handle arithmetic expressions
	const arithMatch = expr.match(ARITH_RE);
	if (arithMatch?.[1] && arithMatch[3]) {
		const leftEval = evaluateExpression(arithMatch[1]);
		const rightEval = evaluateExpression(arithMatch[3]);
		const op = arithMatch[2];
		return (ctx) => {
			const leftVal = leftEval(ctx);
			const rightVal = rightEval(ctx);
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
		};
	}

	// Handle nullish coalescing
	const nullMatch = expr.match(NULL_RE);
	if (nullMatch?.[1] && nullMatch[2]) {
		const leftEval = evaluateExpression(nullMatch[1]);
		const rightEval = evaluateExpression(nullMatch[2]);
		return (ctx) => leftEval(ctx) ?? rightEval(ctx);
	}

	// Handle property access
	if (PROP_RE.test(expr)) {
		return (ctx) => {
			const result = evalProp(expr, ctx);
			return result === undefined &&
				!expr.includes(".") &&
				Object.keys(ctx).length === 0
				? expr
				: result;
		};
	}

	// Handle comparison expressions
	if (COMP_RE.test(expr)) {
		const compMatch = expr.match(COMP_RE);
		if (compMatch?.[1] && compMatch[3]) {
			const rightTrimmed = compMatch[3].trim();
			if (rightTrimmed && !"=><".includes(rightTrimmed[0]!)) {
				return (ctx) => evalComparison(expr, ctx);
			}
		}
		return () => expr;
	}

	// Handle general property access or fallback to string
	if (expr.includes(".") || /^[a-zA-Z_$]/.test(expr)) {
		return (ctx) => {
			const result = evalProp(expr, ctx);
			return result !== undefined ? result : expr;
		};
	}

	// Fallback to string literal
	return () => expr;
}
