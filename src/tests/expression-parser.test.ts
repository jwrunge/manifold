import { expect, test, describe } from "vitest";
import { evaluateExpression } from "../expression-parser";

describe("Expression Parser", () => {
	const evaluate = (expr: string, context: Record<string, unknown>) => {
		return evaluateExpression(expr)(context);
	};

	test("should work with new function signature", () => {
		const context = {
			user: { name: "Alice", age: 25 },
			items: [1, 2, 3],
		};

		expect(evaluate("user.name", context)).toBe("Alice");
		expect(evaluate("user.age", context)).toBe(25);
		expect(evaluate("items.length", context)).toBe(3);
	});

	test("should demonstrate performance benefit", () => {
		const context1 = { user: { age: 25 } };
		const context2 = { user: { age: 16 } };
		const context3 = { user: { age: 21 } };

		// Parse once, use many times
		const ageCheckEvaluator = evaluateExpression("user.age >= 18");

		expect(ageCheckEvaluator(context1)).toBe(true);
		expect(ageCheckEvaluator(context2)).toBe(false);
		expect(ageCheckEvaluator(context3)).toBe(true);
	});
});
