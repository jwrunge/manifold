import { expect, test } from "vitest";
import { State } from "../State";

test("debug array access tracking", () => {
	const arrayState = new State([1, 2, 3]);

	let effectRuns = 0;
	let accessedValue: any;

	// Track entire array
	arrayState.effect(() => {
		accessedValue = arrayState.value;
		effectRuns++;
		console.log("Effect ran, count:", effectRuns, "value:", accessedValue);
	});

	console.log("Initial effect runs:", effectRuns);

	// Test push - should trigger effect exactly once
	console.log("Calling push...");
	arrayState.value.push(4);
	console.log("After push - effect runs:", effectRuns);

	expect(effectRuns).toBe(2); // Initial + 1 from push
});
