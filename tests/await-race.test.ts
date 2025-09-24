import { describe, expect, test } from "vitest";
import StateBuilder from "../src/main.ts";
import RegEl from "../src/registry.ts";

const flush = () => new Promise((r) => setTimeout(r, 0));
const multiFlush = async (n = 6) => {
	for (let i = 0; i < n; i++) await flush();
};

// Ensure only the latest promise result updates the UI when promises resolve out of order
// Regression test for :await race fix

describe(":await race handling", () => {
	test("only the latest promise updates then/catch when resolving out of order", async () => {
		type S = { p: Promise<string> | null };
		const state = StateBuilder.create<S>(undefined, { p: null }).build();

		let resolveA: (v: string) => void = () => {};
		let resolveB: (v: string) => void = () => {};
		const pA = new Promise<string>((r) => {
			resolveA = r;
		});
		const pB = new Promise<string>((r) => {
			resolveB = r;
		});

		document.body.innerHTML = `
<div>
  <p id="await" :await="p">Loading</p>
  <p id="then" :then="v">Then: \${v}</p>
  <p id="catch" :catch="e">Error: \${e}</p>
</div>`;
		const root = document.querySelector("div");
		if (!root) throw new Error("root missing");
		for (const el of Array.from(root.children))
			new RegEl(
				el as HTMLElement,
				state as unknown as Record<string, unknown>
			);

		// assign first promise, then replace with second before it resolves
		state.p = pA;
		await multiFlush(4);
		state.p = pB;
		await multiFlush(4);

		// resolve A late; should NOT show
		resolveA("A");
		await multiFlush(6);
		const then1 = document.getElementById("then");
		if (!then1) throw new Error("then missing");
		expect(then1.style.display).toBe("none");

		// resolve B; SHOULD show
		resolveB("B");
		await multiFlush(6);
		const then2 = document.getElementById("then");
		if (!then2) throw new Error("then missing");
		expect(then2.style.display).toBe("");
	});
});
