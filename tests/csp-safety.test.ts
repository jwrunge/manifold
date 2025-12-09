import { describe, expect, test } from "vitest";
import evaluateExpression from "../src/parsing/expression-parser.ts";

describe("CSP Safety / Expression Parser Security", () => {
	const run = (expr: string, ctx?: Record<string, unknown>) =>
		evaluateExpression(expr)._fn(ctx ? { state: ctx } : undefined);

	describe("Forbidden property access", () => {
		test("blocks constructor access via dot notation", () => {
			expect(run("Object.constructor")).toBe(undefined);
			expect(run("Array.constructor")).toBe(undefined);
			expect(run("Promise.constructor")).toBe(undefined);
		});

		test("blocks constructor access via bracket notation", () => {
			expect(run("Object['constructor']")).toBe(undefined);
			expect(run("Math['constructor']")).toBe(undefined);
		});

		test("blocks __proto__ access", () => {
			expect(run("Object.__proto__")).toBe(undefined);
			const state = { obj: { a: 1 } };
			expect(run("obj.__proto__", state)).toBe(undefined);
		});

		test("blocks prototype access", () => {
			expect(run("Object.prototype")).toBe(undefined);
			expect(run("Array.prototype")).toBe(undefined);
		});

		test("blocks legacy getter/setter methods", () => {
			expect(run("Object.__defineGetter__")).toBe(undefined);
			expect(run("Object.__defineSetter__")).toBe(undefined);
			expect(run("Object.__lookupGetter__")).toBe(undefined);
			expect(run("Object.__lookupSetter__")).toBe(undefined);
		});

		test("blocks apply/call/bind to prevent indirect Function access", () => {
			expect(run("Math.max.apply")).toBe(undefined);
			expect(run("Math.max.call")).toBe(undefined);
			expect(run("Math.max.bind")).toBe(undefined);
			const state = { fn: () => 42 };
			expect(run("fn.constructor", state)).toBe(undefined);
		});

		test("blocks nested constructor chains", () => {
			expect(run("Object.keys.constructor")).toBe(undefined);
			expect(run("Math.max.constructor")).toBe(undefined);
		});

		test("blocks computed property access to constructor", () => {
			const expr = "Object['constr' + 'uctor']";
			// Note: This evaluates the concat, but the resulting 'constructor' key is blocked
			expect(run(expr)).toBe(undefined);
		});
	});

	describe("Alternate global access naturally blocked", () => {
		test("global object identifiers not in SAFE_GLOBALS return undefined", () => {
			// These aren't in SAFE_GLOBALS, so they're already unreachable
			expect(run("global")).toBe(undefined);
			expect(run("globalThis")).toBe(undefined);
			expect(run("self")).toBe(undefined);
			expect(run("window")).toBe(undefined);
		});
	});

	describe("Allowed safe operations", () => {
		test("allows Object utility methods", () => {
			expect(run("Object.keys({a:1,b:2})")).toEqual(["a", "b"]);
			expect(run("Object.values({a:1,b:2})")).toEqual([1, 2]);
			expect(run("Object.entries({a:1})")).toEqual([["a", 1]]);
		});

		test("allows Math operations", () => {
			expect(run("Math.max(1,2,3)")).toBe(3);
			expect(run("Math.round(3.7)")).toBe(4);
		});

		test("allows JSON operations", () => {
			const jsonStr = '{"a":1}';
			const state = { jsonStr };
			expect(run("JSON.parse(jsonStr)", state)).toEqual({ a: 1 });
			const obj = run("JSON.stringify({a:1})");
			expect(typeof obj).toBe("string");
			expect(obj).toBe('{"a":1}');
		});

		test("allows Number utilities", () => {
			expect(run("Number.parseInt('42')")).toBe(42);
			expect(run("Number.isFinite(100)")).toBe(true);
		});

		test("allows String utilities", () => {
			expect(run("String.fromCharCode(65)")).toBe("A");
		});

		test("allows Map and Set as globals for method calls", () => {
			// Parser doesn't support 'new', but Map/Set are available for instanceof checks
			// and users can pass Map/Set instances via state
			const state = {
				myMap: new Map([[1, 2]]),
				mySet: new Set([1, 2, 3]),
			};
			expect(run("myMap.get(1)", state)).toBe(2);
			expect(run("mySet.has(2)", state)).toBe(true);
		});

		test("allows normal property chains", () => {
			const state = { user: { name: "Alice", age: 30 } };
			expect(run("user.name", state)).toBe("Alice");
			expect(run("user['age']", state)).toBe(30);
		});
	});

	describe("Sync reference safety", () => {
		test("blocks writes to __proto__", () => {
			const state = { obj: { a: 1 } };
			const setter = evaluateExpression("obj.__proto__")._syncRef;
			if (setter) setter({ state }, { evil: true });
			// Should not pollute prototype
			expect(Object.hasOwn({}, "evil")).toBe(false);
		});

		test("blocks writes to constructor", () => {
			const state = { obj: {} };
			const setter = evaluateExpression("obj.constructor")._syncRef;
			if (setter) setter({ state }, "hacked");
			expect(state.obj).toEqual({});
		});

		test("blocks writes via bracket notation to forbidden props", () => {
			const state = { obj: { a: 1 } };
			const setter = evaluateExpression("obj['__proto__']")._syncRef;
			if (setter) setter({ state }, { evil: true });
			expect(Object.hasOwn({}, "evil")).toBe(false);
		});
	});
});
