import { expect, test, describe } from "vitest";
import {
	evaluateExpression,
	extractVariableNames,
} from "../simple-expression-parser";

describe("Expression Parser", () => {
	describe("Simple Property Access", () => {
		test("should evaluate simple property access", () => {
			const context = {
				user: { name: "Alice", age: 25 },
				items: [1, 2, 3],
				theme: "dark",
			};

			expect(evaluateExpression("user.name", context)).toBe("Alice");
			expect(evaluateExpression("user.age", context)).toBe(25);
			expect(evaluateExpression("items.length", context)).toBe(3);
			expect(evaluateExpression("theme", context)).toBe("dark");
		});

		test("should handle nested property access", () => {
			const context = {
				user: {
					profile: {
						settings: {
							theme: "dark",
							notifications: true,
						},
					},
				},
			};

			expect(
				evaluateExpression("user.profile.settings.theme", context)
			).toBe("dark");
			expect(
				evaluateExpression(
					"user.profile.settings.notifications",
					context
				)
			).toBe(true);
		});

		test("should return undefined for missing properties", () => {
			const context = {
				user: { name: "Alice" },
			};

			expect(evaluateExpression("user.email", context)).toBeUndefined();
			expect(evaluateExpression("nonexistent", context)).toBeUndefined();
			expect(
				evaluateExpression("user.profile.name", context)
			).toBeUndefined();
		});

		test("should handle null and undefined values in chain", () => {
			const context = {
				user: null,
				profile: undefined,
				data: { user: null },
			};

			expect(evaluateExpression("user.name", context)).toBeUndefined();
			expect(
				evaluateExpression("profile.settings", context)
			).toBeUndefined();
			expect(
				evaluateExpression("data.user.name", context)
			).toBeUndefined();
		});
	});

	describe("Simple Values", () => {
		test("should parse numbers", () => {
			const context = {};

			expect(evaluateExpression("42", context)).toBe(42);
			expect(evaluateExpression("-17", context)).toBe(-17);
			expect(evaluateExpression("3.14", context)).toBe(3.14);
			expect(evaluateExpression("-2.5", context)).toBe(-2.5);
		});

		test("should parse strings", () => {
			const context = {};

			expect(evaluateExpression("'hello'", context)).toBe("hello");
			expect(evaluateExpression('"world"', context)).toBe("world");
			expect(evaluateExpression("'hello world'", context)).toBe(
				"hello world"
			);
			expect(evaluateExpression("`hello world`", context)).toBe(
				"hello world"
			);
			expect(evaluateExpression("'3 times hello'", context)).toBe(
				"3 times hello"
			);
			expect(evaluateExpression('"special chars: !@#$%"', context)).toBe(
				"special chars: !@#$%"
			);
		});

		test("should parse boolean literals", () => {
			const context = {};

			expect(evaluateExpression("true", context)).toBe(true);
			expect(evaluateExpression("false", context)).toBe(false);
		});

		test("should parse null and undefined", () => {
			const context = {};

			expect(evaluateExpression("null", context)).toBe(null);
			expect(evaluateExpression("undefined", context)).toBe(undefined);
		});

		test("should fallback to string for unknown values", () => {
			const context = {};

			expect(evaluateExpression("unknownValue", context)).toBe(
				"unknownValue"
			);
		});
	});

	describe("Simple Comparisons", () => {
		test("should evaluate strict equality (===)", () => {
			const context = {
				user: { age: 25, name: "Alice" },
				theme: "dark",
				count: 0,
			};

			expect(evaluateExpression("user.age === 25", context)).toBe(true);
			expect(evaluateExpression("user.age === 30", context)).toBe(false);
			expect(evaluateExpression("theme === 'dark'", context)).toBe(true);
			expect(evaluateExpression("theme === 'light'", context)).toBe(
				false
			);
			expect(evaluateExpression("count === 0", context)).toBe(true);
		});

		test("should evaluate strict inequality (!==)", () => {
			const context = {
				user: { age: 25 },
				theme: "dark",
			};

			expect(evaluateExpression("user.age !== 30", context)).toBe(true);
			expect(evaluateExpression("user.age !== 25", context)).toBe(false);
			expect(evaluateExpression("theme !== 'light'", context)).toBe(true);
			expect(evaluateExpression("theme !== 'dark'", context)).toBe(false);
		});

		test("should evaluate loose equality (==)", () => {
			const context = {
				count: 0,
				stringNumber: "42",
				boolValue: true,
			};

			expect(evaluateExpression("count == false", context)).toBe(true);
			expect(evaluateExpression("stringNumber == 42", context)).toBe(
				true
			);
			expect(evaluateExpression("boolValue == 1", context)).toBe(true);
		});

		test("should evaluate loose inequality (!=)", () => {
			const context = {
				count: 0,
				value: 42,
			};

			expect(evaluateExpression("count != true", context)).toBe(true);
			expect(evaluateExpression("value != 42", context)).toBe(false);
		});

		test("should evaluate greater than (>)", () => {
			const context = {
				user: { age: 25 },
				score: 100,
			};

			expect(evaluateExpression("user.age > 18", context)).toBe(true);
			expect(evaluateExpression("user.age > 30", context)).toBe(false);
			expect(evaluateExpression("score > 50", context)).toBe(true);
		});

		test("should evaluate greater than or equal (>=)", () => {
			const context = {
				user: { age: 18 },
				score: 100,
			};

			expect(evaluateExpression("user.age >= 18", context)).toBe(true);
			expect(evaluateExpression("user.age >= 19", context)).toBe(false);
			expect(evaluateExpression("score >= 100", context)).toBe(true);
		});

		test("should evaluate less than (<)", () => {
			const context = {
				user: { age: 16 },
				temperature: 15,
			};

			expect(evaluateExpression("user.age < 18", context)).toBe(true);
			expect(evaluateExpression("user.age < 10", context)).toBe(false);
			expect(evaluateExpression("temperature < 20", context)).toBe(true);
		});

		test("should evaluate less than or equal (<=)", () => {
			const context = {
				user: { age: 18 },
				score: 85,
			};

			expect(evaluateExpression("user.age <= 18", context)).toBe(true);
			expect(evaluateExpression("user.age <= 17", context)).toBe(false);
			expect(evaluateExpression("score <= 100", context)).toBe(true);
		});

		test("should handle comparisons with different data types", () => {
			const context = {
				stringAge: "25",
				numberAge: 25,
				boolValue: true,
				nullValue: null,
			};

			expect(evaluateExpression("stringAge == 25", context)).toBe(true);
			expect(evaluateExpression("stringAge === 25", context)).toBe(false);
			expect(evaluateExpression("boolValue == 1", context)).toBe(true);
			expect(evaluateExpression("nullValue == undefined", context)).toBe(
				true
			);
			expect(evaluateExpression("nullValue === undefined", context)).toBe(
				false
			);
		});
	});

	describe("Spec Examples", () => {
		test("should handle adult content condition", () => {
			const context = {
				user: { age: 25 },
			};

			expect(evaluateExpression("user.age >= 18", context)).toBe(true);

			context.user.age = 16;
			expect(evaluateExpression("user.age >= 18", context)).toBe(false);
		});

		test("should handle theme comparison", () => {
			const context = {
				settings: { theme: "dark" },
			};

			expect(
				evaluateExpression("settings.theme === 'dark'", context)
			).toBe(true);
			expect(
				evaluateExpression("settings.theme === 'light'", context)
			).toBe(false);
		});

		test("should handle profile visibility check", () => {
			const context = {
				user: {
					profile: {
						isVisible: true,
					},
				},
				settings: {
					theme: "dark",
				},
			};

			// Note: Current parser doesn't support && operator, testing individual conditions
			expect(evaluateExpression("user.profile.isVisible", context)).toBe(
				true
			);
			expect(
				evaluateExpression("settings.theme === 'dark'", context)
			).toBe(true);
		});

		test("should handle email fallback pattern", () => {
			const context: { user: { email?: string } } = {
				user: { email: "test@example.com" },
			};

			expect(evaluateExpression("user.email", context)).toBe(
				"test@example.com"
			);

			// Test with missing email
			delete context.user.email;
			expect(evaluateExpression("user.email", context)).toBeUndefined();

			// Test logical OR operator (|| - fallback for falsy values)
			expect(
				evaluateExpression(
					'user.email || "no-email@example.com"',
					context
				)
			).toBe("no-email@example.com");

			// Test nullish coalescing operator (?? - fallback for null/undefined only)
			expect(
				evaluateExpression(
					'user.email ?? "no-email@example.com"',
					context
				)
			).toBe("no-email@example.com");
		});

		test("should handle option selection pattern", () => {
			const context = {
				selectedValue: "option2",
				option: { value: "option2" },
			};

			expect(
				evaluateExpression("option.value === selectedValue", context)
			).toBe(true);

			context.option.value = "option1";
			expect(
				evaluateExpression("option.value === selectedValue", context)
			).toBe(false);
		});
	});

	describe("Logical Operators", () => {
		test("should handle logical OR (||) operator", () => {
			const context = {
				user: { name: "Alice", email: null, count: 0 },
				fallback: "default@example.com",
			};

			// Truthy left side - should return left
			expect(
				evaluateExpression("user.name || 'Anonymous'", context)
			).toBe("Alice");

			// Falsy left side - should return right
			expect(evaluateExpression("user.email || fallback", context)).toBe(
				"default@example.com"
			);
			expect(evaluateExpression("user.count || 10", context)).toBe(10); // 0 is falsy
			expect(
				evaluateExpression("user.missing || 'Not found'", context)
			).toBe("Not found");

			// Both expressions
			expect(
				evaluateExpression("user.missing || user.name", context)
			).toBe("Alice");
		});

		test("should handle nullish coalescing (??) operator", () => {
			const context = {
				user: { name: "Alice", email: null, count: 0, empty: "" },
				fallback: "default@example.com",
			};

			// Non-null left side - should return left (even if falsy)
			expect(
				evaluateExpression("user.name ?? 'Anonymous'", context)
			).toBe("Alice");
			expect(evaluateExpression("user.count ?? 10", context)).toBe(0); // 0 is not null/undefined
			expect(evaluateExpression("user.empty ?? 'Default'", context)).toBe(
				""
			); // empty string is not null/undefined

			// Null/undefined left side - should return right
			expect(evaluateExpression("user.email ?? fallback", context)).toBe(
				"default@example.com"
			);
			expect(
				evaluateExpression("user.missing ?? 'Not found'", context)
			).toBe("Not found");
		});

		test("should extract variables from logical operators", () => {
			expect(extractVariableNames("user.email || fallback")).toEqual([
				"user",
				"fallback",
			]);
			expect(extractVariableNames("user.name ?? defaultName")).toEqual([
				"user",
				"defaultName",
			]);
			expect(extractVariableNames("first.value || second.value")).toEqual(
				["first", "second"]
			);
		});

		test("should demonstrate difference between || and ??", () => {
			const context = {
				zero: 0,
				empty: "",
				nullValue: null,
				undefinedValue: undefined,
				fallback: "default",
			};

			// || treats falsy values as trigger for fallback
			expect(evaluateExpression("zero || 10", context)).toBe(10);
			expect(evaluateExpression("empty || fallback", context)).toBe(
				"default"
			);
			expect(evaluateExpression("nullValue || fallback", context)).toBe(
				"default"
			);
			expect(
				evaluateExpression("undefinedValue || fallback", context)
			).toBe("default");

			// ?? only treats null/undefined as trigger for fallback
			expect(evaluateExpression("zero ?? 10", context)).toBe(0);
			expect(evaluateExpression("empty ?? fallback", context)).toBe("");
			expect(evaluateExpression("nullValue ?? fallback", context)).toBe(
				"default"
			);
			expect(
				evaluateExpression("undefinedValue ?? fallback", context)
			).toBe("default");
		});
	});

	describe("Variable Extraction", () => {
		test("should extract single variables", () => {
			expect(extractVariableNames("user")).toEqual(["user"]);
			expect(extractVariableNames("theme")).toEqual(["theme"]);
			expect(extractVariableNames("items")).toEqual(["items"]);
		});

		test("should extract root variables from property chains", () => {
			expect(extractVariableNames("user.name")).toEqual(["user"]);
			expect(extractVariableNames("user.profile.settings.theme")).toEqual(
				["user"]
			);
			expect(extractVariableNames("items.length")).toEqual(["items"]);
		});

		test("should extract variables from comparisons", () => {
			expect(extractVariableNames("user.age >= 18")).toEqual(["user"]);
			expect(extractVariableNames("theme === 'dark'")).toEqual(["theme"]);
			expect(extractVariableNames("count === total")).toEqual([
				"count",
				"total",
			]);
		});

		test("should not extract literal values", () => {
			expect(extractVariableNames("true")).toEqual([]);
			expect(extractVariableNames("false")).toEqual([]);
			expect(extractVariableNames("null")).toEqual([]);
			expect(extractVariableNames("undefined")).toEqual([]);
			expect(extractVariableNames("42")).toEqual([]);
			expect(extractVariableNames("'hello'")).toEqual([]);
		});

		test("should extract multiple variables", () => {
			expect(extractVariableNames("user.age >= minAge")).toEqual([
				"user",
				"minAge",
			]);
			expect(
				extractVariableNames("first.value === second.value")
			).toEqual(["first", "second"]);
		});

		test("should handle complex expressions", () => {
			expect(extractVariableNames("user.profile.isVisible")).toEqual([
				"user",
			]);
			expect(
				extractVariableNames("settings.theme !== currentTheme")
			).toEqual(["settings", "currentTheme"]);
		});

		test("should deduplicate variable names", () => {
			expect(extractVariableNames("user.name === user.email")).toEqual([
				"user",
			]);
		});
	});

	describe("Edge Cases", () => {
		test("should handle empty expressions", () => {
			expect(evaluateExpression("", {})).toBeUndefined();
			expect(evaluateExpression("   ", {})).toBeUndefined();
		});

		test("should handle whitespace in expressions", () => {
			const context = { user: { age: 25 } };

			expect(evaluateExpression("  user.age  ", context)).toBe(25);
			expect(evaluateExpression("user.age  >=  18", context)).toBe(true);
			expect(evaluateExpression("  user.age >= 18  ", context)).toBe(
				true
			);
		});

		test("should handle invalid comparison expressions", () => {
			const context = { user: { age: 25 } };

			// Invalid operators or malformed expressions
			expect(evaluateExpression("user.age >=", context)).toBe(
				"user.age >="
			);
			expect(evaluateExpression(">=  18", context)).toBe(">=  18");
			expect(evaluateExpression("user.age >> 18", context)).toBe(
				"user.age >> 18"
			);
		});

		test("should handle complex property names", () => {
			const context = {
				$special: { value: 42 },
				user123: { name456: "test" },
			};

			expect(evaluateExpression("$special.value", context)).toBe(42);
			expect(evaluateExpression("user123.name456", context)).toBe("test");
		});
		test("should handle array indices as properties", () => {
			const context = {
				items: ["first", "second", "third"],
			};

			// Note: Current parser treats array indices as property access
			expect(evaluateExpression("items.0", context)).toBe("first");
			expect(evaluateExpression("items.1", context)).toBe("second");
			expect(evaluateExpression("items.length", context)).toBe(3);
		});
	});

	describe("Performance Cases", () => {
		test("should handle common patterns efficiently", () => {
			const context = {
				user: {
					name: "Alice",
					age: 25,
					profile: {
						isVisible: true,
						settings: {
							theme: "dark",
							notifications: true,
						},
					},
				},
				items: [1, 2, 3, 4, 5],
			};

			// These are the most common patterns that should be fast
			expect(evaluateExpression("user.name", context)).toBe("Alice");
			expect(evaluateExpression("user.age >= 18", context)).toBe(true);
			expect(evaluateExpression("items.length", context)).toBe(5);
			expect(evaluateExpression("user.profile.isVisible", context)).toBe(
				true
			);
			expect(
				evaluateExpression(
					"user.profile.settings.theme === 'dark'",
					context
				)
			).toBe(true);
		});
	});
});
