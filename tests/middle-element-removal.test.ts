import { beforeEach, describe, expect, test } from "vitest";
import StateBuilder from "../src/main.ts";
import RegEl from "../src/registry.ts";

// Microtask flush helper
const flush = () => new Promise((r) => setTimeout(r, 0));

describe("Middle Element Removal Fix", () => {
	beforeEach(() => {
		document.body.innerHTML = "";
		document.head.innerHTML = "";
	});

	test("removing middle element from array correctly identifies and removes the right DOM element", async () => {
		// Create state with array that has unique values
		const state = StateBuilder.create(undefined, {
			items: ["first", "middle", "last"],
		}).build() as { items: string[] };

		// Set up DOM with :each
		document.body.innerHTML = `<ul><li :each="items as item, i" data-value="\${item}">(\${i}) \${item}</li></ul>`;
		const ul = document.querySelector("ul");
		if (!ul) throw new Error("ul missing");
		const template = ul.querySelector("li");
		if (!template) throw new Error("template missing");

		// Initialize the RegEl
		new RegEl(
			template as HTMLElement,
			state as unknown as Record<string, unknown>
		);
		await flush();

		// Get the initial DOM elements
		const getItems = () =>
			Array.from(ul.querySelectorAll("li:not([style*='display: none'])"));
		const initialItems = getItems();

		// Verify initial state
		expect(initialItems.length).toBe(3);
		expect(initialItems[0].textContent?.trim()).toBe("(0) first");
		expect(initialItems[1].textContent?.trim()).toBe("(1) middle");
		expect(initialItems[2].textContent?.trim()).toBe("(2) last");

		// Store references to the specific DOM elements
		const firstElement = initialItems[0];
		const middleElement = initialItems[1];
		const lastElement = initialItems[2];

		// Remove the middle element from the array
		state.items = ["first", "last"];
		await flush();

		// Get DOM elements after removal
		const finalItems = getItems();

		// Verify the correct number of elements remain
		expect(finalItems.length).toBe(2);

		// Verify the content is correct
		expect(finalItems[0].textContent?.trim()).toBe("(0) first");
		expect(finalItems[1].textContent?.trim()).toBe("(1) last");

		// CRITICAL: The first and last elements should be the SAME DOM objects
		// This proves that the middle element was correctly identified and removed
		expect(finalItems[0]).toBe(firstElement);
		expect(finalItems[1]).toBe(lastElement);

		// The middle element should no longer be in the DOM
		expect(document.contains(middleElement)).toBe(false);
	});

	test("removing first element correctly identifies and removes the right DOM element", async () => {
		const state = StateBuilder.create(undefined, {
			items: ["first", "second", "third"],
		}).build() as { items: string[] };

		document.body.innerHTML = `<ul><li :each="items as item, i">(\${i}) \${item}</li></ul>`;
		const ul = document.querySelector("ul");
		if (!ul) throw new Error("ul missing");
		const template = ul.querySelector("li");
		if (!template) throw new Error("template missing");

		new RegEl(
			template as HTMLElement,
			state as unknown as Record<string, unknown>
		);
		await flush();

		const getItems = () =>
			Array.from(ul.querySelectorAll("li:not([style*='display: none'])"));
		const initialItems = getItems();

		const firstElement = initialItems[0];
		const secondElement = initialItems[1];
		const thirdElement = initialItems[2];

		// Remove the first element
		state.items = ["second", "third"];
		await flush();

		const finalItems = getItems();
		expect(finalItems.length).toBe(2);
		expect(finalItems[0].textContent?.trim()).toBe("(0) second");
		expect(finalItems[1].textContent?.trim()).toBe("(1) third");

		// The second and third elements should be the same DOM objects
		expect(finalItems[0]).toBe(secondElement);
		expect(finalItems[1]).toBe(thirdElement);
		expect(document.contains(firstElement)).toBe(false);
	});

	test("removing last element still works correctly (legacy behavior)", async () => {
		const state = StateBuilder.create(undefined, {
			items: ["first", "second", "third"],
		}).build() as { items: string[] };

		document.body.innerHTML = `<ul><li :each="items as item, i">(\${i}) \${item}</li></ul>`;
		const ul = document.querySelector("ul");
		if (!ul) throw new Error("ul missing");
		const template = ul.querySelector("li");
		if (!template) throw new Error("template missing");

		new RegEl(
			template as HTMLElement,
			state as unknown as Record<string, unknown>
		);
		await flush();

		const getItems = () =>
			Array.from(ul.querySelectorAll("li:not([style*='display: none'])"));
		const initialItems = getItems();

		const firstElement = initialItems[0];
		const secondElement = initialItems[1];
		const thirdElement = initialItems[2];

		// Remove the last element
		state.items = ["first", "second"];
		await flush();

		const finalItems = getItems();
		expect(finalItems.length).toBe(2);
		expect(finalItems[0].textContent?.trim()).toBe("(0) first");
		expect(finalItems[1].textContent?.trim()).toBe("(1) second");

		// The first and second elements should be the same DOM objects
		expect(finalItems[0]).toBe(firstElement);
		expect(finalItems[1]).toBe(secondElement);
		expect(document.contains(thirdElement)).toBe(false);
	});
});
