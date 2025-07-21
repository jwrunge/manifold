/**
 * Simplified expression parser for Manifold
 * Optimized for bundle size and common use cases
 * Handles: property access, basic comparisons, simple arithmetic
 */

// Simple regex-based expression parser for common patterns
const SIMPLE_PROPERTY =
	/^[a-zA-Z_$][a-zA-Z0-9_$]*(?:\.[a-zA-Z_$][a-zA-Z0-9_$]*)*$/;
const SIMPLE_COMPARISON =
	/^([a-zA-Z_$][a-zA-Z0-9_$.]*)\s*(===|!==|>=|<=|==|!=|>|<)\s*(.+)$/;
const SIMPLE_NUMBER = /^-?\d+(\.\d+)?$/;
const SIMPLE_STRING = /^["'](.*)["']$/;

/**
 * Fast path for simple property access like "user.name" or "items.length"
 */
function evaluateSimpleProperty(
	expression: string,
	context: Record<string, any>
): any {
	const parts = expression.split(".");
	let result = context;

	for (const part of parts) {
		if (result == null) return undefined;
		result = result[part];
	}

	return result;
}

/**
 * Parse a simple value (number, string, or property reference)
 */
function parseSimpleValue(value: string, context: Record<string, any>): any {
	value = value.trim();

	// Number
	if (SIMPLE_NUMBER.test(value)) {
		return parseFloat(value);
	}

	// String
	const stringMatch = value.match(SIMPLE_STRING);
	if (stringMatch) {
		return stringMatch[1];
	}

	// Boolean
	if (value === "true") return true;
	if (value === "false") return false;
	if (value === "null") return null;
	if (value === "undefined") return undefined;

	// Property access
	if (SIMPLE_PROPERTY.test(value)) {
		return evaluateSimpleProperty(value, context);
	}

	// Fallback to string
	return value;
}

/**
 * Evaluate a simple comparison expression
 */
function evaluateSimpleComparison(
	expression: string,
	context: Record<string, any>
): boolean {
	const match = expression.match(SIMPLE_COMPARISON);
	if (
		!match ||
		!match[1] ||
		!match[3] ||
		match[3].trim() === "=" ||
		match[3].trim().startsWith(">") ||
		match[3].trim().startsWith("<") ||
		match[3].trim().startsWith("=")
	)
		return false;

	const [, left, operator, right] = match;
	const leftValue = parseSimpleValue(left, context);
	const rightValue = parseSimpleValue(right, context);

	switch (operator) {
		case "===":
			return leftValue === rightValue;
		case "!==":
			return leftValue !== rightValue;
		case "==":
			return leftValue == rightValue;
		case "!=":
			return leftValue != rightValue;
		case ">=":
			return leftValue >= rightValue;
		case "<=":
			return leftValue <= rightValue;
		case ">":
			return leftValue > rightValue;
		case "<":
			return leftValue < rightValue;
		default:
			return false;
	}
}

/**
 * Main evaluation function - simplified for common use cases
 */
export function evaluateExpression(
	expression: string,
	context: Record<string, any>
): any {
	expression = expression.trim();

	// Empty expression
	if (!expression) return undefined;

	// Check for literals first (before property access)
	// Boolean
	if (expression === "true") return true;
	if (expression === "false") return false;
	if (expression === "null") return null;
	if (expression === "undefined") return undefined;

	// Number
	if (SIMPLE_NUMBER.test(expression)) {
		return parseFloat(expression);
	}

	// String
	const stringMatch = expression.match(SIMPLE_STRING);
	if (stringMatch) {
		return stringMatch[1];
	}

	// Simple property access (most common case)
	if (SIMPLE_PROPERTY.test(expression)) {
		const result = evaluateSimpleProperty(expression, context);
		// If result is undefined, fallback behavior depends on context:
		// - Empty context: fallback to string for simple identifiers
		// - Non-empty context: return undefined for missing properties
		if (result === undefined && !expression.includes(".")) {
			const hasAnyProperties = Object.keys(context).length > 0;
			return hasAnyProperties ? undefined : expression;
		}
		return result;
	}

	// Simple comparison
	if (SIMPLE_COMPARISON.test(expression)) {
		const match = expression.match(SIMPLE_COMPARISON);
		// Validate that we have a complete comparison with a valid right side
		// A single "=" or starting with an operator is not valid
		if (
			match &&
			match[1] &&
			match[3] &&
			match[3].trim() &&
			match[3].trim() !== "=" &&
			!match[3].trim().startsWith(">") &&
			!match[3].trim().startsWith("<") &&
			!match[3].trim().startsWith("=")
		) {
			return evaluateSimpleComparison(expression, context);
		}
		// If comparison regex matches but is malformed, fallback to string
		return expression;
	}

	// Try to evaluate as property access even if regex doesn't match
	// (fallback for edge cases)
	if (expression.includes(".") || /^[a-zA-Z_$]/.test(expression)) {
		const result = evaluateSimpleProperty(expression, context);
		if (result !== undefined) {
			return result;
		}
	}

	// Fallback to string for unknown values
	return expression;
}

/**
 * Extract variable names from expression for dependency tracking
 */
export function extractVariableNames(expression: string): string[] {
	const variables = new Set<string>();

	// Remove quoted strings first to avoid extracting from them
	const cleanExpression = expression.replace(/["']([^"']*)["']/g, "");

	// Simple property pattern
	const propertyMatches = cleanExpression.match(
		/[a-zA-Z_$][a-zA-Z0-9_$]*(?:\.[a-zA-Z_$0-9][a-zA-Z0-9_$]*)*/g
	);
	if (propertyMatches) {
		for (const match of propertyMatches) {
			// Skip literals
			if (
				match === "true" ||
				match === "false" ||
				match === "null" ||
				match === "undefined"
			) {
				continue;
			}
			// Get root variable name
			const root = match.split(".")[0];
			if (root) {
				variables.add(root);
			}
		}
	}

	return Array.from(variables);
}
