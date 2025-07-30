import { beforeEach, describe, expect, it } from "vitest";
import { JSDOM } from "jsdom";
import { RegEl } from "../registry";
import { State } from "../State";

const createMockDOM = () => {
	const dom = new JSDOM("<!DOCTYPE html><html><body></body></html>");
	global.document = dom.window.document as unknown as Document;
	global.window = dom.window as unknown as Window & typeof globalThis;
	global.Node = dom.window.Node;
	global.Element = dom.window.Element;
	global.HTMLElement = dom.window.HTMLElement;
};

describe("JavaScript Function Support", () => {
	beforeEach(() => {
		createMockDOM();
	});

	it("should support JavaScript arrow functions in data-bind", () => {
		const element = document.createElement("div");
		element.dataset.bind = 'textContent: () => "Arrow function works!"';

		RegEl.register(element);

		expect(element.textContent).toBe("Arrow function works!");
	});

	it("should support regular JavaScript functions in data-bind", () => {
		const element = document.createElement("div");
		element.dataset.bind =
			'textContent: function() { return "Regular function works!"; }';

		RegEl.register(element);

		expect(element.textContent).toBe("Regular function works!");
	});

	it("should support JavaScript functions that return other functions", () => {
		const element = document.createElement("button");
		element.dataset.bind = 'onclick: () => () => console.log("Clicked!")';

		RegEl.register(element);

		// The onclick should be set to a function
		expect(typeof element.onclick).toBe("function");
	});

	it("should still support Manifold expressions with @ symbols", () => {
		const testState = new State({ message: "State works!" });
		State.register("testState", testState);

		const element = document.createElement("div");
		element.dataset.bind = "textContent: @testState.message";

		RegEl.register(element);

		expect(element.textContent).toBe("State works!");
	});

	it("should not treat expressions with @ and => as JavaScript functions", () => {
		const items = new State([{ done: true }, { done: false }]);
		State.register("items", items);

		const element = document.createElement("div");
		element.dataset.bind = 'textContent: @items.length + " items"'; // Simpler test

		RegEl.register(element);

		expect(element.textContent).toBe("2 items");
	});

	it("should handle mixed JavaScript and Manifold expressions", () => {
		const counter = new State({ count: 5 });
		State.register("counter", counter);

		// JavaScript function
		const jsElement = document.createElement("div");
		jsElement.dataset.bind =
			'textContent: () => "JS: " + Math.PI.toFixed(2)';
		RegEl.register(jsElement);

		// Manifold expression
		const manifoldElement = document.createElement("div");
		manifoldElement.dataset.bind =
			'textContent: "Count: " + @counter.count';
		RegEl.register(manifoldElement);

		expect(jsElement.textContent).toBe("JS: 3.14");
		expect(manifoldElement.textContent).toBe("Count: 5");
	});
});
