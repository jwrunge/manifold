import { describe, expect, test } from "vitest";
import StateBuilder from "../src/main.ts";
import RegEl from "../src/registry.ts";

const flush = () => new Promise((r) => setTimeout(r, 0));

describe(":each object destructuring aliases", () => {
	test(":each with {name, age} binds correctly", async () => {
		const state = StateBuilder.create(undefined, {
			people: [
				{ name: "Jake", age: 37 },
				{ name: "Mary", age: 37 },
				{ name: "Isaac", age: 6 },
			],
		}).build() as { people: { name: string; age: number }[] };

		document.body.innerHTML = `<ul><li :each="people as {name, age}">\${name} (\${age})</li></ul>`;
		const ul = document.querySelector("ul");
		if (!ul) throw new Error("ul missing");
		const li = ul.querySelector("li");
		if (!li) throw new Error("li missing");
		new RegEl(
			li as HTMLElement,
			state as unknown as Record<string, unknown>
		);
		await flush();

		const texts = Array.from(
			ul.querySelectorAll("li:not([style*='display: none'])")
		).map((el) => el.textContent?.trim());

		expect(texts).toEqual(["Jake (37)", "Mary (37)", "Isaac (6)"]);
	});

	test(":each with {name, age}, i binds both value and index", async () => {
		const state = StateBuilder.create(undefined, {
			people: [
				{ name: "Ada", age: 40 },
				{ name: "Alan", age: 42 },
			],
		}).build() as { people: { name: string; age: number }[] };

		document.body.innerHTML = `<ul><li :each="people as {name, age}, i">\${i}: \${name}-\${age}</li></ul>`;
		const ul = document.querySelector("ul");
		if (!ul) throw new Error("ul missing");
		const li = ul.querySelector("li");
		if (!li) throw new Error("li missing");
		new RegEl(
			li as HTMLElement,
			state as unknown as Record<string, unknown>
		);
		await flush();

		const texts = Array.from(
			ul.querySelectorAll("li:not([style*='display: none'])")
		).map((el) => el.textContent?.trim().replace(/\s+/g, " "));

		expect(texts).toEqual(["0: Ada-40", "1: Alan-42"]);
	});
});
