import { expect, test } from "vitest";
import { State } from "../reactivity";

test("Array granular vs top-level effect tracking", () => {
	const arr = new State([
		{ name: "Alice", age: 25 },
		{ name: "Bob", age: 30 },
	]);

	let topLevelEffectRuns = 0;
	let granular0EffectRuns = 0;
	let granular1EffectRuns = 0;
	let granularLengthRuns = 0;

	// Top-level effect - should track the entire array
	arr.effect(() => {
		topLevelEffectRuns++;
		console.log("Top-level effect:", arr.value.length, "items");
	});

	// Granular effect on index 0
	arr.effect(() => {
		granular0EffectRuns++;
		console.log("Granular 0 effect:", arr.value[0]?.name);
	});

	// Granular effect on index 1
	arr.effect(() => {
		granular1EffectRuns++;
		console.log("Granular 1 effect:", arr.value[1]?.name);
	});

	// Granular effect on length
	arr.effect(() => {
		granularLengthRuns++;
		console.log("Length effect:", arr.value.length);
	});

	// Initial runs
	expect(topLevelEffectRuns).toBe(1);
	expect(granular0EffectRuns).toBe(1);
	expect(granular1EffectRuns).toBe(1);
	expect(granularLengthRuns).toBe(1);

	// Test 1: Modify index 0 directly
	console.log("\\n--- Modifying arr.value[0].name ---");
	arr.value[0].name = "Alice Updated";

	console.log(`After index 0 name change:
	Top-level: ${topLevelEffectRuns}
	Granular 0: ${granular0EffectRuns} 
	Granular 1: ${granular1EffectRuns}
	Length: ${granularLengthRuns}`);

	// Test 2: Replace entire element at index 0
	console.log("\\n--- Replacing entire arr.value[0] ---");
	arr.value[0] = { name: "Charlie", age: 35 };

	console.log(`After index 0 replacement:
	Top-level: ${topLevelEffectRuns}
	Granular 0: ${granular0EffectRuns}
	Granular 1: ${granular1EffectRuns} 
	Length: ${granularLengthRuns}`);

	// Test 3: Push new element (affects length)
	console.log("\\n--- Pushing new element ---");
	arr.value.push({ name: "David", age: 40 });

	console.log(`After push:
	Top-level: ${topLevelEffectRuns}
	Granular 0: ${granular0EffectRuns}
	Granular 1: ${granular1EffectRuns}
	Length: ${granularLengthRuns}`);
});
