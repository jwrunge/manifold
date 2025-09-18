import { expect, test } from "vitest";
// @ts-ignore - ignore type checking for built dist file
import StateBuilder from "../dist/manifold.es.js";

// Basic sanity tests for ES module bundle

test("ES build: create store, update, derived", async () => {
	const state = StateBuilder.create()
		.add("count", 0)
		.derive("double", (s: { count: number }) => s.count * 2)
		.build();

	// Initial derived
	await new Promise((r) => setTimeout(r, 0));
	expect(state.double).toBe(0);

	// Update state and check derived
	state.count = 2;
	await new Promise((r) => setTimeout(r, 0));
	expect(state.double).toBe(4);
});
