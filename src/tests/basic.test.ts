import { expect, test } from "vitest";
import { State } from "../State";

test("basic reactivity works", () => {
	const state = new State(0);
	let effectCount = 0;
	let lastValue = 0;

	const cleanup = state.effect(() => {
		lastValue = state.value;
		effectCount++;
	});

	// Initial effect should run
	expect(effectCount).toBe(1);
	expect(lastValue).toBe(0);

	// Change value
	state.value = 5;

	// Effect should run again
	expect(effectCount).toBe(2);
	expect(lastValue).toBe(5);
});

test("simple object reactivity", () => {
	const state = new State({ count: 0 });
	let effectCount = 0;
	let lastCount = 0;

	state.effect(() => {
		lastCount = state.value.count;
		effectCount++;
	});

	expect(effectCount).toBe(1);
	expect(lastCount).toBe(0);

	// Modify the object
	state.value.count = 10;

	expect(effectCount).toBe(2);
	expect(lastCount).toBe(10);
});
