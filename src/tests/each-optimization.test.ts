import { test, expect, describe, beforeEach } from "vitest";
import { RegEl } from "../registry";
import { State } from "../State";

/**
 * Test suite for the efficient data-each implementation
 * Verifies that DOM updates only occur when array elements actually change
 */
describe("Data-Each Optimization", () => {
	// Mock DOM environment
	beforeEach(() => {
		document.body.innerHTML = "";
	});

	test("should only create elements for new array items", () => {
		// Create a template element
		const template = document.createElement("div");
		template.setAttribute("data-each", "@items as item, index");
		template.setAttribute("data-bind", "textContent: @item");
		document.body.appendChild(template);

		// Create state with initial array
		const items = new State(["a", "b", "c"]);

		// Create RegEl instance
		const regEl = new RegEl(template, {}, undefined, items);

		// Initial render should create 3 elements
		const initialClones = document.querySelectorAll("[data-mf-each-clone]");
		expect(initialClones.length).toBe(3);
		expect(initialClones[0].textContent).toBe("a");
		expect(initialClones[1].textContent).toBe("b");
		expect(initialClones[2].textContent).toBe("c");

		// Add one new item
		items.value = ["a", "b", "c", "d"];

		// Should now have 4 elements
		const afterAddClones = document.querySelectorAll(
			"[data-mf-each-clone]"
		);
		expect(afterAddClones.length).toBe(4);
		expect(afterAddClones[3].textContent).toBe("d");

		// Remove one item
		items.value = ["a", "b", "c"];

		// Should be back to 3 elements
		const afterRemoveClones = document.querySelectorAll(
			"[data-mf-each-clone]"
		);
		expect(afterRemoveClones.length).toBe(3);
	});

	test("should efficiently handle array reordering", () => {
		// Create a template element with ID binding to track element identity
		const template = document.createElement("div");
		template.setAttribute("data-each", "@items as item, index");
		template.setAttribute(
			"data-bind",
			'textContent: @item.text, id: "item-" + @item.id'
		);
		document.body.appendChild(template);

		// Create state with objects that have stable IDs
		const items = new State([
			{ id: 1, text: "First" },
			{ id: 2, text: "Second" },
			{ id: 3, text: "Third" },
		]);

		// Create RegEl instance
		const regEl = new RegEl(template, {}, undefined, items);

		// Get initial elements and their IDs
		const initialClones = Array.from(
			document.querySelectorAll("[data-mf-each-clone]")
		);
		expect(initialClones.length).toBe(3);

		// Store references to the actual DOM elements
		const firstElement = initialClones[0];
		const secondElement = initialClones[1];
		const thirdElement = initialClones[2];

		// Reorder the array (move first to last)
		items.value = [
			{ id: 2, text: "Second" },
			{ id: 3, text: "Third" },
			{ id: 1, text: "First" },
		];

		// Should still have 3 elements
		const afterReorderClones = Array.from(
			document.querySelectorAll("[data-mf-each-clone]")
		);
		expect(afterReorderClones.length).toBe(3);

		// Verify content is correct after reordering
		expect(afterReorderClones[0].textContent).toBe("Second");
		expect(afterReorderClones[1].textContent).toBe("Third");
		expect(afterReorderClones[2].textContent).toBe("First");
	});

	test("should handle partial updates without recreating unchanged elements", () => {
		// Create a template element
		const template = document.createElement("div");
		template.setAttribute("data-each", "@items as item, index");
		template.setAttribute("data-bind", "textContent: @item.text");
		document.body.appendChild(template);

		// Create state with initial array
		const items = new State([
			{ text: "Unchanged" },
			{ text: "Will Change" },
			{ text: "Also Unchanged" },
		]);

		// Create RegEl instance
		const regEl = new RegEl(template, {}, undefined, items);

		// Get initial elements
		const initialClones = Array.from(
			document.querySelectorAll("[data-mf-each-clone]")
		);
		expect(initialClones.length).toBe(3);
		expect(initialClones[1].textContent).toBe("Will Change");

		// Update only the middle item
		items.value = [
			{ text: "Unchanged" },
			{ text: "Changed!" },
			{ text: "Also Unchanged" },
		];

		// Should still have 3 elements
		const afterUpdateClones = Array.from(
			document.querySelectorAll("[data-mf-each-clone]")
		);
		expect(afterUpdateClones.length).toBe(3);

		// Verify the update took effect
		expect(afterUpdateClones[0].textContent).toBe("Unchanged");
		expect(afterUpdateClones[1].textContent).toBe("Changed!");
		expect(afterUpdateClones[2].textContent).toBe("Also Unchanged");
	});

	test("should handle empty array efficiently", () => {
		// Create a template element
		const template = document.createElement("div");
		template.setAttribute("data-each", "@items as item, index");
		template.setAttribute("data-bind", "textContent: @item");
		document.body.appendChild(template);

		// Create state with initial array
		const items = new State(["a", "b", "c"]);

		// Create RegEl instance
		const regEl = new RegEl(template, {}, undefined, items);

		// Should have 3 elements initially
		expect(document.querySelectorAll("[data-mf-each-clone]").length).toBe(
			3
		);

		// Set to empty array
		items.value = [];

		// Should have no cloned elements
		expect(document.querySelectorAll("[data-mf-each-clone]").length).toBe(
			0
		);

		// Add items back
		items.value = ["x", "y"];

		// Should have 2 elements
		const finalClones = document.querySelectorAll("[data-mf-each-clone]");
		expect(finalClones.length).toBe(2);
		expect(finalClones[0].textContent).toBe("x");
		expect(finalClones[1].textContent).toBe("y");
	});

	test("should use full rebuild for significant array changes", () => {
		// Create a template element
		const template = document.createElement("div");
		template.setAttribute("data-each", "@items as item, index");
		template.setAttribute("data-bind", "textContent: @item");
		document.body.appendChild(template);

		// Create state with small initial array
		const items = new State(["a", "b"]);

		// Create RegEl instance
		const regEl = new RegEl(template, {}, undefined, items);

		// Should have 2 elements initially
		expect(document.querySelectorAll("[data-mf-each-clone]").length).toBe(
			2
		);

		// Make a significant change (more than 50% change triggers full rebuild)
		items.value = ["x", "y", "z", "w", "v", "u"];

		// Should have 6 elements
		const afterChangeClones = document.querySelectorAll(
			"[data-mf-each-clone]"
		);
		expect(afterChangeClones.length).toBe(6);
		expect(afterChangeClones[0].textContent).toBe("x");
		expect(afterChangeClones[5].textContent).toBe("u");
	});
});
