import { beforeEach, describe, expect, test } from "vitest";
import StateBuilder from "../src/main.ts";
import RegEl from "../src/registry.ts";

// Microtask flush helper
const flush = () => new Promise((r) => setTimeout(r, 0));

let state: {
	count: number | string;
	list: { id: number; v: string }[];
	flag: boolean;
	promiseVal: number;
	[key: string]: unknown;
};

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
		await flush();
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
		await flush();
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
		if (!ul) throw new Error("ul missing");
		const template = ul.querySelector("li[data-each]");
		if (!template) throw new Error("template missing");
		RegEl.register(template as HTMLElement, state);
		await flush();
		const countLis = () =>
			ul.querySelectorAll("li:not([data-each])").length;
		expect(countLis()).toBe(2);
		state.list.push({ id: 3, v: "c" });
		state.list = [...state.list];
		await flush();
		expect(countLis()).toBe(3);
		state.list.splice(1, 1);
		state.list = [...state.list];
		await flush();
		expect(countLis()).toBe(2);
	});

	test(":each colon syntax with value, index aliases (primitive array)", async () => {
		const local = StateBuilder.create({ nums: [10, 20, 30] }).build()
			.state as { nums: number[] };
		document.body.innerHTML = `<ul><li :each="nums as n, i">Item \${i}: \${n}</li></ul>`;
		const ul = document.querySelector("ul");
		if (!ul) throw new Error("ul missing");
		const li = ul.querySelector("li");
		if (!li) throw new Error("li missing");
		RegEl.register(
			li as HTMLElement,
			local as unknown as Record<string, unknown>
		);
		await flush();
		const texts = Array.from(
			ul.querySelectorAll("li:not([data-each])")
		).map((el) => el.textContent?.trim());
		expect(texts).toEqual(["Item 0: 10", "Item 1: 20", "Item 2: 30"]);
	});

	test(":each colon syntax single value alias (primitive array)", async () => {
		const local = StateBuilder.create({ nums: [5, 6] }).build().state as {
			nums: number[];
		};
		document.body.innerHTML = `<ul><li :each="nums as n">Val \${n}</li></ul>`;
		const ul = document.querySelector("ul");
		if (!ul) throw new Error("ul missing");
		const li = ul.querySelector("li");
		if (!li) throw new Error("li missing");
		RegEl.register(
			li as HTMLElement,
			local as unknown as Record<string, unknown>
		);
		await flush();
		const texts = Array.from(
			ul.querySelectorAll("li:not([data-each])")
		).map((el) => el.textContent?.trim());
		expect(texts).toEqual(["Val 5", "Val 6"]);
	});

	test("two-way value sync shorthand >>", async () => {
		document.body.innerHTML = `<input :value="count >>" id="inp" />`;
		const inp = document.getElementById("inp") as HTMLInputElement;
		RegEl.register(inp, state);
		await flush();
		expect(inp.value).toBe("1");
		inp.value = "5";
		inp.dispatchEvent(new Event("input", { bubbles: true }));
		await flush();
		expect(state.count).toBe("5");
	});

	test("event handler executes", async () => {
		document.body.innerHTML = `<button :onclick="count = count + 1" id="btn">+</button>`;
		const btn = document.getElementById("btn") as HTMLButtonElement;
		RegEl.register(btn, state);
		await flush();
		btn.click();
		await flush();
		expect(state.count).toBe(2);
	});

	test("multi-statement event handler executes sequentially", async () => {
		// Add increment function to state
		(state as Record<string, unknown>).increment = () => {
			(state as Record<string, unknown>).count =
				(state.count as number) + 5;
		};
		document.body.innerHTML = `<button :onclick="console.log('before', count); increment(); console.log('after', count)" id="btn2">++</button>`;
		const btn2 = document.getElementById("btn2") as HTMLButtonElement;
		RegEl.register(btn2, state);
		await flush();
		btn2.click();
		await flush();
		expect(state.count).toBe(6); // started at 1, +5
	});

	test("text interpolation with aliases", async () => {
		document.body.innerHTML = `<p>\${@count as c} / \${@count as c} / static</p>`;
		const p = document.querySelector("p");
		if (!p) throw new Error("p missing");
		RegEl.register(p as HTMLElement, state);
		await flush();
		expect(p.textContent?.includes("1 / 1")).toBe(true);
		state.count = 2;
		await flush();
		expect(p.textContent?.includes("2 / 2")).toBe(true);
	});
});

describe("extended registry features", () => {
	test("named builder chaining preserves single instance", async () => {
		const b = StateBuilder.create("chain", { a: 1 as number })
			.derive("b", (s) => (s as { a: number }).a + 1)
			.add("c", 3)
			.expose();
		const built = b.build().state as { a: number; b: number; c: number };
		built.a = 5;
		await flush();
		expect(built.b).toBe(6);
	});
	test("async await / then / catch success and failure", async () => {
		const local = StateBuilder.create({ ok: true }).build().state as {
			ok: boolean;
		};
		document.body.innerHTML = `
			<div>
				<p data-await="\${ (ok ? Promise.resolve(42) : Promise.reject('fail')) }" id="await">Loading</p>
				<p data-then="val" id="then">Val: \${val}</p>
				<p data-catch="err" id="catch">Err: \${err}</p>
			</div>`;
		const root = document.body.firstElementChild;
		if (!root) throw new Error("root missing");
		Array.from(root.children).forEach((el) =>
			RegEl.register(el as HTMLElement, local)
		);
		for (let i = 0; i < 4; i++) await flush();
		// Only assert that the 'then' content became visible
		expect(
			(document.getElementById("then") as HTMLElement).style.display
		).toBe("");
		// trigger failure path
		local.ok = false;
		for (let i = 0; i < 4; i++) await flush();
		expect(
			(document.getElementById("catch") as HTMLElement).style.display
		).toBe("");
	});

	test("named state registration & ignore boundary", async () => {
		StateBuilder.create("ui", { a: 1 }).build();
		StateBuilder.create("other", { b: 2 }).build();
		document.body.innerHTML = `
			<div data-mf-register="ui">
				<span id="aVal">\${a}</span>
				<div data-mf-ignore>
					<div data-mf-register="other"><span id="bVal">\${b}</span></div>
				</div>
			</div>`;
		StateBuilder.create().register();
		await flush();
		expect(
			(document.getElementById("aVal") as HTMLElement).textContent
		).toBe("1");
		expect(
			(document.getElementById("bVal") as HTMLElement).textContent
		).toBe("2");
	});

	test("nested registration without ignore boundary throws", () => {
		StateBuilder.create("ui2", { a: 1 }).build();
		StateBuilder.create("other2", { b: 2 }).build();
		document.body.innerHTML = `
			<div data-mf-register="ui2">
				<div data-mf-register="other2"></div>
			</div>`;
		expect(() => StateBuilder.create().register()).toThrow();
	});

	test("checked sync", async () => {
		const s = StateBuilder.create({ on: false }).build().state as {
			on: boolean;
		};
		document.body.innerHTML = `<input type="checkbox" :checked="on >>" id="c" />`;
		const el = document.getElementById("c") as HTMLInputElement;
		RegEl.register(el, s);
		await flush();
		expect(el.checked).toBe(false);
		el.checked = true;
		el.dispatchEvent(new Event("change", { bubbles: true }));
		await flush();
		expect(s.on).toBe(true);
	});

	test("arrow sync via (v)=> update(v)", async () => {
		const s = StateBuilder.create({ txt: "hi" }).build().state as {
			txt: string;
		} & {
			update?: (v: string) => void;
		};
		s.update = (v: string) => {
			s.txt = v;
		};
		document.body.innerHTML = `<input :value="txt >> (v)=> update(v)" id="txtInp" />`;
		const el = document.getElementById("txtInp") as HTMLInputElement;
		RegEl.register(el, s);
		for (let i = 0; i < 2; i++) await flush();
		expect(el.value).toBe("hi");
		el.value = "yo";
		el.dispatchEvent(new Event("input", { bubbles: true }));
		for (let i = 0; i < 2; i++) await flush();
		expect(s.txt).toBe("yo");
	});

	test("selectedIndex sync", async () => {
		const s = StateBuilder.create({ idx: 1 }).build().state as {
			idx: number;
		};
		document.body.innerHTML = `<select :selectedIndex="idx >>" id="sel"><option>A</option><option>B</option><option>C</option></select>`;
		const el = document.getElementById("sel") as HTMLSelectElement;
		RegEl.register(el, s);
		for (let i = 0; i < 2; i++) await flush();
		expect(el.selectedIndex).toBe(1);
		el.selectedIndex = 2;
		el.dispatchEvent(new Event("change", { bubbles: true }));
		for (let i = 0; i < 2; i++) await flush();
		expect(s.idx).toBe(2);
	});

	test("direct array index assignment extends :each loop", async () => {
		const local = StateBuilder.create({ arr: ["a", "b", "c"] }).build()
			.state as { arr: string[] };
		document.body.innerHTML = `<ul><li :each="arr as v, i">(\${i}) \${v}</li></ul>`;
		const ul = document.querySelector("ul");
		if (!ul) throw new Error("ul missing");
		const li = ul.querySelector("li");
		if (!li) throw new Error("li missing");
		RegEl.register(
			li as HTMLElement,
			local as unknown as Record<string, unknown>
		);
		await flush();
		const texts = () =>
			Array.from(ul.querySelectorAll("li:not([data-each])")).map((el) =>
				el.textContent?.trim()
			);
		expect(texts()).toEqual(["(0) a", "(1) b", "(2) c"]);
		local.arr[3] = "d"; // direct index set beyond current length
		await flush();
		expect(texts()).toEqual(["(0) a", "(1) b", "(2) c", "(3) d"]);
	});

	test("direct array index assignment updates existing index in :each loop", async () => {
		const local = StateBuilder.create({ arr: ["a", "b", "c"] }).build()
			.state as { arr: string[] };
		document.body.innerHTML = `<ul><li :each="arr as v, i">(\${i}) \${v}</li></ul>`;
		const ul = document.querySelector("ul");
		if (!ul) throw new Error("ul missing");
		const li = ul.querySelector("li");
		if (!li) throw new Error("li missing");
		RegEl.register(
			li as HTMLElement,
			local as unknown as Record<string, unknown>
		);
		await flush();
		const textAt = (i: number) =>
			Array.from(ul.querySelectorAll("li:not([data-each])"))[
				i
			].textContent?.trim();
		expect(textAt(1)).toBe("(1) b");
		local.arr[1] = "B!"; // direct index mutate existing element
		await flush();
		expect(textAt(1)).toBe("(1) B!");
	});
});
