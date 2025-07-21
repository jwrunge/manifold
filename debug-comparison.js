// Debug what path "user.age >=" takes through the parser
const SIMPLE_PROPERTY =
	/^[a-zA-Z_$][a-zA-Z0-9_$]*(?:\.[a-zA-Z_$][a-zA-Z0-9_$]*)*$/;
const SIMPLE_COMPARISON =
	/^([a-zA-Z_$][a-zA-Z0-9_$.]*)\s*(===|!==|>=|<=|==|!=|>|<)\s*(.+)$/;

const expression = "user.age >=";
const context = { user: { age: 25 } };

console.log("Expression:", expression);
console.log("Trimmed:", expression.trim());

// Test each step
console.log("\n--- Step by step ---");
console.log("1. Is it a literal? false");
console.log("2. SIMPLE_PROPERTY test:", SIMPLE_PROPERTY.test(expression));
console.log("3. SIMPLE_COMPARISON test:", SIMPLE_COMPARISON.test(expression));

const match = expression.match(SIMPLE_COMPARISON);
console.log("4. Comparison match:", match);

if (match) {
	console.log("   Left:", JSON.stringify(match[1]));
	console.log("   Operator:", JSON.stringify(match[2]));
	console.log("   Right:", JSON.stringify(match[3]));
	console.log("   Right trimmed:", JSON.stringify(match[3].trim()));
	console.log("   Has right side:", !!(match[3] && match[3].trim()));
}

// Test fallback logic
console.log("5. Includes dot?", expression.includes("."));
console.log("6. Starts with identifier?", /^[a-zA-Z_$]/.test(expression));

// Simulate simple property evaluation
function evaluateSimpleProperty(expression, context) {
	const parts = expression.split(".");
	let result = context;

	for (const part of parts) {
		if (result == null) return undefined;
		result = result[part];
	}

	return result;
}

const propResult = evaluateSimpleProperty(expression, context);
console.log("7. Property evaluation result:", propResult);
console.log("8. Property result is undefined?", propResult === undefined);
