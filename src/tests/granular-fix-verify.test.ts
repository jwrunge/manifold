import { test, expect } from "vitest";
import { State } from "../State";

test("granular reactivity fix verification", () => {
	const arr = new State([
		{ name: "Apple", price: 1.0 },
		{ name: "Banana", price: 0.5 },
		{ name: "Cherry", price: 2.0 },
	]);

	let effectRuns = 0;

	// Test granular reactivity with deep property access
	const itemStateDeep0 = new State(() => {
		const item = arr.value[0];
		return item && typeof item === "object"
			? JSON.parse(JSON.stringify(item))
			: item;
	});

	const itemStateDeep1 = new State(() => {
		const item = arr.value[1];
		return item && typeof item === "object"
			? JSON.parse(JSON.stringify(item))
			: item;
	});

	itemStateDeep0.effect(() => {
		effectRuns++;
	});

	itemStateDeep1.effect(() => {
		effectRuns++;
	});

	// Effects should run synchronously
	expect(effectRuns).toBe(2);

	// Test 1: Update individual item (should trigger only that item's effect)
	const beforeRuns = effectRuns;
	arr.value[0].name = "Green Apple";
	expect(effectRuns - beforeRuns).toBe(1);

	// Test 2: Update different item (should trigger only that item's effect)
	const beforeRuns2 = effectRuns;
	arr.value[1].price = 0.75;
	expect(effectRuns - beforeRuns2).toBe(1);

	// Test 3: Replace entire item (should trigger only that item's effect)
	const beforeRuns3 = effectRuns;
	arr.value[0] = { name: "Red Apple", price: 1.25 };
	expect(effectRuns - beforeRuns3).toBe(1);
});
