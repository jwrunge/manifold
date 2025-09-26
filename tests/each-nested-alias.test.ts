import { describe, expect, test } from "vitest";
import StateBuilder from "../src/main.ts";
import RegEl from "../src/registry.ts";

const flush = () => new Promise((r) => setTimeout(r, 0));

describe(":each nested alias patterns", () => {
	test(":each with nested object and array patterns binds correctly", async () => {
		const state = StateBuilder.create(undefined, {
			items: [
				{ user: { name: "Ada" }, meta: [10, 20] },
				{ user: { name: "Alan" }, meta: [30, 40] },
			],
		}).build() as { items: { user: { name: string }; meta: number[] }[] };

		document.body.innerHTML = `<ul><li :each="items as { user: { name }, meta: [first, second] }, i">\${i}: \${name}-\${first}-\${second}</li></ul>`;
		const ul = document.querySelector("ul");
		if (!ul) throw new Error("ul missing");
		const li = ul.querySelector("li");
		if (!li) throw new Error("li missing");

		new RegEl(li as HTMLElement, state as unknown as Record<string, unknown>);
		await flush();

		const texts = Array.from(
			ul.querySelectorAll("li:not([style*='display: none'])"),
		).map((el) => el.textContent?.trim());

		expect(texts).toEqual(["0: Ada-10-20", "1: Alan-30-40"]);
	});
});
