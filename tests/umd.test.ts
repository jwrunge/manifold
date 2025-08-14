import { expect, test } from "vitest";
// Import the UMD bundle. In a Node + Vitest environment with ESM, dynamic import via createRequire or eval would be needed.
// Since the UMD builds attaches to a namespace when required, we can import it directly and access exports.
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - TypeScript doesn't know the shape of the UMD bundle
import * as UMD from "../dist/manifold.umd.js";

const { default: StateBuilder, globalState } = UMD as unknown as {
	default: typeof import("../src/main.ts").default;
	globalState: unknown;
};

test("UMD build: create store, effect, update, derived", async () => {
	const { state } = StateBuilder.create()
		.add("count", 1)
		.addDerived("triple", (s) => s.count * 3)
		.build(true);

	let observed: number | null = null;
	let runs = 0;

	StateBuilder.effect(() => {
		observed = state.triple; // access derived value
		runs++;
	});

	// Initial run
	expect(observed).toBe(3);
	expect(runs).toBe(1);

	// Update state
	state.count = 4;
	await new Promise((r) => setTimeout(r, 0));

	expect(state.count).toBe(4);
	expect(state.triple).toBe(12);
	expect(observed).toBe(12);
	expect(runs).toBe(2);

	// Ensure globalState not set when built local
	expect(globalState).toBeUndefined();
});
