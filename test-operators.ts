// Test the new || and ?? operators
import {
	evaluateExpression,
	extractVariableNames,
} from "./src/simple-expression-parser";

console.log("=== Testing Logical OR (||) ===");

const context1 = {
	user: { name: "Alice", email: null },
	fallback: "default@example.com",
};

console.log(
	"user.email || fallback:",
	evaluateExpression("user.email || fallback", context1)
);
console.log(
	'user.name || "Anonymous":',
	evaluateExpression('user.name || "Anonymous"', context1)
);
console.log(
	'user.missing || "Not found":',
	evaluateExpression('user.missing || "Not found"', context1)
);

console.log("\n=== Testing Nullish Coalescing (??) ===");

const context2 = {
	user: { name: "Alice", email: null, count: 0 },
	fallback: "default@example.com",
};

console.log(
	"user.email ?? fallback:",
	evaluateExpression("user.email ?? fallback", context2)
);
console.log(
	"user.count ?? 10:",
	evaluateExpression("user.count ?? 10", context2)
); // Should return 0, not 10
console.log(
	'user.missing ?? "Not found":',
	evaluateExpression('user.missing ?? "Not found"', context2)
);

console.log("\n=== Testing Variable Extraction ===");
console.log(
	'Extract from "user.email || fallback":',
	extractVariableNames("user.email || fallback")
);
console.log(
	'Extract from "user.name ?? defaultName":',
	extractVariableNames("user.name ?? defaultName")
);

console.log("\n=== Difference between || and ?? ===");
const context3 = { value: 0, name: "" };
console.log(
	"value || 10 (falsy 0):",
	evaluateExpression("value || 10", context3)
); // Should return 10
console.log(
	"value ?? 10 (not null):",
	evaluateExpression("value ?? 10", context3)
); // Should return 0
console.log(
	'name || "default" (empty string):',
	evaluateExpression('name || "default"', context3)
); // Should return "default"
console.log(
	'name ?? "default" (not null):',
	evaluateExpression('name ?? "default"', context3)
); // Should return ""
