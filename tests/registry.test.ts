import { beforeEach, describe, expect, test } from "vitest";
import StateBuilder, { currentState } from "../src/main.ts";
import RegEl from "../src/registry.ts";

// Minimal DOM helpers via jsdom already set up in test environment

const initState = (data: Record<string, unknown>) => {
	StateBuilder.create(data as Record<string, unknown>).build(true);
};

describe("registry basics", () => {
	beforeEach(() =>
		initState({
			count: 0,
			list: [
				{ id: 1, v: "a" },
				{ id: 2, v: "b" },
			],
			flag: true,
			promiseVal: 5,
		})
	);

	test("conditional chain data-if / data-elseif / data-else", async () => {
		document.body.innerHTML = `
      <div>
        <p data-if="${"${count > 1}"}" id="ifEl">if</p>
        <p data-elseif="${"${count === 1}"}" id="elseifEl">elseif</p>
        <p data-else="${"${true}"}" id="elseEl">else</p>
      </div>`;
		const root = document.body.firstElementChild as HTMLElement;
		Array.from(root.querySelectorAll("*")).forEach((el) =>
			RegEl.register(el as HTMLElement)
		);
		await new Promise((r) => setTimeout(r, 0));
		expect(
			(document.getElementById("ifEl") as HTMLElement).style.display
		).toBe("none");
		expect(
			(document.getElementById("elseifEl") as HTMLElement).style.display
		).toBe("");
		expect(
			(document.getElementById("elseEl") as HTMLElement).style.display
		).toBe("none");
		(currentState as any).count = 3;
		await new Promise((r) => setTimeout(r, 0));
		expect(
			(document.getElementById("ifEl") as HTMLElement).style.display
		).toBe("");
		expect(
			(document.getElementById("elseifEl") as HTMLElement).style.display
		).toBe("none");
	});

	test("each loop add/remove", async () => {
		document.body.innerHTML = `<ul data-each="${"${list as item, key}"}"><li>Item: ${"${item.id}"}-${"${item.v}"}</li></ul>`;
		const ul = document.querySelector("ul")!;
		RegEl.register(ul as HTMLElement);
		await new Promise((r) => setTimeout(r, 0));
		expect(ul.querySelectorAll("li").length).toBe(2);
		(currentState as any).list.push({ id: 3, v: "c" });
		await new Promise((r) => setTimeout(r, 0));
		expect(ul.querySelectorAll("li").length).toBe(3);
		(currentState as any).list.splice(1, 1);
		await new Promise((r) => setTimeout(r, 0));
		expect(ul.querySelectorAll("li").length).toBe(2);
	});

	test("two-way value sync shorthand >>", async () => {
		document.body.innerHTML = `<input value="${"${count >>}"}" id="inp" />`;
		const inp = document.getElementById("inp") as HTMLInputElement;
		RegEl.register(inp as HTMLElement);
		await new Promise((r) => setTimeout(r, 0));
		expect(inp.value).toBe("0");
		inp.value = "5";
		inp.dispatchEvent(new Event("input", { bubbles: true }));
		await new Promise((r) => setTimeout(r, 0));
		expect((currentState as any).count).toBe("5");
	});

	test("event handler receives event object", async () => {
		document.body.innerHTML = `<button onclick="${"${(e)=> count = count + 1}"}" id="btn">+</button>`;
		const btn = document.getElementById("btn") as HTMLButtonElement;
		RegEl.register(btn as HTMLElement);
		await new Promise((r) => setTimeout(r, 0));
		btn.click();
		await new Promise((r) => setTimeout(r, 0));
		expect((currentState as any).count).toBe(1); // assignment via arrow wrapper
	});

	test("text interpolation with aliases", async () => {
		document.body.innerHTML = `<p>${"${@count as c}"} / ${"${c}"} / static</p>`;
		const p = document.querySelector("p")!;
		RegEl.register(p as HTMLElement);
		await new Promise((r) => setTimeout(r, 0));
		expect(p.textContent?.includes("0 / 0")).toBe(true);
		(currentState as any).count = 2;
		await new Promise((r) => setTimeout(r, 0));
		expect(p.textContent?.includes("2 / 2")).toBe(true);
	});
});
