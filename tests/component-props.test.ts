import { afterEach, describe, expect, test } from "vitest";
import { renderComponent } from "../src/component.ts";

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

afterEach(() => {
	document.body.innerHTML = "";
});

describe("renderComponent integration", () => {
	test("scoped state drives template expressions", async () => {
		const template = `
			<section>
				<p id="value">\${count}</p>
				<button type="button" data-mf-onclick="() => count++">Add</button>
			</section>
		`;

		const { state } = await renderComponent(
			"mf-counter",
			{ template },
			{
				target: document.body,
				data: { count: 0 },
			},
		);

		const valueEl = document.querySelector("#value");
		expect(valueEl?.textContent?.trim()).toBe("0");

		state.count = 5;
		await flush();
		expect(valueEl?.textContent?.trim()).toBe("5");
	});

	test("default and named slots replace slot elements", async () => {
		const template = `
			<article>
				<header>
					<slot name="title">Fallback</slot>
				</header>
				<slot>Missing</slot>
			</article>
		`;

		const header = document.createElement("h1");
		header.textContent = "Injected";

		await renderComponent(
			"mf-card",
			{ template },
			{
				target: document.body,
				slots: {
					title: header,
					default: "Body copy",
				},
			},
		);

		expect(document.querySelector("header")?.textContent?.trim()).toBe(
			"Injected",
		);
		expect(document.querySelector("article")?.textContent).toContain(
			"Body copy",
		);
		expect(document.querySelector("slot")).toBeNull();
	});
});
