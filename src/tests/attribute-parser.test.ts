import { describe, test, expect, beforeEach, vi } from "vitest";
import { AttributeParser, attributeParser } from "../attribute-parser";
import { State } from "../State";

describe("AttributeParser", () => {
	let parser: AttributeParser;
	let container: HTMLElement;

	beforeEach(() => {
		parser = new AttributeParser();
		// Create a clean DOM container for each test
		document.body.innerHTML = "";
		container = document.createElement("div");
		document.body.appendChild(container);
	});

	describe("Literal Resolution", () => {
		test("should resolve boolean literals", () => {
			const element = document.createElement("div");
			element.setAttribute("data-if", "true");
			container.appendChild(element);

			const result = parser.parseElement(element);
			expect(result).toBeDefined();

			// Check that the element is initially visible (display is not "none")
			expect(element.style.display).not.toBe("none");
		});

		test("should handle false literal", () => {
			const element = document.createElement("div");
			element.setAttribute("data-if", "false");
			container.appendChild(element);

			const result = parser.parseElement(element);
			expect(result).toBeDefined();

			// Check that the element is hidden (display is "none")
			expect(element.style.display).toBe("none");
		});

		test("should resolve null and undefined literals as falsy", () => {
			const element1 = document.createElement("div");
			element1.setAttribute("data-if", "null");
			container.appendChild(element1);

			const element2 = document.createElement("div");
			element2.setAttribute("data-if", "undefined");
			container.appendChild(element2);

			parser.parseElement(element1);
			parser.parseElement(element2);

			expect(element1.style.display).toBe("none");
			expect(element2.style.display).toBe("none");
		});

		test("should resolve numbers correctly", () => {
			const element1 = document.createElement("div");
			element1.setAttribute("data-if", "42");
			const element2 = document.createElement("div");
			element2.setAttribute("data-if", "0");
			const element3 = document.createElement("div");
			element3.setAttribute("data-if", "-3.14");

			container.appendChild(element1);
			container.appendChild(element2);
			container.appendChild(element3);

			parser.parseElement(element1);
			parser.parseElement(element2);
			parser.parseElement(element3);

			expect(element1.style.display).not.toBe("none"); // 42 is truthy
			expect(element2.style.display).toBe("none"); // 0 is falsy
			expect(element3.style.display).not.toBe("none"); // -3.14 is truthy
		});

		test("should resolve quoted strings", () => {
			const element1 = document.createElement("div");
			element1.setAttribute("data-if", '"hello"');
			const element2 = document.createElement("div");
			element2.setAttribute("data-if", "'world'");
			const element3 = document.createElement("div");
			element3.setAttribute("data-if", "`template`");
			const element4 = document.createElement("div");
			element4.setAttribute("data-if", '""'); // empty string

			container.appendChild(element1);
			container.appendChild(element2);
			container.appendChild(element3);
			container.appendChild(element4);

			parser.parseElement(element1);
			parser.parseElement(element2);
			parser.parseElement(element3);
			parser.parseElement(element4);

			expect(element1.style.display).not.toBe("none"); // "hello" is truthy
			expect(element2.style.display).not.toBe("none"); // "world" is truthy
			expect(element3.style.display).not.toBe("none"); // "template" is truthy
			expect(element4.style.display).toBe("none"); // "" is falsy
		});
	});

	describe("Global Variables", () => {
		test("should add and use global variables", () => {
			const userState = new State({ name: "Alice", age: 30 });
			parser.addGlobalVariable("user", userState);

			const element = document.createElement("div");
			element.setAttribute("data-if", "user");
			container.appendChild(element);

			parser.parseElement(element);
			expect(element.style.display).not.toBe("none"); // user object is truthy
		});

		test("should resolve property chains from global variables", () => {
			const userState = new State({
				name: "Alice",
				age: 30,
				active: true,
			});
			parser.addGlobalVariable("user", userState);

			const element = document.createElement("div");
			element.setAttribute("data-if", "user.active");
			container.appendChild(element);

			parser.parseElement(element);
			expect(element.style.display).not.toBe("none");
		});

		test("should handle nested property access", () => {
			const dataState = new State({
				user: {
					profile: {
						settings: {
							theme: "dark",
						},
					},
				},
			});
			parser.addGlobalVariable("data", dataState);

			const element = document.createElement("div");
			element.setAttribute("data-if", "data.user.profile.settings.theme");
			container.appendChild(element);

			parser.parseElement(element);
			expect(element.style.display).not.toBe("none"); // "dark" is truthy
		});

		test("should handle null property chains safely", () => {
			const dataState = new State({ user: null });
			parser.addGlobalVariable("data", dataState);

			const element = document.createElement("div");
			element.setAttribute("data-if", "data.user.name");
			container.appendChild(element);

			parser.parseElement(element);
			expect(element.style.display).toBe("none"); // null.name is undefined, falsy
		});

		test("should react to state changes", () => {
			const isVisibleState = new State(false);
			parser.addGlobalVariable("isVisible", isVisibleState);

			const element = document.createElement("div");
			element.setAttribute("data-if", "isVisible");
			container.appendChild(element);

			parser.parseElement(element);
			expect(element.style.display).toBe("none");

			// Change state
			isVisibleState.value = true;
			expect(element.style.display).not.toBe("none");
		});
	});

	describe("data-scope", () => {
		test("should create scoped variables", () => {
			const userState = new State({ name: "Alice", age: 30 });
			parser.addGlobalVariable("user", userState);

			const element = document.createElement("div");
			element.setAttribute("data-scope", "user as currentUser");
			element.setAttribute("data-if", "currentUser");
			container.appendChild(element);

			parser.parseElement(element);
			expect(element.style.display).not.toBe("none");
		});

		test("should handle multiple scope variables", () => {
			const userState = new State({ name: "Alice" });
			const settingsState = new State({ theme: "dark" });
			parser.addGlobalVariable("user", userState);
			parser.addGlobalVariable("settings", settingsState);

			const element = document.createElement("div");
			element.setAttribute(
				"data-scope",
				"user as currentUser, settings as config"
			);
			element.setAttribute("data-if", "config");
			container.appendChild(element);

			parser.parseElement(element);
			expect(element.style.display).not.toBe("none");
		});

		test("should create child scope contexts", () => {
			const userState = new State({ name: "Alice" });
			parser.addGlobalVariable("user", userState);

			const parent = document.createElement("div");
			parent.setAttribute("data-scope", "user as currentUser");
			container.appendChild(parent);

			const child = document.createElement("div");
			child.setAttribute("data-if", "currentUser");
			parent.appendChild(child);

			parser.parseElement(parent);
			parser.parseElement(child);
			expect(child.style.display).not.toBe("none");
		});

		test("should throw error for invalid scope expressions", () => {
			const element = document.createElement("div");
			element.setAttribute("data-scope", "invalid");
			container.appendChild(element);

			expect(() => parser.parseElement(element)).toThrow(
				"Invalid scope expression"
			);
		});
	});

	describe("data-each", () => {
		test("should parse each expressions and register RegEl", () => {
			const itemsState = new State([1, 2, 3]);
			parser.addGlobalVariable("items", itemsState);

			const element = document.createElement("div");
			element.setAttribute("data-each", "items as item");
			container.appendChild(element);

			const result = parser.parseElement(element);
			expect(result).toBeDefined();
		});

		test("should handle empty arrays", () => {
			const itemsState = new State([]);
			parser.addGlobalVariable("items", itemsState);

			const element = document.createElement("div");
			element.setAttribute("data-each", "items as item");
			container.appendChild(element);

			const result = parser.parseElement(element);
			expect(result).toBeDefined();
		});

		test("should throw error for invalid each expressions", () => {
			const element = document.createElement("div");
			element.setAttribute("data-each", "invalid");
			container.appendChild(element);

			expect(() => parser.parseElement(element)).toThrow(
				"Invalid each expression"
			);
		});

		test("should throw error for empty item alias", () => {
			const element = document.createElement("div");
			element.setAttribute("data-each", "items as");
			container.appendChild(element);

			expect(() => parser.parseElement(element)).toThrow(
				"Invalid each expression: items as. Expected format:"
			);
		});
	});

	describe("Conditional Attributes", () => {
		test("should handle data-if", () => {
			const isActiveState = new State(true);
			parser.addGlobalVariable("isActive", isActiveState);

			const element = document.createElement("div");
			element.setAttribute("data-if", "isActive");
			container.appendChild(element);

			parser.parseElement(element);
			expect(element.style.display).not.toBe("none");
		});

		test("should handle data-else-if", () => {
			const isVisibleState = new State(false);
			parser.addGlobalVariable("isVisible", isVisibleState);

			const element = document.createElement("div");
			element.setAttribute("data-else-if", "isVisible");
			container.appendChild(element);

			parser.parseElement(element);
			expect(element.style.display).toBe("none");
		});

		test("should handle data-else", () => {
			const element = document.createElement("div");
			element.setAttribute("data-else", "");
			container.appendChild(element);

			const result = parser.parseElement(element);
			expect(result).toBeDefined();
		});

		test("should prioritize data-if over data-else-if", () => {
			const trueState = new State(true);
			const falseState = new State(false);
			parser.addGlobalVariable("trueValue", trueState);
			parser.addGlobalVariable("falseValue", falseState);

			const element = document.createElement("div");
			element.setAttribute("data-if", "trueValue");
			element.setAttribute("data-else-if", "falseValue");
			container.appendChild(element);

			parser.parseElement(element);
			expect(element.style.display).not.toBe("none");
		});
	});

	describe("Error Handling", () => {
		test("should handle undefined variables gracefully", () => {
			const element = document.createElement("div");
			element.setAttribute("data-if", "nonExistentVariable");
			container.appendChild(element);

			// Should not throw during parsing - expressions are evaluated lazily
			const regEl = parser.parseElement(element);
			expect(regEl).toBeDefined();

			// The element should be hidden since undefined variable evaluates to falsy
			expect(element.style.display).toBe("none");
		});

		test("should handle invalid expressions gracefully", () => {
			const element = document.createElement("div");
			element.setAttribute("data-if", ".");
			container.appendChild(element);

			// Should not throw during parsing - invalid expressions return original value
			const regEl = parser.parseElement(element);
			expect(regEl).toBeDefined();

			// The element should be shown since "." as string is truthy
			expect(element.style.display).toBe("");
		});
	});

	describe("Expression Parsing Edge Cases", () => {
		test("should handle whitespace in expressions", () => {
			const userState = new State({ active: true });
			parser.addGlobalVariable("user", userState);

			const element = document.createElement("div");
			element.setAttribute("data-if", "  user.active  ");
			container.appendChild(element);

			parser.parseElement(element);
			expect(element.style.display).not.toBe("none");
		});

		test("should handle complex property chains", () => {
			const dataState = new State({
				app: {
					config: {
						ui: {
							showSidebar: false,
						},
					},
				},
			});
			parser.addGlobalVariable("data", dataState);

			const element = document.createElement("div");
			element.setAttribute("data-if", "data.app.config.ui.showSidebar");
			container.appendChild(element);

			parser.parseElement(element);
			expect(element.style.display).toBe("none");
		});
	});

	describe("Integration with DOM", () => {
		test("should handle dynamic state updates", () => {
			const toggleState = new State(false);
			parser.addGlobalVariable("toggle", toggleState);

			const element = document.createElement("div");
			element.setAttribute("data-if", "toggle");
			container.appendChild(element);

			parser.parseElement(element);
			expect(element.style.display).toBe("none");

			// Toggle the state
			toggleState.value = true;
			expect(element.style.display).not.toBe("none");

			// Toggle back
			toggleState.value = false;
			expect(element.style.display).toBe("none");
		});

		test("should handle nested property state changes", () => {
			const userState = new State({ profile: { isActive: false } });
			parser.addGlobalVariable("user", userState);

			const element = document.createElement("div");
			element.setAttribute("data-if", "user.profile.isActive");
			container.appendChild(element);

			parser.parseElement(element);
			expect(element.style.display).toBe("none");

			// Update nested property
			userState.value = { profile: { isActive: true } };
			expect(element.style.display).not.toBe("none");
		});
	});

	describe("data-bind", () => {
		test("should bind single property", () => {
			const userState = new State({ name: "John" });
			parser.addGlobalVariable("user", userState);

			const element = document.createElement("div");
			element.setAttribute("data-bind", "textContent: user.name");
			container.appendChild(element);

			parser.parseElement(element);
			expect(element.textContent).toBe("John");

			// Test reactivity
			userState.value = { name: "Jane" };
			expect(element.textContent).toBe("Jane");
		});

		test("should bind multiple properties", () => {
			const buttonState = new State({
				textContent: "Click me",
				disabled: false,
				className: "btn",
			});
			parser.addGlobalVariable("button", buttonState);

			const element = document.createElement("button");
			element.setAttribute(
				"data-bind",
				"textContent: button.textContent, disabled: button.disabled, className: button.className"
			);
			container.appendChild(element);

			parser.parseElement(element);
			expect(element.textContent).toBe("Click me");
			expect(element.disabled).toBe(false);
			expect(element.className).toBe("btn");

			// Test reactivity
			buttonState.value = {
				textContent: "Submit",
				disabled: true,
				className: "btn-primary",
			};
			expect(element.textContent).toBe("Submit");
			expect(element.disabled).toBe(true);
			expect(element.className).toBe("btn-primary");
		});

		test("should bind entire state object", () => {
			const inputState = new State({
				value: "test",
				placeholder: "Enter text",
			});
			parser.addGlobalVariable("input", inputState);

			const element = document.createElement("input");
			element.setAttribute("data-bind", "input");
			container.appendChild(element);

			parser.parseElement(element);
			expect((element as HTMLInputElement).value).toBe("test");
			expect((element as HTMLInputElement).placeholder).toBe(
				"Enter text"
			);
		});
	});

	describe("data-sync", () => {
		test("should create two-way binding for input", () => {
			const nameState = new State("initial");
			parser.addGlobalVariable("name", nameState);

			const element = document.createElement("input");
			element.setAttribute("data-sync", "name");
			container.appendChild(element);

			parser.parseElement(element);

			// Initial value should be set
			expect((element as HTMLInputElement).value).toBe("initial");

			// Test state -> DOM updates
			nameState.value = "updated";
			expect((element as HTMLInputElement).value).toBe("updated");

			// Test DOM -> state updates
			(element as HTMLInputElement).value = "from-input";
			element.dispatchEvent(new Event("input"));
			expect(nameState.value).toBe("from-input");
		});

		test("should work with textarea", () => {
			const messageState = new State("Hello");
			parser.addGlobalVariable("message", messageState);

			const element = document.createElement("textarea");
			element.setAttribute("data-sync", "message");
			container.appendChild(element);

			parser.parseElement(element);

			expect(element.value).toBe("Hello");

			// Test two-way binding
			messageState.value = "World";
			expect(element.value).toBe("World");

			element.value = "New Message";
			element.dispatchEvent(new Event("change"));
			expect(messageState.value).toBe("New Message");
		});

		test("should throw error for invalid sync expression", () => {
			// Add the user variable so we can test the multi-variable error
			const userState = new State({ name: "John" });
			parser.addGlobalVariable("user", userState);

			const element = document.createElement("input");
			element.setAttribute("data-sync", "user.name");
			container.appendChild(element);

			expect(() => parser.parseElement(element)).toThrow(
				"data-sync requires exactly one variable"
			);
		});

		test("should throw error for undefined variable", () => {
			const element = document.createElement("input");
			element.setAttribute("data-sync", "undefinedVar");
			container.appendChild(element);

			expect(() => parser.parseElement(element)).toThrow(
				"Variable 'undefinedVar' not found in scope for data-sync"
			);
		});
	});

	describe("parseContainer", () => {
		test("should parse all elements with data attributes", () => {
			const userState = new State({ name: "John", age: 30 });
			const nameState = new State("John");
			parser.addGlobalVariable("user", userState);
			parser.addGlobalVariable("userName", nameState);

			container.innerHTML = `
				<div data-if="user.age >= 18">Adult</div>
				<div data-bind="textContent: user.name"></div>
				<input data-sync="userName" />
				<div data-scope="user as u">
					<span data-if="u.age > 25">Experienced</span>
				</div>
			`;

			parser.parseContainer(container);

			const elements = container.querySelectorAll(
				"[data-if], [data-bind], [data-sync], [data-scope]"
			);
			expect(elements).toHaveLength(5); // div, div, input, div, span

			// Check that bindings work
			const nameDiv = container.querySelector(
				"[data-bind]"
			) as HTMLElement;
			const input = container.querySelector("input") as HTMLInputElement;

			expect(nameDiv?.textContent).toBe("John");
			expect(input?.value).toBe("John");
		});

		test("should handle empty containers", () => {
			const emptyContainer = document.createElement("div");
			expect(() => parser.parseContainer(emptyContainer)).not.toThrow();
		});
	});

	describe("Singleton Instance", () => {
		test("should export a singleton attributeParser instance", () => {
			expect(attributeParser).toBeInstanceOf(AttributeParser);
		});
	});
});
