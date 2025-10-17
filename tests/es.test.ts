import { expect, test } from "vitest";

const loadESBuilder = async () =>
	(await import("../dist/manifold.js")) as unknown as {
		default: typeof import("../src/main.ts").default;
	};

// Basic sanity tests for ES module bundle

test("ES build: create store, update, derived", async () => {
	const { default: StateBuilder } = await loadESBuilder();
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
