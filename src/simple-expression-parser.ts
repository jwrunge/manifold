/**
 * Simplified expression parser for Manifold
 * Optimized for bundle size and common use cases
 * Handles: property access, basic comparisons, simple arithmetic
 */

// Simple regex-based expression parser for common patterns
const SIMPLE_PROPERTY =
	/^[a-zA-Z_$][a-zA-Z0-9_$]*(?:\.[a-zA-Z_$][a-zA-Z0-9_$]*)*$/;
const SIMPLE_COMPARISON =
	/^([a-zA-Z_$][a-zA-Z0-9_$.]*)\s*(===|!==|==|!=|>=|<=|>|<)\s*(.+)$/;
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
	if (!match || !match[1] || !match[3]) return false;

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

	// Simple property access (most common case)
	if (SIMPLE_PROPERTY.test(expression)) {
		return evaluateSimpleProperty(expression, context);
	}

	// Simple comparison
	if (SIMPLE_COMPARISON.test(expression)) {
		return evaluateSimpleComparison(expression, context);
	}

	// Simple value
	return parseSimpleValue(expression, context);
}

/**
 * Extract variable names from expression for dependency tracking
 */
export function extractVariableNames(expression: string): string[] {
	const variables = new Set<string>();

	// Simple property pattern
	const propertyMatches = expression.match(
		/[a-zA-Z_$][a-zA-Z0-9_$]*(?:\.[a-zA-Z_$][a-zA-Z0-9_$]*)*/g
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
