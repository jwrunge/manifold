import { beforeEach, describe, expect, test } from "vitest";
import StateBuilder from "../src/main.ts";
import RegEl from "../src/registry.ts";

const flush = () => new Promise((r) => setTimeout(r, 0));

// Helper to register all direct child elements under a root
const registerChildren = (root: Element, state: Record<string, unknown>) => {
	Array.from(root.children).forEach((el) =>
		RegEl.register(el as HTMLElement, state)
	);
};

describe("DOM behavior / structural stability", () => {
	let state: { count: number; arr: string[]; ok: boolean } & Record<
		string,
		unknown
	>;
	beforeEach(() => {
		state = StateBuilder.create({
			count: 0,
			arr: ["a", "b", "c"],
			ok: true,
		}).build().state as typeof state;
	});

	test("conditional chain with multiple elseifs toggles visibility correctly & preserves node identity", async () => {
		document.body.innerHTML = `
      <div id="root">
        <p data-if="\${count === 0}" id="v0">Zero</p>
        <p data-elseif="\${count === 1}" id="v1">One</p>
        <p data-elseif="\${count === 2}" id="v2">Two</p>
        <p data-elseif="\${count === 3}" id="v3">Three</p>
        <p data-else id="vElse">Other</p>
      </div>`;
		const root = document.getElementById("root");
		if (!root) throw new Error("root missing");
		registerChildren(root, state as unknown as Record<string, unknown>);
		await flush();
		const v0 = document.getElementById("v0") as HTMLElement;
		const v1 = document.getElementById("v1") as HTMLElement;
		const v2 = document.getElementById("v2") as HTMLElement;
		const v3 = document.getElementById("v3") as HTMLElement;
		const vElse = document.getElementById("vElse") as HTMLElement;
		const visible = () =>
			[v0, v1, v2, v3, vElse]
				.filter((n) => n.style.display !== "none")
				.map((n) => n.id);
		expect(visible()).toEqual(["v0"]);
		state.count = 1;
		await flush();
		expect(visible()).toEqual(["v1"]);
		state.count = 2;
		await flush();
		expect(visible()).toEqual(["v2"]);
		state.count = 3;
		await flush();
		expect(visible()).toEqual(["v3"]);
		state.count = 10;
		await flush();
		expect(visible()).toEqual(["vElse"]);
		// Node identity stable
		expect(document.getElementById("v2")).toBe(v2);
	});

	test("updating individual array item preserves sibling node identities", async () => {
		document.body.innerHTML = `<ul id="list"><li :each="arr as v, i">(\${i}) \${v}</li></ul>`;
		const ul = document.getElementById("list");
		if (!ul) throw new Error("list missing");
		const template = ul.querySelector("li");
		if (!template) throw new Error("template missing");
		RegEl.register(
			template as HTMLElement,
			state as unknown as Record<string, unknown>
		);
		await flush();
		const items = () =>
			Array.from(ul.querySelectorAll("li:not([data-each])"));
		const nodes = items();
		expect(nodes.map((n) => n.textContent?.trim())).toEqual([
			"(0) a",
			"(1) b",
			"(2) c",
		]);
		// mutate middle element only
		state.arr[1] = "B!";
		await flush();
		const nodesAfter = items();
		expect(nodesAfter[0]).toBe(nodes[0]);
		expect(nodesAfter[2]).toBe(nodes[2]);
		expect(nodesAfter[1]).toBe(nodes[1]);
		expect(nodesAfter[1].textContent?.includes("B!")).toBe(true);
	});

	test("array push and splice maintain existing node identities for unaffected items", async () => {
		document.body.innerHTML = `<ul id="list2"><li :each="arr as v, i">(\${i}) \${v}</li></ul>`;
		const ul = document.getElementById("list2");
		if (!ul) throw new Error("list2 missing");
		const template = ul.querySelector("li");
		if (!template) throw new Error("template missing");
		RegEl.register(
			template as HTMLElement,
			state as unknown as Record<string, unknown>
		);
		await flush();
		const items = () =>
			Array.from(ul.querySelectorAll("li:not([data-each])"));
		const original = items();
		// push
		state.arr.push("d");
		state.arr = [...state.arr];
		await flush();
		const afterPush = items();
		expect(afterPush.length).toBe(4);
		expect(afterPush[0]).toBe(original[0]);
		expect(afterPush[1]).toBe(original[1]);
		// remove index 1
		state.arr.splice(1, 1);
		state.arr = [...state.arr];
		await flush();
		const afterSplice = items();
		expect(afterSplice.length).toBe(3);
		// first item identity preserved
		expect(afterSplice[0]).toBe(original[0]);
		// shifted element may be re-rendered; assert content correctness not identity
		expect(afterSplice.map((n) => n.textContent?.trim())).toEqual([
			"(0) a",
			"(1) c",
			"(2) d",
		]);
		// former index 2 ('c') shifts to index 1 (identity not required)
	});

	test("async await/then/catch transitions across success->failure->success cycles", async () => {
		document.body.innerHTML = `
      <div id="asyncRoot">
        <p data-await="\${ (ok ? Promise.resolve(21) : Promise.reject('nope')) }" id="await">Loading</p>
        <p data-then="val" id="then">Val: \${val}</p>
        <p data-catch="err" id="catch">Err: \${err}</p>
      </div>`;
		const root = document.getElementById("asyncRoot");
		if (!root) throw new Error("asyncRoot missing");
		registerChildren(root, state as unknown as Record<string, unknown>);
		// initial pending
		expect(
			(document.getElementById("await") as HTMLElement).style.display
		).toBe("");
		expect(
			(document.getElementById("then") as HTMLElement).style.display
		).toBe("none");
		expect(
			(document.getElementById("catch") as HTMLElement).style.display
		).toBe("none");
		for (let i = 0; i < 4; i++) await flush();
		expect(
			(document.getElementById("await") as HTMLElement).style.display
		).toBe("none");
		expect(
			(document.getElementById("then") as HTMLElement).textContent
		).toBe("Val: 21");
		// flip to failure
		state.ok = false;
		for (let i = 0; i < 6; i++) await flush();
		expect(
			(document.getElementById("catch") as HTMLElement).style.display
		).toBe("");
		expect(
			(document.getElementById("catch") as HTMLElement).textContent
		).toBe("Err: nope");
		// back to success with different value
		state.ok = true;
		for (let i = 0; i < 6; i++) await flush();
		expect(
			(document.getElementById("then") as HTMLElement).style.display
		).toBe("");
	});
});
