import { beforeEach, describe, expect, test } from "vitest";
import StateBuilder from "../src/main.ts";
import RegEl from "../src/registry.ts";

const flush = () => new Promise((r) => setTimeout(r, 0));
const multiFlush = async (n = 4) => {
	for (let i = 0; i < n; i++) await flush();
};

// Helper to register all direct child elements under a root
const registerChildren = (root: Element, state: Record<string, unknown>) => {
	Array.from(root.children).forEach(
		(el) => new RegEl(el as HTMLElement, state)
	);
};

describe("DOM behavior / structural stability", () => {
	interface TestState extends Record<string, unknown> {
		count: number;
		arr: string[];
		ok: boolean;
		value?: number;
		flag?: boolean;
	}
	let state: TestState;
	beforeEach(() => {
		state = StateBuilder.create(undefined, {
			count: 0,
			arr: ["a", "b", "c"],
			ok: true,
			value: 5,
			flag: true,
		}).build() as TestState;
	});

	// 1 + 2 + 3
	test("conditional chain with multiple elseifs toggles visibility correctly & preserves node identity (cases 1-3)", async () => {
		document.body.innerHTML = `
      <div id="root">
		<p :if="count === 0" id="v0">Zero</p>
		<p :elseif="count === 1" id="v1">One</p>
		<p :elseif="count === 2" id="v2">Two</p>
		<p :elseif="count === 3" id="v3">Three</p>
		<p :else id="vElse">Other</p>
      </div>`;
		const root = document.getElementById("root");
		if (!root) throw new Error("root missing");
		registerChildren(root, state);
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
		expect(document.getElementById("v2")).toBe(v2);
	});

	// 4 Else not required
	test("else not required (case 4)", async () => {
		document.body.innerHTML = `<div id=\"c4\"><span :if=\"count < 2\" id=\"a\">LT2</span><span id=\"b\">Static</span></div>`;
		const root = document.getElementById("c4");
		if (!root) throw new Error("c4 root missing");
		registerChildren(root, state);
		await flush();
		expect(
			(document.getElementById("a") as HTMLElement).style.display
		).toBe("");
		state.count = 5;
		await flush();
		expect(
			(document.getElementById("a") as HTMLElement).style.display
		).toBe("none");
	});

	// 5 If required
	test("elseif without leading if never displays (case 5)", async () => {
		document.body.innerHTML = `<div id=\"c5\"><p :elseif=\"count === 0\" id=\"bad\">ShouldNotShow</p></div>`;
		const root = document.getElementById("c5");
		if (!root) throw new Error("c5 root missing");
		registerChildren(root, state);
		await flush();
		// Without a leading :if, :elseif should remain hidden by default
		expect(
			(document.getElementById("bad") as HTMLElement).style.display
		).toBe("none");
		state.count = 0;
		await flush();
		expect(
			(document.getElementById("bad") as HTMLElement).style.display
		).toBe("none");
	});

	// 6 Else must be last
	test("else preceding an elseif prevents later elseif from showing (case 6)", async () => {
		document.body.innerHTML = `<div id=\"c6\">
		  <p :if=\"count===1\" id=\"if\">One</p>
		  <p :else id=\"else\">ElseShown</p>
		  <p :elseif=\"count===2\" id=\"later\">Two</p>
		</div>`;
		const root = document.getElementById("c6");
		if (!root) throw new Error("c6 root missing");
		registerChildren(root, state);
		await flush();
		state.count = 2;
		await flush();
		expect(
			(document.getElementById("later") as HTMLElement).style.display
		).toBe("none");
		expect(
			(document.getElementById("else") as HTMLElement).style.display
		).toBe("");
	});

	// 7 Complex interpolation
	test("complex expression interpolation updates (case 7)", async () => {
		document.body.innerHTML = `<div id=\"c7\"><span id=\"expr\">Sum: \${count + arr.length * 2 + (flag ? 10 : 0)}</span></div>`;
		const root = document.getElementById("c7");
		if (!root) throw new Error("c7 root missing");
		registerChildren(root, state);
		await flush();
		const span = document.getElementById("expr") as HTMLElement;
		const before = span.textContent;
		state.count = 5;
		await flush();
		expect(span.textContent).not.toBe(before); // changed
	});

	// 8 Former ignore marker removed; both subtrees interpolate
	test("removed ignore marker allows interpolation in subtree (case 8)", async () => {
		document.body.innerHTML = `<div id=\"c8\"><div><span id=\"sub\">Value: \${count}</span></div><span id=\"ok\">Here: \${count}</span></div>`;
		const root = document.getElementById("c8");
		if (!root) throw new Error("c8 root missing");
		registerChildren(root, state);
		await flush();
		const sub = document.getElementById("sub");
		const ok = document.getElementById("ok");
		if (!sub || !ok) throw new Error("missing nodes");
		expect(sub.textContent?.includes(String(state.count))).toBe(true);
		expect(ok.textContent?.includes(String(state.count))).toBe(true);
		state.count = 9;
		await flush();
		expect(sub.textContent?.includes("9")).toBe(true);
		expect(ok.textContent?.includes("9")).toBe(true);
	});

	// 9 Each hides when array empty
	test("each template hides when array empty (case 9)", async () => {
		document.body.innerHTML = `<ul id=\"c9\"><li :each=\"arr as v, i\">(\${i}) \${v}</li></ul>`;
		const ul = document.getElementById("c9");
		if (!ul) throw new Error("c9 root missing");
		const template = ul.querySelector("li");
		if (!template) throw new Error("template missing");
		new RegEl(template as HTMLElement, state);
		await flush();
		expect(
			Array.from(ul.querySelectorAll("li")).filter(
				(n) => (n as HTMLElement).style.display !== "none"
			).length
		).toBe(3);
		state.arr = [];
		await flush();
		expect(
			Array.from(ul.querySelectorAll("li")).filter(
				(n) => (n as HTMLElement).style.display !== "none"
			).length
		).toBe(0);
	});

	// 10 Array item update preserves sibling identity
	test("updating individual array item preserves sibling node identities (case 10)", async () => {
		document.body.innerHTML = `<ul id=\"list\"><li :each=\"arr as v, i\">(\${i}) \${v}</li></ul>`;
		const ul = document.getElementById("list");
		if (!ul) throw new Error("list missing");
		const template = ul.querySelector("li");
		if (!template) throw new Error("template missing");
		new RegEl(template as HTMLElement, state);
		await flush();
		const items = () =>
			Array.from(ul.querySelectorAll("li")).filter(
				(n) => (n as HTMLElement).style.display !== "none"
			);
		const nodes = items();
		expect(nodes.map((n) => n.textContent?.trim())).toEqual([
			"(0) a",
			"(1) b",
			"(2) c",
		]);
		state.arr[1] = "B!";
		await flush();
		const nodesAfter = items();
		expect(nodesAfter[0]).toBe(nodes[0]);
		expect(nodesAfter[2]).toBe(nodes[2]);
		expect(nodesAfter[1]).toBe(nodes[1]);
		expect(nodesAfter[1].textContent?.includes("B!")).toBe(true);
	});

	// 11 Interpolation within each
	test("interpolation inside each clones (case 11)", async () => {
		document.body.innerHTML = `<div id=\"c11\"><p :each=\"arr as v, i\">IDX=\${i} :: \${v.toUpperCase()}</p></div>`;
		const root = document.getElementById("c11");
		if (!root) throw new Error("c11 root missing");
		const template = root.querySelector("p");
		if (!template) throw new Error("template missing");
		new RegEl(template as HTMLElement, state);
		await flush();
		const texts = Array.from(root.querySelectorAll("p"))
			.filter((n) => (n as HTMLElement).style.display !== "none")
			.map((n) => n.textContent?.trim());
		expect(texts).toEqual(["IDX=0 :: A", "IDX=1 :: B", "IDX=2 :: C"]);
	});

	// 12 Nested if inside each
	test("nested if within each (case 12)", async () => {
		document.body.innerHTML = `<div id=\"c12\"><div :each=\"arr as v, i\"><span :if=\"v==='a'\" class=\"hit\">A</span><span :else class=\"miss\">NotA</span></div></div>`;
		const root = document.getElementById("c12");
		if (!root) throw new Error("c12 root missing");
		const template = root.querySelector("div");
		if (!template) throw new Error("template missing");
		new RegEl(template as HTMLElement, state);
		await flush();
		const hits = Array.from(root.querySelectorAll(".hit")).filter(
			(n) => (n as HTMLElement).style.display !== "none"
		);
		const misses = Array.from(root.querySelectorAll(".miss")).filter(
			(n) => (n as HTMLElement).style.display !== "none"
		);
		expect(hits.length).toBe(1);
		expect(misses.length).toBe(2);
	});

	// 13 Async transitions
	test("async await/then/catch transitions across success->failure->success cycles (case 13)", async () => {
		document.body.innerHTML = `
      <div id="asyncRoot">
		<p :await="(ok ? Promise.resolve(21) : Promise.reject('nope'))" id="await">Loading</p>
		<p :then="val" id="then">Val: \${val}</p>
		<p :catch="err" id="catch">Err: \${err}</p>
      </div>`;
		const root = document.getElementById("asyncRoot");
		if (!root) throw new Error("async root missing");
		registerChildren(root, state);
		expect(
			(document.getElementById("await") as HTMLElement).style.display
		).toBe("");
		expect(
			(document.getElementById("then") as HTMLElement).style.display
		).toBe("none");
		expect(
			(document.getElementById("catch") as HTMLElement).style.display
		).toBe("none");
		await multiFlush(4);
		expect(
			(document.getElementById("await") as HTMLElement).style.display
		).toBe("none");
		expect(
			(document.getElementById("then") as HTMLElement).textContent
		).toBe("Val: 21");
		state.ok = false;
		await multiFlush(6);
		expect(
			(document.getElementById("catch") as HTMLElement).style.display
		).toBe("");
		expect(
			(document.getElementById("catch") as HTMLElement).textContent
		).toBe("Err: nope");
		state.ok = true;
		await multiFlush(6);
		expect(
			(document.getElementById("then") as HTMLElement).style.display
		).toBe("");
	});

	// 14 Interpolations inside async then/catch
	test("interpolation inside async then/catch (case 14)", async () => {
		document.body.innerHTML = `<div id=\"c14\">
		 <div :await=\"ok ? Promise.resolve(2) : Promise.reject(3)\" id=\"await14\">Loading</div>
		 <div :then=\"res\" id=\"then14\">Double: \${res * 2}</div>
		 <div :catch=\"err\" id=\"catch14\">Triple: \${err * 3}</div>
		</div>`;
		const root = document.getElementById("c14");
		if (!root) throw new Error("c14 root missing");
		registerChildren(root, state);
		await multiFlush(5);
		expect(
			(document.getElementById("then14") as HTMLElement).textContent
		).toBe("Double: 4");
		state.ok = false;
		await multiFlush(6);
		expect(
			(document.getElementById("catch14") as HTMLElement).textContent
		).toBe("Triple: 9");
	});

	// 15 Await/then/catch can contain conditionals & each
	test("then/catch blocks can host conditionals and each (case 15)", async () => {
		document.body.innerHTML = `<div id=\"c15\">
		 <section :await=\"ok ? Promise.resolve(arr) : Promise.reject(arr)\" id=\"await15\">Loading</section>
		 <section :then=\"vals\" id=\"then15\"><ul><li :each=\"vals as v, i\"><span :if=\"i===0\">First: \${v}</span><span :else>Idx \${i}: \${v}</span></li></ul></section>
		 <section :catch=\"errs\" id=\"catch15\"><p :if=\"errs.length===0\">None</p><p :else>Err Count: \${errs.length}</p></section>
		</div>`;
		const root = document.getElementById("c15");
		if (!root) throw new Error("c15 root missing");
		registerChildren(root, state);
		await multiFlush(6);
		const thenList = Array.from(
			document.querySelectorAll("#then15 li:not([data-each])")
		).map((li) => li.textContent?.trim());
		expect(thenList[0]?.startsWith("First:")).toBe(true);
		state.ok = false;
		await multiFlush(6);
		expect(
			(document.getElementById("catch15") as HTMLElement).style.display
		).toBe("");
	});

	// 16 Conditionals / each can contain await/then/catch
	test("conditionals and each can host await/then/catch (case 16)", async () => {
		document.body.innerHTML = `<div id=\"c16\">
		 <div :if=\"flag\">
		   <div :await=\"Promise.resolve(3)\" id=\"innerAwait\">Loading</div>
		   <div :then=\"v\" id=\"innerThen\">Val=\${v}</div>
		 </div>
		 <div :each=\"arr as v, i\"><span :await=\"Promise.resolve(v)\" class=\"aw\">L</span><span :then=\"x\" class=\"th\">X=\${x}</span></div>
		</div>`;
		const root = document.getElementById("c16");
		if (!root) throw new Error("c16 root missing");
		registerChildren(root, state);
		await multiFlush(6);
		expect(
			(document.getElementById("innerThen") as HTMLElement).textContent
		).toBe("Val=3");
		const ths = Array.from(root.querySelectorAll(".th")).filter(
			(n) => (n as HTMLElement).style.display !== "none"
		);
		expect(ths.length).toBe(state.arr.length);
	});

	// 17 Sibling order rules
	test("then/catch must follow await (case 17)", async () => {
		document.body.innerHTML = `<div id=\"c17\">
		 <div :then=\"v\" id=\"prematureThen\">Early \${v}</div>
		 <div :await=\"Promise.resolve('ok')\" id=\"await17\">Load</div>
		 <div :catch=\"e\" id=\"catch17\">Err: \${e}</div>
		</div>`;
		const root = document.getElementById("c17");
		if (!root) throw new Error("c17 root missing");
		registerChildren(root, state);
		await flush();
		expect(
			(document.getElementById("prematureThen") as HTMLElement).style
				.display
		).toBe("none");
		await multiFlush(5);
		expect(
			(document.getElementById("prematureThen") as HTMLElement).style
				.display
		).toBe("");
	});
});
