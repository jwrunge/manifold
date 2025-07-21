// Simple manual test of expression parser
const SIMPLE_PROPERTY =
	/^[a-zA-Z_$][a-zA-Z0-9_$]*(?:\.[a-zA-Z_$][a-zA-Z0-9_$]*)*$/;
const SIMPLE_COMPARISON =
	/^([a-zA-Z_$][a-zA-Z0-9_$.]*)\s*(===|!==|>=|<=|==|!=|>|<)\s*(.+)$/;
const SIMPLE_NUMBER = /^-?\d+(\.\d+)?$/;
const SIMPLE_STRING = /^["'](.*)["']$/;

function evaluateSimpleProperty(expression, context) {
	const parts = expression.split(".");
	let result = context;

	for (const part of parts) {
		if (result == null) return undefined;
		result = result[part];
	}

	return result;
}

function parseSimpleValue(value, context) {
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

function evaluateExpression(expression, context) {
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
		// If result is undefined, fallback to string for simple identifiers
		// (but not for complex property paths which should remain undefined)
		if (result === undefined && !expression.includes(".")) {
			return expression;
		}
		return result;
	}

	// Simple comparison
	if (SIMPLE_COMPARISON.test(expression)) {
		const match = expression.match(SIMPLE_COMPARISON);
		// Validate that we have a complete comparison with non-empty right side
		if (match && match[1] && match[3] && match[3].trim()) {
			// return evaluateSimpleComparison(expression, context);
			return false; // Simplified for testing
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

// Test cases
const context = {
	$special: { _value: 42 },
	user123: { name456: "test" },
	user: { name: "Alice" },
};

console.log(
	"Testing $special._value:",
	evaluateExpression("$special._value", context)
);
console.log(
	"Testing user123.name456:",
	evaluateExpression("user123.name456", context)
);
console.log(
	"Testing regex match for $special._value:",
	SIMPLE_PROPERTY.test("$special._value")
);
console.log("Testing user.age >=:", evaluateExpression("user.age >=", context));
console.log(
	"Testing comparison regex for user.age >=:",
	SIMPLE_COMPARISON.test("user.age >=")
);
console.log("Testing nonexistent:", evaluateExpression("nonexistent", {}));
console.log("Testing unknownValue:", evaluateExpression("unknownValue", {}));
