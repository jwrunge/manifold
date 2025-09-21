import { beforeEach, describe, expect, test } from "vitest";
import StateBuilder from "../src/main.ts";
import RegEl from "../src/registry.ts";

// Microtask flush helper
const flush = () => new Promise((r) => setTimeout(r, 0));

describe("Specific Bug Fix: Item 3, 4, 5 scenario", () => {
	beforeEach(() => {
		document.body.innerHTML = "";
		document.head.innerHTML = "";
	});

	test("removing item 3 from [item 3, item 4, item 5] correctly shows [item 4, item 5]", async () => {
		const state = StateBuilder.create(undefined, {
			items: ["item 3", "item 4", "item 5"],
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
		const getText = () => getItems().map((el) => el.textContent?.trim());

		// Initial state
		expect(getText()).toEqual(["(0) item 3", "(1) item 4", "(2) item 5"]);

		// Store references to DOM elements
		const initialElements = getItems();
		const item3Element = initialElements[0];
		const item4Element = initialElements[1];
		const item5Element = initialElements[2];

		// Remove "item 3" (first element)
		state.items = ["item 4", "item 5"];
		await flush();

		const finalElements = getItems();
		const finalText = getText();

		// Should now show: [(0) item 4, (1) item 5]
		expect(finalText).toEqual(["(0) item 4", "(1) item 5"]);
		expect(finalElements.length).toBe(2);

		// The bug would show: [(0) item 5, (1) item 5] or similar
		// Verify it's NOT showing the same item twice
		expect(finalText[0]).not.toBe(finalText[1]);

		// Verify content is correct
		expect(finalText[0]).toBe("(0) item 4");
		expect(finalText[1]).toBe("(1) item 5");

		// The item4Element and item5Element should be preserved (just updated)
		expect(finalElements[0]).toBe(item4Element);
		expect(finalElements[1]).toBe(item5Element);

		// The item3Element should be removed from DOM
		expect(document.contains(item3Element)).toBe(false);
	});

	test("removing middle item from [a, b, c, d, e] preserves correct items", async () => {
		const state = StateBuilder.create(undefined, {
			items: ["a", "b", "c", "d", "e"],
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
		const getText = () => getItems().map((el) => el.textContent?.trim());

		// Initial state
		expect(getText()).toEqual([
			"(0) a",
			"(1) b",
			"(2) c",
			"(3) d",
			"(4) e",
		]);

		// Remove "c" (middle element at index 2)
		state.items = ["a", "b", "d", "e"];
		await flush();

		const finalText = getText();

		// Should show: [(0) a, (1) b, (2) d, (3) e]
		expect(finalText).toEqual(["(0) a", "(1) b", "(2) d", "(3) e"]);

		// Verify no duplicates
		const uniqueTexts = new Set(finalText);
		expect(uniqueTexts.size).toBe(finalText.length);

		// Verify all different values
		expect(finalText[0]).toBe("(0) a");
		expect(finalText[1]).toBe("(1) b");
		expect(finalText[2]).toBe("(2) d");
		expect(finalText[3]).toBe("(3) e");
	});
});
