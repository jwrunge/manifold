import { describe, it, expect, beforeEach, vi } from "vitest";
import { State } from "../State";
import { AttributeParser } from "../attribute-parser";
import { RegEl } from "../RegisteredElement";

// Mock RegisteredElement to avoid DOM dependencies
vi.mock("../RegisteredElement", () => ({
	RegEl: {
		register: vi.fn((element, config) => ({ element, config })),
	},
}));

describe("AttributeParser", () => {
	let parser: AttributeParser;
	let mockElement: HTMLElement;

	// Helper function to get the config from the last RegEl.register call
	const getLastRegisterConfig = () => {
		const calls = vi.mocked(RegEl.register).mock.calls;
		expect(calls.length).toBeGreaterThan(0);
		const lastCall = calls[calls.length - 1];
		expect(lastCall).toBeDefined();
		return lastCall![1]!;
	};

	beforeEach(() => {
		parser = new AttributeParser();
		// Reset mocks
		vi.clearAllMocks();

		// Create a mock element
		mockElement = {
			getAttribute: vi.fn(),
			hasAttribute: vi.fn(),
			parentElement: null,
			querySelector: vi.fn(),
			querySelectorAll: vi.fn(),
		} as any;
	});

	describe("Expression Resolution", () => {
		it("should resolve simple variable expressions", () => {
			const testState = new State({ name: "John", age: 30 });
			parser.addGlobalVariable("user", testState);

			mockElement.getAttribute = vi.fn((attr) => {
				if (attr === "data-if") return "user.name";
				return null;
			});
			mockElement.hasAttribute = vi.fn().mockReturnValue(false);

			const result = parser.parseElement(mockElement);

			expect(RegEl.register).toHaveBeenCalledWith(mockElement, {
				show: expect.any(State),
				each: undefined,
				else: false,
			});
		});

		it("should resolve nested property chains", () => {
			const testState = new State({
				user: {
					profile: {
						settings: {
							theme: "dark",
						},
					},
				},
			});
			parser.addGlobalVariable("data", testState);

			mockElement.getAttribute = vi.fn((attr) => {
				if (attr === "data-if")
					return "data.user.profile.settings.theme";
				return null;
			});
			mockElement.hasAttribute = vi.fn().mockReturnValue(false);

			parser.parseElement(mockElement);

			expect(RegEl.register).toHaveBeenCalled();
			const config = getLastRegisterConfig();

			// Test that the nested property chain resolves correctly to a truthy boolean
			expect(config.show?.value).toBe(true); // "dark" is truthy
		});

		it("should handle missing properties gracefully", () => {
			const testState = new State({ user: { name: "John" } });
			parser.addGlobalVariable("data", testState);

			mockElement.getAttribute = vi.fn((attr) => {
				if (attr === "data-if") return "data.user.nonexistent.property";
				return null;
			});
			mockElement.hasAttribute = vi.fn().mockReturnValue(false);

			parser.parseElement(mockElement);

			const config = getLastRegisterConfig();

			// Should resolve to undefined without throwing
			expect(config.show?.value).toBe(false); // Boolean conversion of undefined
		});
	});

	describe("data-if attribute", () => {
		it("should parse simple data-if expressions", () => {
			const testState = new State({ isLoggedIn: true });
			parser.addGlobalVariable("user", testState);

			mockElement.getAttribute = vi.fn((attr) => {
				if (attr === "data-if") return "user.isLoggedIn";
				return null;
			});
			mockElement.hasAttribute = vi.fn().mockReturnValue(false);

			parser.parseElement(mockElement);

			expect(RegEl.register).toHaveBeenCalledWith(mockElement, {
				show: expect.any(State),
				each: undefined,
				else: false,
			});

			const config = getLastRegisterConfig();
			expect(config.show?.value).toBe(true);
		});

		it("should convert values to booleans", () => {
			const testState = new State({ count: 5 });
			parser.addGlobalVariable("data", testState);

			mockElement.getAttribute = vi.fn((attr) => {
				if (attr === "data-if") return "data.count";
				return null;
			});
			mockElement.hasAttribute = vi.fn().mockReturnValue(false);

			parser.parseElement(mockElement);

			const config = getLastRegisterConfig();
			expect(config.show?.value).toBe(true); // 5 is truthy
		});
	});

	describe("data-else-if attribute", () => {
		it("should parse data-else-if expressions", () => {
			const testState = new State({ role: "admin" });
			parser.addGlobalVariable("user", testState);

			mockElement.getAttribute = vi.fn((attr) => {
				if (attr === "data-else-if") return "user.role";
				return null;
			});
			mockElement.hasAttribute = vi.fn().mockReturnValue(false);

			parser.parseElement(mockElement);

			expect(RegEl.register).toHaveBeenCalledWith(mockElement, {
				show: expect.any(State),
				each: undefined,
				else: false,
			});

			const config = getLastRegisterConfig();
			expect(config.show?.value).toBe(true); // 'admin' is truthy
		});
	});

	describe("data-else attribute", () => {
		it("should detect data-else attribute", () => {
			mockElement.getAttribute = vi.fn().mockReturnValue(null);
			mockElement.hasAttribute = vi.fn((attr) => attr === "data-else");

			parser.parseElement(mockElement);

			expect(RegEl.register).toHaveBeenCalledWith(mockElement, {
				show: undefined,
				each: undefined,
				else: true,
			});
		});
	});

	describe("data-each attribute", () => {
		it("should parse simple data-each expressions", () => {
			const testState = new State([
				{ name: "Item 1" },
				{ name: "Item 2" },
				{ name: "Item 3" },
			]);
			parser.addGlobalVariable("items", testState);

			mockElement.getAttribute = vi.fn((attr) => {
				if (attr === "data-each") return "items as item";
				return null;
			});
			mockElement.hasAttribute = vi.fn().mockReturnValue(false);

			parser.parseElement(mockElement);

			expect(RegEl.register).toHaveBeenCalledWith(mockElement, {
				show: undefined,
				each: expect.any(State),
				else: false,
			});

			const config = getLastRegisterConfig();
			expect(config.each?.value).toEqual([
				{ name: "Item 1" },
				{ name: "Item 2" },
				{ name: "Item 3" },
			]);
		});

		it("should handle non-array values by converting to empty array", () => {
			const testState = new State({ notAnArray: "string" });
			parser.addGlobalVariable("data", testState);

			mockElement.getAttribute = vi.fn((attr) => {
				if (attr === "data-each") return "data.notAnArray as item";
				return null;
			});
			mockElement.hasAttribute = vi.fn().mockReturnValue(false);

			parser.parseElement(mockElement);

			const config = getLastRegisterConfig();
			expect(config.each?.value).toEqual([]);
		});

		it("should throw error for malformed each expressions", () => {
			mockElement.getAttribute = vi.fn((attr) => {
				if (attr === "data-each") return "invalid expression";
				return null;
			});
			mockElement.hasAttribute = vi.fn().mockReturnValue(false);

			expect(() => parser.parseElement(mockElement)).toThrow(
				"Invalid each expression: invalid expression"
			);
		});
	});

	describe("data-scope attribute", () => {
		it("should create scoped variables", () => {
			const testState = new State({
				currentUser: { name: "John", role: "admin" },
				settings: { theme: "dark" },
			});
			parser.addGlobalVariable("appData", testState);

			// Mock the scope element
			mockElement.getAttribute = vi.fn((attr) => {
				if (attr === "data-scope")
					return "appData.currentUser as user, appData.settings as config";
				if (attr === "data-if") return "user.name";
				return null;
			});
			mockElement.hasAttribute = vi.fn().mockReturnValue(false);

			parser.parseElement(mockElement);

			// Should be able to resolve scoped variables
			expect(RegEl.register).toHaveBeenCalled();
			const config = getLastRegisterConfig();
			expect(config.show?.value).toBe(true); // "John" is truthy
		});

		it("should handle multiple scope declarations", () => {
			const userData = new State({
				name: "Alice",
				email: "alice@example.com",
			});
			const settingsData = new State({
				theme: "light",
				notifications: true,
			});

			parser.addGlobalVariable("user", userData);
			parser.addGlobalVariable("settings", settingsData);

			mockElement.getAttribute = vi.fn((attr) => {
				if (attr === "data-scope") return "user as u, settings as s";
				if (attr === "data-if") return "s.notifications";
				return null;
			});
			mockElement.hasAttribute = vi.fn().mockReturnValue(false);

			parser.parseElement(mockElement);

			const config = getLastRegisterConfig();
			expect(config.show?.value).toBe(true);
		});

		it("should throw error for malformed scope expressions", () => {
			mockElement.getAttribute = vi.fn((attr) => {
				if (attr === "data-scope") return "invalid scope syntax";
				return null;
			});
			mockElement.hasAttribute = vi.fn().mockReturnValue(false);

			expect(() => parser.parseElement(mockElement)).toThrow(
				"Invalid scope expression: invalid scope syntax"
			);
		});
	});

	describe("Scope Hierarchy", () => {
		it("should inherit from parent scope contexts", () => {
			const userData = new State({ name: "Parent User" });
			parser.addGlobalVariable("user", userData);

			// Create parent element with scope
			const parentElement = {
				getAttribute: vi.fn((attr) => {
					if (attr === "data-scope") return "user as parentUser";
					if (attr === "data-if") return "true"; // Add a simple condition to make it register
					return null;
				}),
				hasAttribute: vi.fn().mockReturnValue(false),
				parentElement: null,
				querySelector: vi.fn(),
				querySelectorAll: vi.fn(),
			} as any;

			// Create child element that references parent scope
			const childElement = {
				getAttribute: vi.fn((attr) => {
					if (attr === "data-if") return "parentUser.name";
					return null;
				}),
				hasAttribute: vi.fn().mockReturnValue(false),
				parentElement: parentElement,
				querySelector: vi.fn(),
				querySelectorAll: vi.fn(),
			} as any;

			// Parse parent first to establish scope
			parser.parseElement(parentElement);

			// Parse child which should inherit parent scope
			parser.parseElement(childElement);

			expect(RegEl.register).toHaveBeenCalledTimes(2);
			const calls = vi.mocked(RegEl.register).mock.calls;
			const childConfig = calls[1]![1]!;
			expect(childConfig.show?.value).toBe(true); // "Parent User" is truthy
		});
	});

	describe("Error Handling", () => {
		it("should throw error for unknown variables", () => {
			mockElement.getAttribute = vi.fn((attr) => {
				if (attr === "data-if") return "unknownVariable.property";
				return null;
			});
			mockElement.hasAttribute = vi.fn().mockReturnValue(false);

			expect(() => parser.parseElement(mockElement)).toThrow(
				"Variable 'unknownVariable' not found in scope"
			);
		});

		it("should return null for elements without relevant attributes", () => {
			mockElement.getAttribute = vi.fn().mockReturnValue(null);
			mockElement.hasAttribute = vi.fn().mockReturnValue(false);

			const result = parser.parseElement(mockElement);

			expect(result).toBeNull();
			expect(RegEl.register).not.toHaveBeenCalled();
		});
	});

	describe("parseContainer", () => {
		it("should parse all elements with manifold attributes", () => {
			const mockContainer = {
				querySelectorAll: vi.fn().mockReturnValue([
					{
						getAttribute: vi.fn((attr) =>
							attr === "data-if" ? "true" : null
						),
						hasAttribute: vi.fn().mockReturnValue(false),
						parentElement: null,
					},
					{
						getAttribute: vi.fn().mockReturnValue(null),
						hasAttribute: vi.fn((attr) => attr === "data-else"),
						parentElement: null,
					},
				]),
			} as any;

			const parseElementSpy = vi
				.spyOn(parser, "parseElement")
				.mockReturnValue(null);

			parser.parseContainer(mockContainer);

			expect(mockContainer.querySelectorAll).toHaveBeenCalledWith(
				"[data-if], [data-else-if], [data-else], [data-each], [data-scope]"
			);
			expect(parseElementSpy).toHaveBeenCalledTimes(2);
		});
	});

	describe("Reactive Updates", () => {
		it("should create reactive states that update when source changes", () => {
			const testState = new State({ count: 0 });
			parser.addGlobalVariable("counter", testState);

			mockElement.getAttribute = vi.fn((attr) => {
				if (attr === "data-if") return "counter.count";
				return null;
			});
			mockElement.hasAttribute = vi.fn().mockReturnValue(false);

			parser.parseElement(mockElement);

			const config = getLastRegisterConfig();

			// Initial value
			expect(config.show?.value).toBe(false); // 0 is falsy

			// Update source state
			testState.value = { count: 5 };

			// Reactive state should update
			expect(config.show?.value).toBe(true); // 5 is truthy
		});
	});
});
