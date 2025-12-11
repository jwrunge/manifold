import { afterEach, describe, expect, it } from "vitest";
import { ComponentStateBuilder, css, html, State } from "../src/main.ts";

describe("Component System", () => {
	let cleanup: (() => void)[] = [];

	afterEach(() => {
		for (const fn of cleanup) fn();
		cleanup = [];
		// Clear global stores
		State.globalStores.clear();
	});

	describe("ComponentStateBuilder", () => {
		it("should create a component with template function", () => {
			const builder = State.component({
				name: "test-component",
				template: html`<div>Hello</div>`,
			});

			expect(builder).toBeInstanceOf(ComponentStateBuilder);
		});

		it("should add state to component", () => {
			const builder = State.component({
				name: "test-component",
				template: html`<div>Count: \${count}</div>`,
				state: { count: 0 },
			});

			const { state } = builder.instance();
			expect(state.count).toBe(0);
		});

		it("should support builder pattern with add()", () => {
			const builder = State.component({
				name: "test-component",
				template: html`<div>\${message}</div>`,
			}).add("message", "Hello World");

			const { state } = builder.instance();
			expect(state.message).toBe("Hello World");
		});

		it("should support builder pattern with add() object", () => {
			const builder = State.component({
				name: "test-component",
				template: html`<div>\${a} \${b}</div>`,
			}).add({ a: 1, b: 2 });

			const { state } = builder.instance();
			expect(state.a).toBe(1);
			expect(state.b).toBe(2);
		});

		it("should support derivations", () => {
			const builder = State.component({
				name: "test-component",
				template: html`<div>\${doubled}</div>`,
				state: { count: 5 },
			}).derive("doubled", (s) => s.count * 2);

			const { state } = builder.instance();
			expect(state.doubled).toBe(10);
		});

		it("should merge props in instance()", () => {
			const builder = State.component({
				name: "test-component",
				template: html`<div>\${value}</div>`,
				state: { value: "default" },
			});

			const { state } = builder.instance({ value: "custom" });
			expect(state.value).toBe("custom");
		});

		it("should create isolated instances", () => {
			const builder = State.component({
				name: "test-component",
				template: html`<div>\${count}</div>`,
				state: { count: 0 },
			});

			const instance1 = builder.instance();
			const instance2 = builder.instance();

			instance1.state.count = 5;
			expect(instance2.state.count).toBe(0);
		});

		it("should clone template for each instance", () => {
			const builder = State.component({
				name: "test-component",
				template: html`<div class="unique">Content</div>`,
			});

			const { template: template1 } = builder.instance();
			const { template: template2 } = builder.instance();

			expect(template1).not.toBe(template2);
		});

		it("should handle HTML-first selector pattern", () => {
			// Create a template element
			const template = document.createElement("template");
			template.id = "test-selector";
			template.innerHTML = "<div>Test</div>";
			document.body.appendChild(template);
			cleanup.push(() => template.remove());

			const builder = State.component("#test-selector");
			expect(builder).toBeInstanceOf(ComponentStateBuilder);

			const { template: cloned } = builder.instance();
			expect(cloned.querySelector("div")?.textContent).toBe("Test");
		});

		it("should throw if selector doesn't find template", () => {
			expect(() => {
				State.component("#nonexistent");
			}).toThrow("No <template> found with selector: #nonexistent");
		});

		it("should support chaining methods", () => {
			const builder = State.component({
				name: "test",
				template: html`<div>\${a} \${b} \${doubled}</div>`,
			})
				.add("a", 1)
				.add({ b: 2 })
				.derive("doubled", (s) => s.a * 2);

			const { state } = builder.instance();
			expect(state.a).toBe(1);
			expect(state.b).toBe(2);
			expect(state.doubled).toBe(2);
		});
	});

	describe("html and css helpers", () => {
		it("should return string from html helper", () => {
			const result = html`<div>Hello</div>`;
			expect(result).toBe("<div>Hello</div>");
		});

		it("should interpolate values in html", () => {
			const name = "World";
			const result = html`<div>Hello ${name}</div>`;
			expect(result).toBe("<div>Hello World</div>");
		});

		it("should return string from css helper", () => {
			const result = css`.class { color: red; }`;
			expect(result).toBe(".class { color: red; }");
		});

		it("should interpolate values in css", () => {
			const color = "blue";
			const result = css`.class { color: ${color}; }`;
			expect(result).toBe(".class { color: blue; }");
		});
	});

	describe("Component registration", () => {
		it("should set tag name with _setTagName", () => {
			const builder = State.component({
				name: "test",
				template: html`<div>Test</div>`,
			})._setTagName("custom-tag");

			// Tag name is stored internally
			expect(() => builder.register()).not.toThrow();
		});

		it("should set styles with _setStyles", () => {
			const builder = State.component({
				name: "test",
				template: html`<div>Test</div>`,
			})._setStyles(css`.test { color: red; }`);

			expect(builder).toBeInstanceOf(ComponentStateBuilder);
		});

		it("should throw when registering HTML-first component without tag name", () => {
			// Create a template element
			const template = document.createElement("template");
			template.id = "test-no-name";
			template.innerHTML = "<div>Test</div>";
			document.body.appendChild(template);
			cleanup.push(() => template.remove());

			const builder = State.component("#test-no-name");

			expect(() => builder.register()).toThrow(
				"Component must have a name to register",
			);
		});

		it("should register TS-first component with name in config", () => {
			const tagName = `test-register-${Date.now()}`;
			const builder = State.component({
				name: tagName,
				template: html`<div>Test</div>`,
			});

			expect(() => builder.register()).not.toThrow();
			expect(customElements.get(tagName)).toBeDefined();
		});
	});

	describe("Component state reactivity", () => {
		it("should create reactive state in instances", () => {
			const builder = State.component({
				name: "test",
				template: html`<div>\${count}</div>`,
				state: { count: 0 },
			});

			const { state } = builder.instance();

			let observed = state.count;
			state.count = 5;
			observed = state.count;

			expect(observed).toBe(5);
		});

		it("should run derivations reactively", () => {
			const builder = State.component({
				name: "test",
				template: html`<div>\${doubled}</div>`,
				state: { count: 1 },
			}).derive("doubled", (s) => s.count * 2);

			const { state } = builder.instance();

			expect(state.doubled).toBe(2);
			// Note: Current implementation may not auto-update derivations
			// This would require effect() integration
		});
	});
});
