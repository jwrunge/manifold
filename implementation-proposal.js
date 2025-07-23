// Implementation proposal for || and ?? operators

// Add new regex patterns
const LOGICAL_OR = /^(.+?)\s*\|\|\s*(.+)$/;
const NULLISH_COALESCING = /^(.+?)\s*\?\?\s*(.+)$/;

// Add to evaluateExpression function, before existing comparisons:

// Logical OR operator
if (LOGICAL_OR.test(expression)) {
	const match = expression.match(LOGICAL_OR);
	if (match && match[1] && match[2]) {
		const leftValue = evaluateExpression(match[1], context);
		// Short-circuit evaluation: return left if truthy, otherwise evaluate right
		return leftValue || evaluateExpression(match[2], context);
	}
}

// Nullish coalescing operator
if (NULLISH_COALESCING.test(expression)) {
	const match = expression.match(NULLISH_COALESCING);
	if (match && match[1] && match[2]) {
		const leftValue = evaluateExpression(match[1], context);
		// Return left if not null/undefined, otherwise evaluate right
		return leftValue ?? evaluateExpression(match[2], context);
	}
}

// Example usage after implementation:
// evaluateExpression("user.email || 'No email'", context)
// evaluateExpression("user.name ?? 'Anonymous'", context)
