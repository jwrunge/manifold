import { expect, test } from "vitest";
import { State } from "../State";

test("debug multiple effects", () => {
	const state = new State(0);
	let effect1Runs = 0;
	let effect2Runs = 0;
	let effect3Runs = 0;

	state.effect(() => {
		state.value; // Actually access the value!
		effect1Runs++;
		console.log("Effect 1 ran, count:", effect1Runs, "value:", state.value);
	});

	state.effect(() => {
		state.value; // Actually access the value!
		effect2Runs++;
		console.log("Effect 2 ran, count:", effect2Runs, "value:", state.value);
	});

	state.effect(() => {
		state.value; // Actually access the value!
		effect3Runs++;
		console.log("Effect 3 ran, count:", effect3Runs, "value:", state.value);
	});

	console.log(
		"Initial - effect1:",
		effect1Runs,
		"effect2:",
		effect2Runs,
		"effect3:",
		effect3Runs
	);

	expect(effect1Runs).toBe(1);
	expect(effect2Runs).toBe(1);
	expect(effect3Runs).toBe(1);

	console.log("Setting state.value = 1...");
	state.value = 1;

	console.log(
		"After change - effect1:",
		effect1Runs,
		"effect2:",
		effect2Runs,
		"effect3:",
		effect3Runs
	);

	expect(effect1Runs).toBe(2);
	expect(effect2Runs).toBe(2);
	expect(effect3Runs).toBe(2);
});
