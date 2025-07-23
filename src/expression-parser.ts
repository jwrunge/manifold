const PROP_RE = /^[a-zA-Z_$][a-zA-Z0-9_$]*(?:\.[a-zA-Z_$][a-zA-Z0-9_$]*)*$/;
const COMP_RE =
	/^([a-zA-Z_$][a-zA-Z0-9_$.]*)\s*(===|!==|>=|<=|==|!=|>|<)\s*(.+)$/;
const NUM_RE = /^-?\d+(\.\d+)?$/;
const STR_RE = /^["'`](.*)["'`]$/;
const OR_RE = /^(.+?)\s*\|\|\s*(.+)$/;
const NULL_RE = /^(.+?)\s*\?\?\s*(.+)$/;

// Combined literal map for reuse
const LITERALS: Record<string, any> = {
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

function evalProp(expr: string, ctx: Record<string, any>) {
	const parts = expr.split(".");
	let result = ctx;
	for (const part of parts) {
		if (result == null) return undefined;
		result = result[part];
	}
	return result;
}

// Simplified value parser that checks literals first, then numbers, then strings
function parseValue(val: string, ctx: Record<string, any>): any {
	val = val.trim();

	// Check literals first (most common)
	if (val in LITERALS) return LITERALS[val];

	// Check numbers
	if (NUM_RE.test(val)) return parseFloat(val);

	// Check strings
	const strMatch = val.match(STR_RE);
	if (strMatch) return strMatch[1];

	// Property access
	if (PROP_RE.test(val)) return evalProp(val, ctx);

	return val;
}

function evalComparison(expr: string, ctx: Record<string, any>): boolean {
	const match = expr.match(COMP_RE);
	if (!match || !match[1] || !match[3]) return false;

	const [, left, op, right] = match;
	const rightTrimmed = right.trim();
	// Quick validation to avoid malformed operators
	if (
		!rightTrimmed ||
		rightTrimmed[0] === "=" ||
		rightTrimmed[0] === ">" ||
		rightTrimmed[0] === "<"
	)
		return false;

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
	expr: string,
	ctx: Record<string, any>
): any {
	expr = expr.trim();
	if (!expr) return undefined;

	// Check literals first (most common case)
	if (expr in LITERALS) return LITERALS[expr];

	// Check numbers
	if (NUM_RE.test(expr)) return parseFloat(expr);

	// Check strings
	const strMatch = expr.match(STR_RE);
	if (strMatch) return strMatch[1];

	// Ternary conditional
	const ternary = parseTernary(expr);
	if (ternary) {
		return evaluateExpression(ternary.condition, ctx)
			? evaluateExpression(ternary.trueValue, ctx)
			: evaluateExpression(ternary.falseValue, ctx);
	}

	// Logical OR
	const orMatch = expr.match(OR_RE);
	if (orMatch && orMatch[1] && orMatch[2]) {
		const leftVal = evaluateExpression(orMatch[1], ctx);
		return leftVal || evaluateExpression(orMatch[2], ctx);
	}

	// Nullish coalescing
	const nullMatch = expr.match(NULL_RE);
	if (nullMatch && nullMatch[1] && nullMatch[2]) {
		const leftVal = evaluateExpression(nullMatch[1], ctx);
		return leftVal ?? evaluateExpression(nullMatch[2], ctx);
	}

	// Property access
	if (PROP_RE.test(expr)) {
		const result = evalProp(expr, ctx);
		return result === undefined &&
			!expr.includes(".") &&
			Object.keys(ctx).length === 0
			? expr
			: result;
	}

	// Comparison operations
	if (COMP_RE.test(expr)) {
		const compMatch = expr.match(COMP_RE);
		if (compMatch && compMatch[1] && compMatch[3]) {
			const rightTrimmed = compMatch[3].trim();
			if (
				rightTrimmed &&
				rightTrimmed[0] !== "=" &&
				rightTrimmed[0] !== ">" &&
				rightTrimmed[0] !== "<"
			) {
				return evalComparison(expr, ctx);
			}
		}
		return expr;
	}

	// Fallback property access for edge cases
	if (expr.includes(".") || /^[a-zA-Z_$]/.test(expr)) {
		const result = evalProp(expr, ctx);
		if (result !== undefined) return result;
	}

	return expr;
}

export function extractVariableNames(expr: string): string[] {
	const vars = new Set<string>();
	const clean = expr.replace(/["']([^"']*)["']/g, "");
	const matches = clean.match(
		/[a-zA-Z_$][a-zA-Z0-9_$]*(?:\.[a-zA-Z_$0-9][a-zA-Z0-9_$]*)*/g
	);

	if (matches) {
		for (const match of matches) {
			if (!(match in LITERALS)) {
				const root = match.split(".")[0];
				if (root) vars.add(root);
			}
		}
	}

	return Array.from(vars);
}
