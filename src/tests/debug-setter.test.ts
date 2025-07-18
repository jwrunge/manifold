import { expect, test } from "vitest";
import { State } from "../State";

test("debug value setter", () => {
	const state = new State({ count: 0 });
	let effectRuns = 0;

	state.effect(() => {
		state.value;
		effectRuns++;
		console.log("Effect ran, count:", effectRuns, "value:", state.value);
	});

	console.log("Initial effect runs:", effectRuns);

	// Setting to same value should not trigger update
	console.log("Setting to same value...");
	state.value = { count: 0 };
	console.log("After same value - effect runs:", effectRuns);

	// Setting to different value should trigger update
	console.log("Setting to different value...");
	state.value = { count: 1 };
	console.log("After different value - effect runs:", effectRuns);
});
