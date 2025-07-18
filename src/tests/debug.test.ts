import { expect, test } from "vitest";
import { State } from "../State";

test("debug granular test", () => {
	const myState = new State({ name: "Jake", age: 37 });

	let storeUpdateCount = 0;
	let nameUpdateCount = 0;

	// Track entire state
	myState.effect(() => {
		myState.value;
		storeUpdateCount++;
		console.log("Store effect ran, count:", storeUpdateCount);
	});

	// Track name granularly
	myState.effect(() => {
		myState.value.name;
		nameUpdateCount++;
		console.log("Name effect ran, count:", nameUpdateCount);
	});

	console.log(
		"Initial counts - store:",
		storeUpdateCount,
		"name:",
		nameUpdateCount
	);

	// Update name
	console.log("Updating name...");
	myState.value.name = "John";

	console.log(
		"After update - store:",
		storeUpdateCount,
		"name:",
		nameUpdateCount
	);
	console.log("Actual name:", myState.value.name);

	expect(storeUpdateCount).toBe(2);
	expect(nameUpdateCount).toBe(2);
});
