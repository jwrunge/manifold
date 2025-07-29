const ID = "[a-zA-Z_$][a-zA-Z0-9_$]*";
const PROP = `${ID}(?:\\.${ID})*`;
const STATE_PROP = `@${PROP}`;
const PROP_RE = new RegExp(`^${PROP}$`);
const VALUE = `(?:${STATE_PROP}|${PROP}|-?\\d+(?:\\.\\d+)?|["'][^"']*["']|\`[^\`]*\`|true|false|null|undefined)`;
const COMP_RE = new RegExp(`^(${VALUE})\\s*(===|!==|>=|<=|==|!=|>|<)\\s*(.+)$`);
const NUM_RE = /^-?\d+(\.\d+)?$/;
// Simple string regex for basic string literals
const STR_RE = /^(['"`])(.*?)\1$/;
const OR_RE = /^(.+?)\s*\|\|\s*(.+)$/;
const NULL_RE = /^(.+?)\s*\?\?\s*(.+)$/;
const AND_RE = /^(.+?)\s*&&\s*(.+)$/;
const NEG_RE = /^!\s*(.+)$/;
export const STATE_RE = new RegExp(STATE_PROP, "g");

const LITERALS: Record<string, unknown> = {
	true: true,
	false: false,
	null: null,
	undefined: undefined,
};

// Parse arithmetic expressions with proper left-to-right associativity
const parseArithmetic = (
	expr: string
): { left: string; op: string; right: string } | null => {
	let depth = 0;
	let ternaryDepth = 0;
	let lastOpIndex = -1;
	let lastOp = "";
	let inQuotes = false;
	let quoteChar = "";

	// Find the rightmost operator at depth 0 (outside parentheses and ternary expressions)
	for (let i = expr.length - 1; i >= 0; i--) {
		const char = expr[i];
		if (!char) continue;

		// Handle quotes
		if (
			(char === '"' || char === "'") &&
			(i === 0 || expr[i - 1] !== "\\")
		) {
			if (!inQuotes) {
				inQuotes = true;
				quoteChar = char;
			} else if (char === quoteChar) {
				inQuotes = false;
				quoteChar = "";
			}
			continue;
		}

		if (inQuotes) continue; // Skip characters inside quotes

		if (char === ")") depth++;
		else if (char === "(") depth--;
		else if (char === "?") ternaryDepth++;
		else if (char === ":") ternaryDepth--;
		else if (depth === 0 && ternaryDepth === 0 && /[+\-*/]/.test(char)) {
			// Make sure it's not a negative number at the start or after operators/spaces
			if (char === "-") {
				const prevPart = expr.slice(0, i).trim();
				// If it's at the start or after an operator, it's likely a negative number
				if (prevPart === "" || /[+\-*/=<>!&|?:]$/.test(prevPart)) {
					continue; // This is a negative number, not an operator
				}
			}
			lastOpIndex = i;
			lastOp = char;
			break; // Found the rightmost operator
		}
	}

	if (lastOpIndex === -1) {
		return null;
	}

	const result = {
		left: expr.slice(0, lastOpIndex).trim(),
		op: lastOp,
		right: expr.slice(lastOpIndex + 1).trim(),
	};

	return result;
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
	if (strMatch) {
		const result = strMatch[2]; // Second capture group contains the content
		return result;
	}

	// Handle state properties with @ prefix
	if (val.startsWith("@")) {
		const propName = val.slice(1); // Remove the @ prefix
		if (PROP_RE.test(propName)) {
			const result = evalProp(propName, ctx);
			return result;
		}
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

	// Handle strings (but reject if they contain expressions)
	const strMatch = expr.match(STR_RE);
	if (strMatch && strMatch[2] !== undefined) {
		const strValue = strMatch[2]; // Second capture group contains the content
		// Reject if the content contains @ (state references) or if there are operators outside quotes
		// indicating it's an expression, not a simple string
		if (!strValue.includes("@")) {
			// Also check if there are unquoted operators in the original expression
			let inQuotes = false;
			let quoteChar = "";
			let hasOperatorsOutsideQuotes = false;

			for (let i = 0; i < expr.length; i++) {
				const char = expr[i];
				if (!char) continue;
				if (
					(char === '"' || char === "'") &&
					(i === 0 || expr[i - 1] !== "\\")
				) {
					if (!inQuotes) {
						inQuotes = true;
						quoteChar = char;
					} else if (char === quoteChar) {
						inQuotes = false;
						quoteChar = "";
					}
				} else if (!inQuotes && /[+\-*/]/.test(char)) {
					hasOperatorsOutsideQuotes = true;
					break;
				}
			}

			if (!hasOperatorsOutsideQuotes) {
				return { fn: () => strValue, stateRefs };
			}
		}
	}

	// Handle expressions wrapped in parentheses FIRST (before ternary and arithmetic)
	if (expr.startsWith("(") && expr.endsWith(")")) {
		// Check if the parentheses are balanced and wrap the entire expression
		let depth = 0;
		let isFullyWrapped = true;
		for (let i = 0; i < expr.length; i++) {
			if (expr[i] === "(") depth++;
			else if (expr[i] === ")") depth--;

			// If depth becomes 0 before the last character, parentheses don't wrap the whole expression
			if (depth === 0 && i < expr.length - 1) {
				isFullyWrapped = false;
				break;
			}
		}

		if (isFullyWrapped) {
			// Strip outer parentheses and evaluate the inner expression
			const innerExpr = expr.slice(1, -1).trim();
			return evaluateExpression(innerExpr);
		}
	}

	// Handle ternary expressions
	const ternary = parseTernary(expr);
	if (ternary) {
		const conditionEval = evaluateExpression(ternary._condition);
		const trueEval = evaluateExpression(ternary._trueValue);
		const falseEval = evaluateExpression(ternary._falseValue);
		const allStateRefs = [
			...stateRefs,
			...conditionEval.stateRefs,
			...trueEval.stateRefs,
			...falseEval.stateRefs,
		];
		const uniqueStateRefs = [...new Set(allStateRefs)];
		return {
			fn: (ctx) =>
				conditionEval.fn(ctx) ? trueEval.fn(ctx) : falseEval.fn(ctx),
			stateRefs: uniqueStateRefs,
		};
	}

	// Handle negation operator (!)
	const negMatch = expr.match(NEG_RE);
	if (negMatch?.[1]) {
		const innerEval = evaluateExpression(negMatch[1]);
		const allStateRefs = [...stateRefs, ...innerEval.stateRefs];
		const uniqueStateRefs = [...new Set(allStateRefs)];
		return {
			fn: (ctx) => !innerEval.fn(ctx),
			stateRefs: uniqueStateRefs,
		};
	}

	// Handle unary minus (negative) expressions
	if (expr.startsWith("-") && expr.length > 1) {
		const innerExpr = expr.slice(1).trim();
		const innerEval = evaluateExpression(innerExpr);
		const allStateRefs = [...stateRefs, ...innerEval.stateRefs];
		const uniqueStateRefs = [...new Set(allStateRefs)];
		return {
			fn: (ctx) => {
				const value = innerEval.fn(ctx);
				return typeof value === "number" ? -value : undefined;
			},
			stateRefs: uniqueStateRefs,
		};
	}

	// Handle OR expressions
	const orMatch = expr.match(OR_RE);
	if (orMatch?.[1] && orMatch[2]) {
		const leftEval = evaluateExpression(orMatch[1]);
		const rightEval = evaluateExpression(orMatch[2]);
		const allStateRefs = [
			...stateRefs,
			...leftEval.stateRefs,
			...rightEval.stateRefs,
		];
		const uniqueStateRefs = [...new Set(allStateRefs)];
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
		const allStateRefs = [
			...stateRefs,
			...leftEval.stateRefs,
			...rightEval.stateRefs,
		];
		const uniqueStateRefs = [...new Set(allStateRefs)];
		return {
			fn: (ctx) => leftEval.fn(ctx) && rightEval.fn(ctx),
			stateRefs: uniqueStateRefs,
		};
	}

	// Handle arithmetic expressions with proper left-to-right associativity
	const arithParse = parseArithmetic(expr);
	if (arithParse) {
		const leftEval = evaluateExpression(arithParse.left);
		const rightEval = evaluateExpression(arithParse.right);
		const op = arithParse.op;
		const allStateRefs = [
			...stateRefs,
			...leftEval.stateRefs,
			...rightEval.stateRefs,
		];
		const uniqueStateRefs = [...new Set(allStateRefs)];
		return {
			fn: (ctx) => {
				const leftVal = leftEval.fn(ctx);
				const rightVal = rightEval.fn(ctx);

				if (op === "+") {
					// Handle both string concatenation and numeric addition
					if (
						typeof leftVal === "string" ||
						typeof rightVal === "string"
					) {
						const result =
							String(leftVal ?? "") + String(rightVal ?? "");
						return result;
					} else if (
						typeof leftVal === "number" &&
						typeof rightVal === "number"
					) {
						return leftVal + rightVal;
					}
				} else if (
					typeof leftVal === "number" &&
					typeof rightVal === "number"
				) {
					// Handle numeric operations
					return op === "-"
						? leftVal - rightVal
						: op === "*"
						? leftVal * rightVal
						: op === "/"
						? leftVal / rightVal
						: undefined;
				}
				return undefined;
			},
			stateRefs: uniqueStateRefs,
		};
	} else {
		// Arithmetic parsing failed, continue with other parsing methods
	}

	// Handle nullish coalescing
	const nullMatch = expr.match(NULL_RE);
	if (nullMatch?.[1] && nullMatch[2]) {
		const leftEval = evaluateExpression(nullMatch[1]);
		const rightEval = evaluateExpression(nullMatch[2]);
		const allStateRefs = [
			...stateRefs,
			...leftEval.stateRefs,
			...rightEval.stateRefs,
		];
		const uniqueStateRefs = [...new Set(allStateRefs)];
		return {
			fn: (ctx) => leftEval.fn(ctx) ?? rightEval.fn(ctx),
			stateRefs: uniqueStateRefs,
		};
	}

	// Handle state references (@property)
	if (expr.startsWith("@")) {
		const propName = expr.slice(1); // Remove the @ prefix
		if (PROP_RE.test(propName)) {
			return {
				fn: (ctx) => {
					const result = evalProp(propName, ctx);
					return result;
				},
				stateRefs,
			};
		}
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
