import { test, expect } from "vitest";
import { State } from "../State";

test("derived state debugging placeholder", () => {
	// Placeholder test for future debugging functionality
	const state = new State(42);
	expect(state.value).toBe(42);

	state.value = 100;
	expect(state.value).toBe(100);
});
