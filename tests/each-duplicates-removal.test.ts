import { beforeEach, describe, expect, test } from "vitest";
import StateBuilder from "../src/main.ts";
import RegEl from "../src/registry.ts";

const flush = () => new Promise((r) => setTimeout(r, 0));

describe(":each duplicate value removals", () => {
	let state: { items: number[] };
	beforeEach(() => {
		state = StateBuilder.create(undefined, {
			items: [1, 2, 2, 3],
		}).build() as unknown as {
			items: number[];
		};
	});

	test("removing middle duplicate removes the correct element", async () => {
		document.body.innerHTML = `<ul id="list"><li :each="items as it, i">(\${i}) \${it}</li></ul>`;
		const ul = document.getElementById("list") as HTMLUListElement;
		const tmpl = ul.querySelector("li");
		if (!tmpl) throw new Error("template not found");
		new RegEl(
			tmpl as unknown as HTMLElement,
			state as unknown as Record<string, unknown>,
		);
		await flush();

		const texts = () =>
			Array.from(ul.querySelectorAll("li:not([style*='display: none'])")).map(
				(el) => el.textContent?.trim(),
			);
		expect(texts()).toEqual(["(0) 1", "(1) 2", "(2) 2", "(3) 3"]);

		// remove the second '2' (index 2)
		state.items.splice(2, 1);
		state.items = [...state.items];
		await flush();

		expect(texts()).toEqual(["(0) 1", "(1) 2", "(2) 3"]);
	});
});
