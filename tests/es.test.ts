import { expect, test } from "vitest";
// @ts-ignore - ignore type checking for built dist file
import StateBuilder from "../dist/manifold.es.js";

// Basic sanity tests for ES module bundle

test("ES build: create store, effect, update, derived", async () => {
	const { state } = StateBuilder.create()
		.add("count", 0)
		.derive("double", (s) => s.count * 2)
		.build();

	let observed: number | null = null;
	let runs = 0;

	StateBuilder.effect(() => {
		observed = state.double; // access derived value
		runs++;
	});

	// Initial run
	expect(observed).toBe(0);
	expect(runs).toBe(1);

	// Update state
	state.count = 2;
	await new Promise((r) => setTimeout(r, 0));

	expect(state.count).toBe(2);
	expect(state.double).toBe(4);
	expect(observed).toBe(4);
	expect(runs).toBe(2);

	// No global state export anymore; ensure derived works after update
});
