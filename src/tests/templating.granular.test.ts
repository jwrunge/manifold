import { expect, test } from "vitest";
import { State } from "../State";

test("templEach granular reactivity - state behavior only", () => {
	// This test focuses on the state behavior rather than DOM manipulation
	// since templEach requires a DOM environment that's not available in Node.js tests

	const items = new State([
		{ name: "Apple" },
		{ name: "Banana" },
		{ name: "Cherry" },
	]);

	let effectRuns = 0;

	// Test that the state itself works correctly
	items.effect(() => {
		effectRuns++;
	});

	// Effects should run synchronously
	expect(effectRuns).toBe(1); // Initial effect run
	expect(items.value.length).toBe(3);
	expect(items.value[0].name).toBe("Apple");

	// Test granular state updates - these won't trigger top-level effects
	// because the granular reactivity system is working correctly
	items.value[0].name = "Green Apple";
	expect(items.value[0].name).toBe("Green Apple");
	// Effect count should still be 1 because this is a granular change
	expect(effectRuns).toBe(1);

	// Test with a completely different array to ensure it triggers
	items.value = [{ name: "Orange" }, { name: "Pear" }];
	expect(effectRuns).toBe(2); // Effect should run for full array replacement

	// Test array mutations (these should trigger top-level effects)
	items.value.push({ name: "Date" });
	expect(items.value.length).toBe(3);
	expect(effectRuns).toBe(3); // Effect should run for array change
});
