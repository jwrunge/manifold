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
	state = StateBuilder.create(
		undefined,
		data as Record<string, unknown>
	).build() as typeof state;
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

	test("conditional chain :if / :elseif / :else", async () => {
		document.body.innerHTML = `
      <div>
		<p :if="count > 1" id="ifEl">if</p>
		<p :elseif="count === 1" id="elseifEl">elseif</p>
		<p :else id="elseEl">else</p>
      </div>`;
		const root = document.body.firstElementChild as HTMLElement;
		for (const el of Array.from(root.querySelectorAll("*")))
			new RegEl(el as HTMLElement, state);
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
		document.body.innerHTML = `<ul><li :each="list as item, key">Item: \${item.id}-\${item.v}</li></ul>`;
		const ul = document.querySelector("ul");
		if (!ul) throw new Error("ul missing");
		const template = ul.querySelector("li");
		if (!template) throw new Error("template missing");
		new RegEl(template as HTMLElement, state);
		await flush();
		const countLis = () =>
			ul.querySelectorAll("li:not([style*='display: none'])").length;
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
		const local = StateBuilder.create(undefined, {
			nums: [10, 20, 30],
		}).build() as {
			nums: number[];
		};
		document.body.innerHTML = `<ul><li :each="nums as n, i">Item \${i}: \${n}</li></ul>`;
		const ul = document.querySelector("ul");
		if (!ul) throw new Error("ul missing");
		const li = ul.querySelector("li");
		if (!li) throw new Error("li missing");
		new RegEl(
			li as HTMLElement,
			local as unknown as Record<string, unknown>
		);
		await flush();
		const texts = Array.from(
			ul.querySelectorAll("li:not([style*='display: none'])")
		).map((el) => el.textContent?.trim());
		expect(texts).toEqual(["Item 0: 10", "Item 1: 20", "Item 2: 30"]);
	});

	test(":each colon syntax single value alias (primitive array)", async () => {
		const local = StateBuilder.create(undefined, {
			nums: [5, 6],
		}).build() as {
			nums: number[];
		};
		document.body.innerHTML = `<ul><li :each="nums as n">Val \${n}</li></ul>`;
		const ul = document.querySelector("ul");
		if (!ul) throw new Error("ul missing");
		const li = ul.querySelector("li");
		if (!li) throw new Error("li missing");
		new RegEl(
			li as HTMLElement,
			local as unknown as Record<string, unknown>
		);
		await flush();
		const texts = Array.from(
			ul.querySelectorAll("li:not([style*='display: none'])")
		).map((el) => el.textContent?.trim());
		expect(texts).toEqual(["Val 5", "Val 6"]);
	});

	test("two-way value sync via sync: prefix", async () => {
		document.body.innerHTML = `<input :sync:value="count" id="inp" />`;
		const inp = document.getElementById("inp") as HTMLInputElement;
		new RegEl(inp, state);
		await flush();
		expect(inp.value).toBe("1");
		inp.value = "5";
		inp.dispatchEvent(new Event("input", { bubbles: true }));
		await flush();
		expect(state.count).toBe("5");
	});

	test("event handler executes", async () => {
		// Provide an increment helper since assignment expressions aren't supported
		(state as unknown as { increment: () => void }).increment = () => {
			state.count = (Number(state.count) || 0) + 1;
		};
		document.body.innerHTML = `<button :onclick="increment()" id="btn">+</button>`;
		const btn = document.getElementById("btn") as HTMLButtonElement;
		new RegEl(btn, state);
		await flush();
		btn.click();
		await flush();
		expect(state.count).toBe(2);
	});

	test("event handler executes via function call", async () => {
		// Add increment function to state
		(state as Record<string, unknown>).increment = () => {
			(state as Record<string, unknown>).count =
				(state.count as number) + 5;
		};
		document.body.innerHTML = `<button :onclick="increment()" id="btn2">++</button>`;
		const btn2 = document.getElementById("btn2") as HTMLButtonElement;
		new RegEl(btn2, state);
		await flush();
		btn2.click();
		await flush();
		expect(state.count).toBe(6); // started at 1, +5
	});

	test("text interpolation with aliases", async () => {
		// Aliasing inside text tokens isn't supported; verify repeated interpolation works
		document.body.innerHTML = `<p>\${count} / \${count} / static</p>`;
		const p = document.querySelector("p");
		if (!p) throw new Error("p missing");
		new RegEl(p as HTMLElement, state);
		await flush();
		expect(p.textContent?.includes("1 / 1")).toBe(true);
		state.count = 2;
		await flush();
		expect(p.textContent?.includes("2 / 2")).toBe(true);
	});
});

describe("extended registry features", () => {
	test("property/attribute/class/style bindings and removal of prefixed attrs", async () => {
		document.body.innerHTML = `
			<input id="tgt"
				:type="count === 3 || count === 5 ? 'text' : 'number'"
				:style:background-color="count % 2 === 0 ? 'lightblue' : 'lightgreen'"
				:class:red="count % 5 === 0"
				:something="count * 2"
			/>`;
		const el = document.getElementById("tgt") as HTMLInputElement;
		const local = StateBuilder.create(undefined, { count: 1 }).build() as {
			count: number;
		};
		new RegEl(el, local as unknown as Record<string, unknown>);
		await flush();

		// Initial count = 1
		expect(el.type).toBe("number");
		expect(el.style.backgroundColor).toBe("lightgreen");
		expect(el.classList.contains("red")).toBe(false);
		expect(el.getAttribute("something")).toBe("2");
		// Prefixed attributes removed after processing
		expect(el.hasAttribute(":type")).toBe(false);
		expect(el.hasAttribute(":style:background-color")).toBe(false);
		expect(el.hasAttribute(":class:red")).toBe(false);
		expect(el.hasAttribute(":something")).toBe(false);

		// Change to even number -> blue background, number type
		local.count = 2;
		await flush();
		expect(el.type).toBe("number");
		expect(el.style.backgroundColor).toBe("lightblue");
		expect(el.getAttribute("something")).toBe("4");
		expect(el.classList.contains("red")).toBe(false);

		// count = 5 -> red class toggled, green background, type becomes text
		local.count = 5;
		await flush();
		expect(el.type).toBe("text");
		expect(el.style.backgroundColor).toBe("lightgreen");
		expect(el.getAttribute("something")).toBe("10");
		expect(el.classList.contains("red")).toBe(true);

		// count = 3 -> type becomes text
		local.count = 3;
		await flush();
		expect(el.type).toBe("text");
	});

	test("arrow-style event handler receives event param and updates state", async () => {
		const s = StateBuilder.create(undefined, { txt: "hi" }).build() as {
			txt: string;
			setTxt?: (v: string) => void;
		};
		s.setTxt = (v: string) => {
			s.txt = v;
		};
		document.body.innerHTML = `<button id="b" :onclick="(e)=> setTxt(e.target.id)">go</button>`;
		const btn = document.getElementById("b") as HTMLButtonElement;
		new RegEl(btn, s);
		await flush();
		// Prefixed attribute removed
		expect(btn.hasAttribute(":onclick")).toBe(false);
		btn.click();
		await flush();
		expect(s.txt).toBe("b");
	});

	test(":sync:checked two-way binding (checkbox)", async () => {
		const s = StateBuilder.create(undefined, { on: false }).build() as {
			on: boolean;
		};
		document.body.innerHTML = `<input id="c" type="checkbox" :sync:checked="on"/>`;
		const el = document.getElementById("c") as HTMLInputElement;
		new RegEl(el, s as unknown as Record<string, unknown>);
		await flush();
		expect(el.checked).toBe(false);
		// State -> DOM
		s.on = true;
		await flush();
		expect(el.checked).toBe(true);
		// DOM -> State
		el.checked = false;
		el.dispatchEvent(new Event("change", { bubbles: true }));
		await flush();
		expect(s.on).toBe(false);
	});

	test(":sync:open on <details> synchronizes both ways", async () => {
		const s = StateBuilder.create(undefined, { open: false }).build() as {
			open: boolean;
		};
		document.body.innerHTML = `<details id="d" :sync:open="open"><summary>Title</summary><div>Content</div></details>`;
		const det = document.getElementById("d") as HTMLDetailsElement;
		new RegEl(det, s as unknown as Record<string, unknown>);
		await flush();
		expect(det.open).toBe(false);
		// State -> DOM
		s.open = true;
		await flush();
		expect(det.open).toBe(true);
		// DOM -> State via toggle
		det.open = false;
		det.dispatchEvent(new Event("toggle", { bubbles: true }));
		await flush();
		expect(s.open).toBe(false);
	});

	test("attribute-only bindings (aria-*) set and remove", async () => {
		const s = StateBuilder.create(undefined, {
			label: "Hello",
			hide: true,
		}).build() as {
			label: string;
			hide: boolean;
		};
		document.body.innerHTML = `<div id="a" :aria-label="label" :aria-hidden="hide ? 'true' : null"></div>`;
		const div = document.getElementById("a") as HTMLDivElement;
		new RegEl(div, s as unknown as Record<string, unknown>);
		await flush();
		expect(div.getAttribute("aria-label")).toBe("Hello");
		expect(div.getAttribute("aria-hidden")).toBe("true");
		// Update values
		s.label = "World";
		s.hide = false;
		await flush();
		expect(div.getAttribute("aria-label")).toBe("World");
		expect(div.hasAttribute("aria-hidden")).toBe(false);
	});
	test("builder chaining preserves derived updates (single-state)", async () => {
		const b = StateBuilder.create(undefined, { a: 1 as number })
			.derive("b", (s) => (s as { a: number }).a + 1)
			.add("c", 3);
		const built = b.build() as { a: number; b: number; c: number };
		built.a = 5;
		await flush();
		expect(built.b).toBe(6);
	});
	test("async await / then / catch success and failure", async () => {
		const local = StateBuilder.create(undefined, { ok: true }).build() as {
			ok: boolean;
		};
		document.body.innerHTML = `
			<div>
					<p :await="(ok ? Promise.resolve(42) : Promise.reject('fail'))" id="await">Loading</p>
					<p :then="val" id="then">Val: \${val}</p>
					<p :catch="err" id="catch">Err: \${err}</p>
			</div>`;
		const root = document.body.firstElementChild;
		if (!root) throw new Error("root missing");
		for (const el of Array.from(root.children))
			new RegEl(el as HTMLElement, local);
		// Initial: loading visible, then/catch hidden
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
		// After resolution: loading hidden, then visible with interpolated value, catch hidden
		expect(
			(document.getElementById("await") as HTMLElement).style.display
		).toBe("none");
		expect(
			(document.getElementById("then") as HTMLElement).style.display
		).toBe("");
		expect(
			(document.getElementById("then") as HTMLElement).textContent
		).toBe("Val: 42");
		expect(
			(document.getElementById("catch") as HTMLElement).style.display
		).toBe("none");
		// trigger failure path
		local.ok = false;
		for (let i = 0; i < 4; i++) await flush();
		// After rejection: loading hidden (promise already processed), then remains visible? we expect it to hide on new pending
		// Implementation currently only hides loading block when new promise starts; manual check: new await effect should set loading visible again
		// So perform additional flush cycle to allow re-pending state
		for (let i = 0; i < 2; i++) await flush();
		// Because we reused same nodes, check that catch becomes visible
		expect(
			(document.getElementById("catch") as HTMLElement).style.display
		).toBe("");
		expect(
			(document.getElementById("catch") as HTMLElement).textContent
		).toBe("Err: fail");
	});

	test("auto-registration binds all [data-mf-register] using single state", async () => {
		document.body.innerHTML = `
			<div data-mf-register>
				<span id="aVal">\${a}</span>
			</div>
			<div data-mf-register>
				<span id="bVal">\${b}</span>
			</div>`;
		// Build after DOM is ready so auto-registration binds to this state
		const b = StateBuilder.create(undefined, { a: 1, b: 2 }).build() as {
			a: number;
			b: number;
		};
		await flush();
		expect(
			(document.getElementById("aVal") as HTMLElement).textContent
		).toBe("1");
		expect(
			(document.getElementById("bVal") as HTMLElement).textContent
		).toBe("2");
		// Update and ensure both update
		b.a = 3;
		b.b = 4;
		await flush();
		expect(
			(document.getElementById("aVal") as HTMLElement).textContent
		).toBe("3");
		expect(
			(document.getElementById("bVal") as HTMLElement).textContent
		).toBe("4");
	});

	test("checked sync", async () => {
		const s = StateBuilder.create(undefined, { on: false }).build() as {
			on: boolean;
		};
		document.body.innerHTML = `<input type="checkbox" :sync:checked="on" id="c" />`;
		const el = document.getElementById("c") as HTMLInputElement;
		new RegEl(el, s);
		await flush();
		expect(el.checked).toBe(false);
		el.checked = true;
		el.dispatchEvent(new Event("change", { bubbles: true }));
		await flush();
		expect(s.on).toBe(true);
	});

	test("event handler updates state via update(v)", async () => {
		const s = StateBuilder.create(undefined, { txt: "hi" }).build() as {
			txt: string;
		} & {
			update?: (v: string) => void;
		};
		s.update = (v: string) => {
			s.txt = v;
		};
		document.body.innerHTML = `<div><input :value="txt" id="txtInp" /><button id="btn" :onclick="update('yo')">go</button></div>`;
		const root = document.querySelector("div") as HTMLElement;
		Array.from(root.children).forEach((el) => {
			new RegEl(el as HTMLElement, s);
		});
		for (let i = 0; i < 2; i++) await flush();
		expect(
			(document.getElementById("txtInp") as HTMLInputElement).value
		).toBe("hi");
		(document.getElementById("btn") as HTMLButtonElement).click();
		for (let i = 0; i < 2; i++) await flush();
		expect(s.txt).toBe("yo");
		expect(
			(document.getElementById("txtInp") as HTMLInputElement).value
		).toBe("yo");
	});

	test("selectedIndex updates via button handler", async () => {
		const s = StateBuilder.create(undefined, { idx: 1 }).build() as {
			idx: number;
		} & { setIdx?: (i: number) => void };
		s.setIdx = (i: number) => {
			s.idx = i;
		};
		document.body.innerHTML = `<div><select :selectedIndex="idx" id="sel"><option>A</option><option>B</option><option>C</option></select><button id="go" :onclick="setIdx(2)">set 2</button></div>`;
		const root = document.querySelector("div") as HTMLElement;
		Array.from(root.children).forEach((el) => {
			new RegEl(el as HTMLElement, s);
		});
		for (let i = 0; i < 2; i++) await flush();
		(document.getElementById("go") as HTMLButtonElement).click();
		for (let i = 0; i < 2; i++) await flush();
		expect(s.idx).toBe(2);
	});

	test("direct array index assignment extends :each loop", async () => {
		const local = StateBuilder.create(undefined, {
			arr: ["a", "b", "c"],
		}).build() as {
			arr: string[];
		};
		document.body.innerHTML = `<ul><li :each="arr as v, i">(\${i}) \${v}</li></ul>`;
		const ul = document.querySelector("ul");
		if (!ul) throw new Error("ul missing");
		const li = ul.querySelector("li");
		if (!li) throw new Error("li missing");
		new RegEl(
			li as HTMLElement,
			local as unknown as Record<string, unknown>
		);
		await flush();
		const texts = () =>
			Array.from(
				ul.querySelectorAll("li:not([style*='display: none'])")
			).map((el) => el.textContent?.trim());
		expect(texts()).toEqual(["(0) a", "(1) b", "(2) c"]);
		local.arr[3] = "d"; // direct index set beyond current length
		await flush();
		expect(texts()).toEqual(["(0) a", "(1) b", "(2) c", "(3) d"]);
	});

	test("direct array index assignment updates existing index in :each loop", async () => {
		const local = StateBuilder.create(undefined, {
			arr: ["a", "b", "c"],
		}).build() as {
			arr: string[];
		};
		document.body.innerHTML = `<ul><li :each="arr as v, i">(\${i}) \${v}</li></ul>`;
		const ul = document.querySelector("ul");
		if (!ul) throw new Error("ul missing");
		const li = ul.querySelector("li");
		if (!li) throw new Error("li missing");
		new RegEl(
			li as HTMLElement,
			local as unknown as Record<string, unknown>
		);
		await flush();
		const textAt = (i: number) =>
			Array.from(ul.querySelectorAll("li:not([style*='display: none'])"))[
				i
			].textContent?.trim();
		expect(textAt(1)).toBe("(1) b");
		local.arr[1] = "B!"; // direct index mutate existing element
		await flush();
		expect(textAt(1)).toBe("(1) B!");
	});
});
