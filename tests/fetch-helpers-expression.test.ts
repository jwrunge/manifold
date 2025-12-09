import { describe, expect, test } from "vitest";
import {
    mfDelete,
    mfGet,
    mfHead,
    mfOptions,
    mfPatch,
    mfPost,
    mfPut,
} from "../src/main.ts";
import evaluateExpression from "../src/parsing/expression-parser.ts";

describe("fetch helpers in expressions", () => {
	const context = {
		mfDelete,
		mfGet,
		mfHead,
		mfOptions,
		mfPatch,
		mfPost,
		mfPut,
	};

	test("mfGet is accessible in expression context", () => {
		const parsed = evaluateExpression("mfGet");
		const result = parsed._fn(context);
		expect(typeof result).toBe("function");
	});

	test("mfPost is accessible in expression context", () => {
		const parsed = evaluateExpression("mfPost");
		const result = parsed._fn(context);
		expect(typeof result).toBe("function");
	});

	test("all fetch helpers are accessible", () => {
		const helpers = [
			"mfGet",
			"mfPost",
			"mfPut",
			"mfDelete",
			"mfPatch",
			"mfHead",
			"mfOptions",
		];
		for (const helper of helpers) {
			const parsed = evaluateExpression(helper);
			const result = parsed._fn(context);
			expect(typeof result).toBe("function");
		}
	});
});
