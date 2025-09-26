import { beforeEach, describe, expect, test } from "vitest";
import evaluateExpression from "../src/expression-parser";
import StateBuilder from "../src/main";

let rootState: Record<string, unknown> = {};
const initState = (data: Record<string, unknown>) => {
	rootState = StateBuilder.create(
		undefined,
		data as Record<string, unknown>,
	).build() as Record<string, unknown>;
};

describe("Expression Parser", () => {
	beforeEach(() => {
		initState({});
	});

	const run = (expr: string, ctx: Record<string, unknown> = {}) => {
		const parsed = evaluateExpression(expr);
		// Always provide injected state for resolution
		return parsed._fn({ ...ctx, state: rootState });
	};

	describe("Literals", () => {
		test("booleans / null / undefined", () => {
			expect(run("true")).toBe(true);
			expect(run("false")).toBe(false);
			expect(run("null")).toBeNull();
			expect(run("undefined")).toBeUndefined();
		});
		test("numbers", () => {
			expect(run("42")).toBe(42);
			expect(run("-17")).toBe(-17);
			expect(run("3.14")).toBe(3.14);
		});
		test("strings", () => {
			expect(run("'hi'")).toBe("hi");
			expect(run('"world"')).toBe("world");
		});
	});

	describe("Property Access", () => {
		test("simple + nested", () => {
			const ctx: Record<string, unknown> = {
				user: { name: "Alice", info: { age: 30 } },
				list: [1, 2, 3],
			};
			expect(run("user.name", ctx)).toBe("Alice");
			expect(run("user.info.age", ctx)).toBe(30);
			expect(run("list.length", ctx)).toBe(3);
		});
		test("missing returns undefined", () => {
			expect(run("user.x", { user: {} })).toBeUndefined();
			expect(run("missing.prop", {})).toBeUndefined();
		});
		test("state via injected context (state)", () => {
			initState({ count: 5 });
			const parsed = evaluateExpression("count");
			expect(parsed._fn({ state: rootState })).toBe(5);
		});
		test("dynamic index access", () => {
			initState({
				list: [10, 20, 30],
				matrix: [
					[1, 2],
					[3, 4],
				],
			});
			const ctx = { i: 1, j: 0 };
			expect(run("list[i]", ctx)).toBe(20);
			expect(run("matrix[i][j]", ctx)).toBe(3);
		});
	});

	describe("Arithmetic", () => {
		test("operations & precedence", () => {
			const ctx = { a: 10, b: 3, c: 2 } as const;
			expect(run("a + b", ctx)).toBe(13);
			expect(run("a - b", ctx)).toBe(7);
			expect(run("a * c", ctx)).toBe(20);
			expect(run("a / b", ctx)).toBeCloseTo(3.333, 3);
			expect(run("a + b * c", ctx)).toBe(16); // * before +
			expect(run("(a + b) * c", ctx)).toBe(26);
		});
		test("string concatenation", () => {
			const ctx = { name: "Alice", i: 0 } as const;
			expect(run("'Hello ' + name", ctx)).toBe("Hello Alice");
			expect(run("i + ': ' + name", ctx)).toBe("0: Alice");
		});
		test("division by zero returns undefined", () => {
			expect(run("10 / 0")).toBeUndefined();
		});
	});

	describe("Unary / Logical / Comparison", () => {
		test("unary", () => {
			expect(run("-5")).toBe(-5);
			expect(run("!-0")).toBe(true); // -0 is falsy
		});
		test("logical", () => {
			const ctx = { a: true, b: false, c: "hi" } as const;
			expect(run("a && c", ctx)).toBe("hi");
			expect(run("a && b", ctx)).toBe(false);
			expect(run("b || c", ctx)).toBe("hi");
			expect(run("b || a", ctx)).toBe(true);
		});
		test("comparison", () => {
			const ctx = { x: 5, y: 5, z: 2 } as const;
			expect(run("x === y", ctx)).toBe(true);
			expect(run("x !== z", ctx)).toBe(true);
			expect(run("z < x", ctx)).toBe(true);
			expect(run("z <= 2", ctx)).toBe(true);
			expect(run("x >= 5", ctx)).toBe(true);
		});
	});

	describe("Ternary", () => {
		test("basic & nested", () => {
			const ctx = { n: 85 } as const;
			expect(run("n >= 90 ? 'A' : n >= 80 ? 'B' : 'C'", ctx)).toBe("B");
		});
	});
	// Note: Assignment and arrow function parsing are not supported by the current parser.
	// Use _syncRef tests below to validate state updates via reference setters.

	describe("Assignments via _syncRef", () => {
		beforeEach(() => initState({ count: 1, user: { age: 30 } }));
		test("simple root setter", () => {
			const parsed = evaluateExpression("count");
			expect(typeof parsed._fn).toBe("function");
			expect(typeof parsed._syncRef).toBe("function");
			parsed._syncRef?.({ state: rootState }, 2);
			expect(rootState.count).toBe(2);
		});
		test("nested object property setter", () => {
			const parsed = evaluateExpression("user.age");
			parsed._syncRef?.({ state: rootState }, 31);
			const user = rootState.user as Record<string, unknown> | undefined;
			expect(user?.age).toBe(31);
		});
		test("broken path early exit", () => {
			const parsed = evaluateExpression("user.missing.prop");
			// should not throw; and should not create missing path
			parsed._syncRef?.({ state: rootState }, 5);
			const user = rootState.user as Record<string, unknown> | undefined;
			expect(user?.missing).toBeUndefined();
		});
		test("parentheses cannot enable assignment", () => {
			// Without assignment support, treated as plain string fallback (no assignment performed)
			const r = run("(count = 10)");
			expect(r).toBe("count = 10");
			expect(rootState.count).toBe(1); // unchanged
		});
		test("bare assignment without wrapper is not executed", () => {
			initState({ count: 7 });
			const res = run("count = 9"); // no assignment executed
			expect(res).toBe("count = 9");
			expect(rootState.count).toBe(7);
		});
	});
	describe("Function Calls", () => {
		beforeEach(() =>
			initState({
				inc: (x: number) => x + 1,
				sum: (a: number, b: number) => a + b,
			}),
		);
		test("calls state functions", () => {
			expect(run("inc(4)")).toBe(5);
			expect(run("sum(2,3)")).toBe(5);
		});
		test("does not call unregistered globals", () => {
			expect(run("Math.max(1,2)")).toBeUndefined();
		});
	});

	describe("Edge Cases", () => {
		test("empty expression", () => {
			expect(run("")).toBeUndefined();
			expect(run("   ")).toBeUndefined();
		});
		test("unknown identifier returns undefined", () => {
			expect(run("missing")).toBeUndefined();
		});
		test("ternary with state variable", () => {
			initState({ count: 1 });
			expect(run("count === 1 ? 10 : 20")).toBe(10);
		});
	});

	describe("Performance / Caching", () => {
		test("reuses cached parsed object", () => {
			const p1 = evaluateExpression("a + 1");
			const p2 = evaluateExpression("a + 1");
			expect(p1).toBe(p2); // same object reference from cache
		});
	});
});
