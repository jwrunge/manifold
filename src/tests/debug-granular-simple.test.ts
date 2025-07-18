import { expect, test } from "vitest";
import { State } from "../State";

test("debug granular tracking simple", () => {
	const myState = new State({
		name: "Jane",
		age: 30,
		meta: {
			score: 100,
		},
	});

	let storeUpdateCount = 0;
	let nameUpdateCount = 0;

	// Track entire state
	console.log("Setting up store effect...");
	myState.effect(() => {
		console.log(
			"Store effect running, count will be:",
			storeUpdateCount + 1
		);
		const value = myState.value;
		storeUpdateCount++;
		console.log("Store effect finished, count:", storeUpdateCount);
	});

	// Track name granularly
	console.log("Setting up name effect...");
	myState.effect(() => {
		console.log("Name effect running, count will be:", nameUpdateCount + 1);
		const name = myState.value.name;
		nameUpdateCount++;
		console.log(
			"Name effect finished, count:",
			nameUpdateCount,
			"name:",
			name
		);
	});

	console.log(
		"Initial counts - store:",
		storeUpdateCount,
		"name:",
		nameUpdateCount
	);

	// Update name
	console.log("\nSetting name = 'John'...");
	myState.value.name = "John";

	console.log(
		"Final counts - store:",
		storeUpdateCount,
		"name:",
		nameUpdateCount
	);

	// Both should be 2: initial + update
	expect(storeUpdateCount).toBe(2);
	expect(nameUpdateCount).toBe(2);
});
