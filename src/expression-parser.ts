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

	if (expr.includes("'Number:") || expr.includes("@num")) {
		console.log("DEBUG parseArithmetic input:", JSON.stringify(expr));
	}

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
			// Make sure it's not a negative number
			const prevChar = i > 0 ? expr[i - 1] : "";
			if (char === "-" && prevChar && /[+\-*/]/.test(prevChar)) {
				continue; // This is a negative number, not an operator
			}
			lastOpIndex = i;
			lastOp = char;
			if (expr.includes("'Number:") || expr.includes("@num")) {
				console.log(
					"DEBUG parseArithmetic found operator:",
					char,
					"at index:",
					i
				);
			}
			break; // Found the rightmost operator
		}
	}

	if (lastOpIndex === -1) {
		if (expr.includes("'Number:") || expr.includes("@num")) {
			console.log("DEBUG parseArithmetic no operator found");
		}
		return null;
	}

	const result = {
		left: expr.slice(0, lastOpIndex).trim(),
		op: lastOp,
		right: expr.slice(lastOpIndex + 1).trim(),
	};

	if (expr.includes("'Number:") || expr.includes("@num")) {
		console.log("DEBUG parseArithmetic result:", result);
	}

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
	if (val.includes("'") || val.includes("@")) {
		console.log("DEBUG parseValue input:", JSON.stringify(val));
	}

	if (val in LITERALS) return LITERALS[val];
	if (NUM_RE.test(val)) return parseFloat(val);
	const strMatch = val.match(STR_RE);
	if (strMatch) {
		const result = strMatch[2]; // Second capture group contains the content
		if (val.includes("'")) {
			console.log(
				"DEBUG parseValue string match:",
				JSON.stringify(val),
				"->",
				JSON.stringify(result)
			);
		}
		return result;
	}

	// Handle state properties with @ prefix
	if (val.startsWith("@")) {
		const propName = val.slice(1); // Remove the @ prefix
		if (PROP_RE.test(propName)) {
			const result = evalProp(propName, ctx);
			console.log(
				"DEBUG parseValue state prop:",
				JSON.stringify(val),
				"->",
				result
			);
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

	// Debug logging for the problematic expression
	if (
		expr.includes("'Counter is '") ||
		expr.includes("@todo") ||
		expr.includes("@num") ||
		expr.includes("@index")
	) {
		console.log("DEBUG: Evaluating expression:", expr);
	}

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
		// Reject if the content contains @ (state references) - this indicates it's an expression, not a simple string
		if (!strValue.includes("@")) {
			return { fn: () => strValue, stateRefs };
		}
	}

	// Handle expressions wrapped in parentheses
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

	// Handle arithmetic expressions with proper left-to-right associativity
	const arithParse = parseArithmetic(expr);
	if (arithParse) {
		if (
			expr.includes("'Counter is '") ||
			expr.includes("@todo") ||
			expr.includes("@num") ||
			expr.includes("@index")
		) {
			console.log("DEBUG: Arithmetic parse found:", arithParse);
		}
		const leftEval = evaluateExpression(arithParse.left);
		const rightEval = evaluateExpression(arithParse.right);
		const op = arithParse.op;
		const allStateRefs = [...leftEval.stateRefs, ...rightEval.stateRefs];
		const uniqueStateRefs = [...new Set([...stateRefs, ...allStateRefs])];
		return {
			fn: (ctx) => {
				const leftVal = leftEval.fn(ctx);
				const rightVal = rightEval.fn(ctx);

				if (
					expr.includes("'Counter is '") ||
					expr.includes("@todo") ||
					expr.includes("@num") ||
					expr.includes("@index")
				) {
					console.log(
						"DEBUG: Evaluating arithmetic - left:",
						leftVal,
						"right:",
						rightVal
					);
					console.log("DEBUG: Context:", ctx);
				}

				if (op === "+") {
					// Handle both string concatenation and numeric addition
					if (
						typeof leftVal === "string" ||
						typeof rightVal === "string"
					) {
						const result =
							String(leftVal ?? "") + String(rightVal ?? "");
						if (
							expr.includes("'Counter is '") ||
							expr.includes("@todo") ||
							expr.includes("@num") ||
							expr.includes("@index")
						) {
							console.log(
								"DEBUG: String concatenation result:",
								result
							);
							console.log(
								"DEBUG: Left value:",
								leftVal,
								"Right value:",
								rightVal
							);
						}
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
		// Debug: Log when arithmetic parsing fails
		if (expr.includes("@index + ': '")) {
			console.log("DEBUG: Arithmetic parsing failed for:", expr);
		}
		if (expr.includes("@num") && expr.includes("+")) {
			console.log(
				"DEBUG: Arithmetic parsing FAILED for @num expression:",
				expr
			);
		}
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

	// Handle state references (@property)
	if (expr.startsWith("@")) {
		const propName = expr.slice(1); // Remove the @ prefix
		if (PROP_RE.test(propName)) {
			return {
				fn: (ctx) => {
					const result = evalProp(propName, ctx);
					if (expr.includes("'Counter is '")) {
						console.log(
							"DEBUG: State reference evaluation - prop:",
							propName,
							"result:",
							result,
							"ctx:",
							ctx
						);
					}
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
