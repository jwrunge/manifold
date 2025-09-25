import { expect, test } from "vitest";

type Builder = typeof import("../src/main.ts").Manifold;

type DemoState = {
	count: number;
	count2: number;
	items: number[];
	userId: number;
	asyncToggle: boolean;
	sum?: number;
	doubleCount?: number;
};

type DemoFuncs = {
	increment(this: DemoState, value?: number): void;
	setCount2(this: DemoState, v: string | number): void;
	loadUser(this: DemoState): Promise<{ id: number; name: string }>;
};

const loadBuilders = async () => {
	const src = (await import("../src/main.ts")).default as Builder;
	const es = (
		(await import("../dist/manifold.es.js")) as unknown as {
			default: Builder;
		}
	).default;
	const umdMod = (await import("../dist/manifold.umd.js")) as unknown as {
		default?: Builder;
	};
	const umd = umdMod?.default
		? (umdMod.default as Builder)
		: (globalThis as unknown as { Manifold: Builder }).Manifold;
	return [
		{ name: "src", StateBuilder: src },
		{ name: "es", StateBuilder: es },
		{ name: "umd", StateBuilder: umd },
	] as const;
};

const flush = () => new Promise((r) => setTimeout(r, 0));
const tpl = (s: string) => s;

const builders = await loadBuilders();

// Helper: check if visible considering ancestor display toggles
const isDisplayed = (el: Element | null): boolean => {
	let cur: Element | null = el;
	while (cur && cur instanceof HTMLElement) {
		if ((cur as HTMLElement).style.display === "none") return false;
		cur = cur.parentElement;
	}
	return !!el;
};

for (const { name, StateBuilder } of builders) {
	test(`${name}: UI demo basics (counts, derived, bindings)`, async () => {
		document.body.innerHTML = tpl(`
<div data-mf-register>
	<p id="c1">The current count is: \${count}</p>
	<p id="c2">The second count is: \${count2}</p>
	<p id="sum">The sum of both counts is: \${sum}</p>
	<p id="dbl">The double of count is: \${doubleCount}; the double of count 2 is: \${count2 * 2}</p>

	<p :if="count >= 15" id="if15">Count is 15 or more!</p>
	<p :elseif="count >= 10" id="if10_14">Count is between 10 and 14!</p>
	<p :elseif="count === 9" id="if9">Count is 9!</p>
	<p :else id="ifElse">Count is less than 10!</p>

	<button id="btnInc1" :onclick="increment()">Increment Count</button>
	<button id="btnInc2" :onclick="setCount2(count2 + 2)">Increment Count2</button>
	<button id="btnInc5" :onclick="increment(5)">+5</button>

		<label>Count 1: <input id="inp1" type="number" :sync:value="count" /></label>
	<label>Count 2: <input id="inp2" type="number" :sync:value="count2" /></label>

	<div>
		<button id="btnToggle" :onclick="asyncToggle = !asyncToggle;">Toggle Async Success (currently: \${asyncToggle ? 'success' : 'fail'})</button>
		<p id="await" :await="loadUser()">Loading user...</p>
		<p id="then" :then="user">Loaded: ID=\${user.id} Name=\${user.name}</p>
		<p id="catch" :catch="err">Error: \${err.message}</p>
	</div>

	<ul id="list">
		<li :each="items as item, idx">Item \${idx}: \${item}</li>
	</ul>
	<button id="btnAdd" :onclick="addItem()">Add Item</button>
	<button id="btnRemove" :onclick="removeItem()">Remove Item</button>
	<button id="btnPush" :onclick="items.push(items.length + 1)">Add Item (alt)</button>
	<button id="btnPop" :onclick="items.pop()">Remove Item</button>
	<button id="btnJake" :onclick="setItem(3, 'Jake!')">Change 3</button>
</div>
`);

		const state = StateBuilder.create<DemoState>(undefined, {
			count: 10,
			count2: 4,
			items: [1, 2, 3],
			userId: 1,
			asyncToggle: true,
		})
			.derive("sum", (s) => s.count + s.count2)
			.derive("doubleCount", (s) => s.count * 2)
			.build();

		// Attach methods after build to the reactive state (closures, no `this`)
		(state as DemoState & DemoFuncs).increment = (value?: number) => {
			state.count += value ?? 1;
		};
		(state as DemoState & DemoFuncs).setCount2 = (v: string | number) => {
			state.count2 = typeof v === "number" ? v : Number(v);
		};
		(state as DemoState & DemoFuncs).loadUser = () => {
			const { asyncToggle, userId } = state; // tracked
			return new Promise((resolve, reject) => {
				setTimeout(() => {
					if (asyncToggle) resolve({ id: userId, name: "Ada" });
					else reject(new Error("User load failed"));
				}, 0);
			});
		};
		// list helpers used by buttons
		(state as unknown as { addItem: () => void }).addItem = () => {
			state.items = state.items.concat(state.items.length + 1);
		};
		(state as unknown as { removeItem: () => void }).removeItem = () => {
			state.items = state.items.slice(0, -1);
		};
		(
			state as unknown as { setItem: (i: number, v: unknown) => void }
		).setItem = (i: number, v: unknown) => {
			(state.items as unknown[])[i] = v;
		};

		// Auto-registration already triggered by the build above

		// initial
		await flush();
		expect(
			(document.getElementById("c1") as HTMLElement).textContent
		).toContain("10");
		expect(
			(document.getElementById("c2") as HTMLElement).textContent
		).toContain("4");
		expect(
			(document.getElementById("sum") as HTMLElement).textContent
		).toContain("14");
		expect(
			(document.getElementById("dbl") as HTMLElement).textContent
		).toContain("20");
		expect(isDisplayed(document.getElementById("if10_14"))).toBe(true);
		expect(isDisplayed(document.getElementById("if15"))).toBe(false);

		// click +1
		(document.getElementById("btnInc1") as HTMLButtonElement).click();
		await flush();
		expect(
			(document.getElementById("c1") as HTMLElement).textContent
		).toContain("11");
		expect(
			(document.getElementById("sum") as HTMLElement).textContent
		).toContain("15");
		expect(
			(document.getElementById("dbl") as HTMLElement).textContent
		).toContain("22");

		// click +5
		(document.getElementById("btnInc5") as HTMLButtonElement).click();
		await flush();
		expect(
			(document.getElementById("c1") as HTMLElement).textContent
		).toContain("16");
		expect(isDisplayed(document.getElementById("if15"))).toBe(true);
		expect(isDisplayed(document.getElementById("if10_14"))).toBe(false);

		// two-way input 1
		const inp1 = document.getElementById("inp1") as HTMLInputElement;
		inp1.value = "7";
		inp1.dispatchEvent(new Event("input", { bubbles: true }));
		await flush();
		expect(state.count).toBe("7");
		// reflects back
		await flush();
		expect(
			(document.getElementById("c1") as HTMLElement).textContent
		).toContain("7");

		// explicit oninput for count2
		const inp2 = document.getElementById("inp2") as HTMLInputElement;
		inp2.value = "12";
		inp2.dispatchEvent(new Event("input", { bubbles: true }));
		await flush();
		expect(state.count2).toBe("12");
		await flush();
		expect(
			(document.getElementById("c2") as HTMLElement).textContent
		).toContain("12");

		// each list initial
		const lis = () =>
			Array.from(document.querySelectorAll("#list li"))
				.filter((n) => isDisplayed(n))
				.map((el) => el.textContent?.trim());
		expect(lis()).toEqual(["Item 0: 1", "Item 1: 2", "Item 2: 3"]);
		// add item via concat
		(document.getElementById("btnAdd") as HTMLButtonElement).click();
		await flush();
		expect(lis()).toEqual([
			"Item 0: 1",
			"Item 1: 2",
			"Item 2: 3",
			"Item 3: 4",
		]);
		// remove last via slice
		(document.getElementById("btnRemove") as HTMLButtonElement).click();
		await flush();
		expect(lis()).toEqual(["Item 0: 1", "Item 1: 2", "Item 2: 3"]);
		// push
		(document.getElementById("btnPush") as HTMLButtonElement).click();
		await flush();
		expect(lis()[3]).toBe("Item 3: 4");
		// pop
		(document.getElementById("btnPop") as HTMLButtonElement).click();
		await flush();
		expect(lis()).toEqual(["Item 0: 1", "Item 1: 2", "Item 2: 3"]);
		// direct index assignment
		(document.getElementById("btnJake") as HTMLButtonElement).click();
		await flush();
		expect(lis()[3]).toBe("Item 3: Jake!");
	});

	test(`${name}: :await only re-runs on tracked deps (toggle/userId), not on unrelated changes`, async () => {
		let calls = 0;
		type AState = { count: number; userId: number; asyncToggle: boolean };
		type AFns = {
			loadUser(this: AState): Promise<{ id: number; name: string }>;
		};
		let state = StateBuilder.create<AState>(undefined, {
			count: 1,
			userId: 1,
			asyncToggle: true,
		}).build();
		(state as AState & AFns).loadUser = () => {
			const { asyncToggle, userId } = state;
			calls++;
			return new Promise((resolve, reject) => {
				setTimeout(() => {
					if (asyncToggle) resolve({ id: userId, name: "Ada" });
					else reject(new Error("User load failed"));
				}, 0);
			});
		};

		document.body.innerHTML = tpl(`
<div data-mf-register>
  <p id="await" :await="loadUser()">Loading...</p>
  <p id="then" :then="u">Loaded: \${u.id}</p>
  <p id="catch" :catch="e">Error: \${e.message}</p>
</div>`);
		// Rebuild after DOM and attach methods before registration
		state = StateBuilder.create<AState>(undefined, state).build() as AState;

		await flush();
		await flush();
		expect(calls).toBe(1);
		// unrelated change: count
		state.count = 2;
		await flush();
		await flush();
		expect(calls).toBe(1);
		// tracked change: toggle -> triggers rerun to catch
		state.asyncToggle = false;
		await flush();
		await flush();
		expect(calls).toBe(2);
		// tracked change: userId -> triggers rerun to then
		state.asyncToggle = true;
		state.userId = 2;
		await flush();
		await flush();
		expect(calls).toBe(3);
	});
}
