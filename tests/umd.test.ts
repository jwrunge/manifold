import { expect, test } from "vitest";
// Import the UMD bundle. In a Node + Vitest environment with ESM, dynamic import via createRequire or eval would be needed.
// Since the UMD builds attaches to a namespace when required, we can import it directly and access exports.
// @ts-expect-error - ignore type checking for built dist file
import * as UMD from "../dist/manifold.umd.js";

const { default: StateBuilder } = UMD as unknown as {
	default: typeof import("../src/main.ts").Manifold;
};

test("UMD build: create store, update, derived", async () => {
	const state = StateBuilder.create()
		.add("count", 1)
		.derive("triple", (s) => s.count * 3)
		.build();

	// Initial derived
	await new Promise((r) => setTimeout(r, 0));
	expect(state.triple).toBe(3);

	// Update state
	state.count = 4;
	await new Promise((r) => setTimeout(r, 0));

	expect(state.count).toBe(4);
	expect(state.triple).toBe(12);
	expect(state.triple).toBe(12);

	// No globalState export anymore
});
