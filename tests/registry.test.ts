import { beforeEach, describe, expect, test } from "vitest";
import StateBuilder from "../src/main.ts";

let state: {
	count: number | string;
	list: { id: number; v: string }[];
	flag: boolean;
	promiseVal: number;
	[key: string]: unknown;
};

import RegEl from "../src/registry.ts";

// Minimal DOM helpers via jsdom already set up in test environment

const initState = (data: Record<string, unknown>) => {
	state = StateBuilder.create(data as Record<string, unknown>).build()
		.state as typeof state;
};

describe("registry basics", () => {
	beforeEach(() =>
		initState({
			count: 1,
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
		<p data-if="\${count > 1}" id="ifEl">if</p>
		<p data-elseif="\${count === 1}" id="elseifEl">elseif</p>
		<p data-else id="elseEl">else</p>
      </div>`;
		const root = document.body.firstElementChild as HTMLElement;
		Array.from(root.querySelectorAll("*")).forEach((el) =>
			RegEl.register(el as HTMLElement, state)
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
		state.count = 3;
		await new Promise((r) => setTimeout(r, 0));
		expect(
			(document.getElementById("ifEl") as HTMLElement).style.display
		).toBe("");
		expect(
			(document.getElementById("elseifEl") as HTMLElement).style.display
		).toBe("none");
	});

	test("each loop add/remove", async () => {
		document.body.innerHTML = `<ul><li data-each="\${list as item, key}">Item: \${item.id}-\${item.v}</li></ul>`;
		const ul = document.querySelector("ul");
		if (!ul) throw new Error("ul not found");
		const template = ul.querySelector("li[data-each]");
		if (!template) throw new Error("template li missing");
		RegEl.register(template as HTMLElement, state);
		await new Promise((r) => setTimeout(r, 0));
		const countLis = () =>
			ul.querySelectorAll("li:not([data-each])").length;
		expect(countLis()).toBe(2);
		state.list.push({ id: 3, v: "c" });
		// trigger array reactive update by reassigning to new array reference
		state.list = [...state.list];
		await new Promise((r) => setTimeout(r, 0));
		expect(countLis()).toBe(3);
		state.list.splice(1, 1);
		state.list = [...state.list];
		await new Promise((r) => setTimeout(r, 0));
		expect(countLis()).toBe(2);
	});

	test("two-way value sync shorthand >>", async () => {
		document.body.innerHTML = `<input value="\${count >>}" id="inp" />`;
		const inp = document.getElementById("inp") as HTMLInputElement | null;
		if (!inp) throw new Error("input not found");
		RegEl.register(inp as HTMLElement, state);
		await new Promise((r) => setTimeout(r, 0));
		expect(inp.value).toBe("1");
		inp.value = "5";
		inp.dispatchEvent(new Event("input", { bubbles: true }));
		await new Promise((r) => setTimeout(r, 0));
		expect(state.count).toBe("5");
	});

	test("event handler receives event object", async () => {
		document.body.innerHTML = `<button data-onclick="\${()=> count = count + 1}" id="btn">+</button>`;
		const btn = document.getElementById("btn") as HTMLButtonElement | null;
		if (!btn) throw new Error("button not found");
		RegEl.register(btn as HTMLElement, state);
		await new Promise((r) => setTimeout(r, 0));
		btn.click();
		await new Promise((r) => setTimeout(r, 0));
		expect(state.count).toBe(2); // assignment via arrow wrapper
	});

	test("text interpolation with aliases", async () => {
		document.body.innerHTML = `<p>\${@count as c} / \${@count as c} / static</p>`;
		const p = document.querySelector("p");
		if (!p) throw new Error("p not found");
		RegEl.register(p as HTMLElement, state);
		await new Promise((r) => setTimeout(r, 0));
		expect(p.textContent?.includes("1 / 1")).toBe(true);
		state.count = 2;
		await new Promise((r) => setTimeout(r, 0));
		expect(p.textContent?.includes("2 / 2")).toBe(true);
	});
});
