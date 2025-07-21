// Debug the $special._value issue step by step
import { evaluateExpression } from "./src/simple-expression-parser.ts";

const context = {
	$special: { _value: 42 },
	user123: { name456: "test" },
};

console.log("Context:", context);
console.log(
	"Testing $special._value:",
	evaluateExpression("$special._value", context)
);
console.log(
	"Testing user123.name456:",
	evaluateExpression("user123.name456", context)
);

// Test access manually
console.log("\nManual access:");
console.log("context.$special:", context.$special);
console.log("context.$special._value:", context.$special._value);
console.log('context["$special"]:', context["$special"]);
console.log('context["$special"]["_value"]:', context["$special"]["_value"]);
