import { expect, test } from "vitest";
import { State } from "../State";

test("debug state value setter", () => {
	const state = new State(0);
	let effectRuns = 0;

	state.effect(() => {
		state.value; // Access the value
		effectRuns++;
		console.log("Effect ran, count:", effectRuns, "value:", state.value);
	});

	console.log("Initial effect runs:", effectRuns);

	// Set to different value
	console.log("Setting value to 1...");
	state.value = 1;
	console.log("After setting to 1 - effect runs:", effectRuns);

	expect(effectRuns).toBe(2); // Initial + 1 from setter
});
