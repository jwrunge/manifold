import { beforeEach, describe, expect, test } from "vitest";
import evaluateExpression from "../src/expression-parser";
import StateBuilder from "../src/main";

let rootState: Record<string, unknown> = {};
const initState = (data: Record<string, unknown>) => {
	rootState = StateBuilder.create(data as Record<string, unknown>).build()
		.state as Record<string, unknown>;
};

describe("Expression Parser", () => {
	beforeEach(() => {
		initState({});
	});

	const run = (expr: string, ctx: Record<string, unknown> = {}) => {
		const parsed = evaluateExpression(expr);
		// Always provide injected state for resolution
		return parsed.fn({ ...ctx, __state: rootState });
	};

	const refs = (expr: string) =>
		Array.from(evaluateExpression(expr).stateRefs);

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
			expect(run("`template`")).toBe("template");
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
		test("state via injected context (__state)", () => {
			initState({ count: 5 });
			const parsed = evaluateExpression("count");
			expect(parsed.fn({ __state: rootState })).toBe(5);
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

	describe("Assignments (injected state)", () => {
		beforeEach(() => initState({ count: 1, user: { age: 30 } }));
		test("simple root (must be wrapped in ()=> to allow assignment)", () => {
			const parsed = evaluateExpression("()=> count = count + 1");
			expect(parsed.fn({ __state: rootState })).toBe(2);
			expect(rootState.count).toBe(2);
		});
		test("nested object property", () => {
			const parsed = evaluateExpression("()=> user.age = 31");
			expect(parsed.fn({ __state: rootState })).toBe(31);
			const user = rootState.user as Record<string, unknown> | undefined;
			expect(user?.age).toBe(31);
		});
		test("broken path early exit", () => {
			const parsed = evaluateExpression("()=> user.missing.prop = 5");
			const result = parsed.fn({ __state: rootState });
			// traversal stops early; no throw; returns RHS
			expect(result).toBe(5);
			const user = rootState.user as Record<string, unknown> | undefined;
			expect(user?.missing).toBeUndefined();
		});
		test("parentheses cannot enable assignment", () => {
			// Without ()=> wrapper, treated as plain string fallback (no assignment performed)
			const r = run("(count = 10)");
			expect(r).toBe("count = 10");
			expect(rootState["count"]).toBe(1); // unchanged
		});
		test("bare assignment without ()=> wrapper is not executed", () => {
			initState({ count: 7 });
			const res = run("count = 9"); // no assignment executed
			expect(res).toBe("count = 9");
			expect(rootState.count).toBe(7);
		});
	});

	describe("Arrow Functions", () => {
		beforeEach(() => initState({}));
		test("single param uses context variable", () => {
			const ctx = { x: 4 };
			expect(run("(x)=> x + 1", ctx)).toBe(5);
		});
		test("param must exist in context", () => {
			const ctx = { value: 10 };
			// (n)=> n*2 ; n not provided -> undefined * 2 -> NaN
			expect(run("(n)=> n * 2", ctx)).toBeNaN();
		});
		test("no param arrow", () => {
			expect(run("()=> 42")).toBe(42);
		});
		test("captures state var via injected context", () => {
			initState({ count: 2 });
			const parsed = evaluateExpression("()=> count + 3");
			expect(parsed.fn({ __state: rootState })).toBe(5);
		});
	});

	describe("State Refs Extraction", () => {
		beforeEach(() => initState({ a: 1, user: { name: "A" } }));
		test("single identifiers", () => {
			expect(refs("a")).toEqual(["a"]);
		});
		test("property chains record root only", () => {
			const r = refs("user.name || user.email");
			expect(r).toEqual(["user"]);
		});
		test("multiple roots", () => {
			initState({ a: 1, user: { name: "A" }, count: 0 });
			expect(refs("a + user.name + count").sort()).toEqual(
				["a", "count", "user"].sort()
			);
		});
	});

	describe("Function Calls", () => {
		beforeEach(() =>
			initState({
				inc: (x: number) => x + 1,
				sum: (a: number, b: number) => a + b,
			})
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
		test("strict equality inside arrow not treated as assignment", () => {
			initState({ count: 1 });
			expect(run("()=> count === 1 ? 10 : 20")).toBe(10);
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
