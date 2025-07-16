import { State } from "../reactivity";

// Test granular reactivity in derived states
console.log("=== Testing Granular Reactivity Fix ===");

const arr = new State([
	{ name: "Apple", price: 1.0 },
	{ name: "Banana", price: 0.5 },
	{ name: "Cherry", price: 2.0 },
]);

let effectRuns = 0;

// Test granular reactivity with deep property access
const itemStateDeep0 = new State(() => {
	const item = arr.value[0];
	// Force deep tracking by accessing properties and serializing
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
	console.log(`Deep Item 0 effect run #${effectRuns}:`, itemStateDeep0.value);
});

itemStateDeep1.effect(() => {
	effectRuns++;
	console.log(`Deep Item 1 effect run #${effectRuns}:`, itemStateDeep1.value);
});

console.log("\\nInitial effects run. Now testing updates...");

// Test 1: Update individual item (should trigger only that item's effect)
console.log("\\n--- Test 1: Update arr.value[0].name ---");
const beforeRuns = effectRuns;
arr.value[0].name = "Green Apple";
console.log(`Effect runs increased by: ${effectRuns - beforeRuns}`);

// Test 2: Update different item (should trigger only that item's effect)
console.log("\\n--- Test 2: Update arr.value[1].price ---");
const beforeRuns2 = effectRuns;
arr.value[1].price = 0.75;
console.log(`Effect runs increased by: ${effectRuns - beforeRuns2}`);

// Test 3: Replace entire item (should trigger only that item's effect)
console.log("\\n--- Test 3: Replace arr.value[0] entirely ---");
const beforeRuns3 = effectRuns;
arr.value[0] = { name: "Red Apple", price: 1.25 };
console.log(`Effect runs increased by: ${effectRuns - beforeRuns3}`);

console.log("\\n=== Test Complete ===");

export {};
