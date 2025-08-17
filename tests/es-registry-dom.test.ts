import { expect, test } from "vitest";

type Builder = typeof import("../src/main.ts").default;

// Load all builders: source, ES bundle, and UMD bundle
const loadBuilders = async () => {
	const src = (await import("../src/main.ts")).default as Builder;
	const es = (
		(await import("../dist/manifold.es.js")) as unknown as {
			default: Builder;
		}
	).default;
	// UMD: load module and support both CommonJS (module.exports) and global attach
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

const tpl = (s: string) => s; // helper to avoid TS placeholder complaints

// Run tests for each builder variant
const builders = await loadBuilders();

for (const { name, StateBuilder } of builders) {
	test(`${name}: DOM updates via auto-registration`, async () => {
		const state = StateBuilder.create({ count: 1 }).build();
		document.body.innerHTML = tpl(`
<div data-mf-register>
  <p id="c">\${count}</p>
</div>
`);
		// Trigger auto-registration
		StateBuilder.create().build();
		await flush();
		expect((document.getElementById("c") as HTMLElement).textContent).toBe(
			"1"
		);
		// Update and verify DOM reflects change
		(state as Record<string, unknown>).count = 2;
		await flush();
		expect((document.getElementById("c") as HTMLElement).textContent).toBe(
			"2"
		);
	});

	test(`${name}: :await with function re-runs when reactive deps are read synchronously`, async () => {
		const state = StateBuilder.create({ ok: true }).build();
		(state as Record<string, unknown>).loadUser = () => {
			const ok = (state as Record<string, unknown>).ok as boolean; // track synchronously
			return new Promise((resolve, reject) => {
				setTimeout(() => {
					ok ? resolve(42) : reject("fail");
				}, 0);
			});
		};
		document.body.innerHTML = tpl(`
<div data-mf-register>
  <p :await="loadUser()" id="await">Loading</p>
  <p :then="val" id="then">Val: \${val}</p>
  <p :catch="err" id="catch">Err: \${err}</p>
</div>
`);
		// Trigger auto-registration
		StateBuilder.create().build();
		await flush();
		// Let the promise resolve
		await flush();
		expect(
			(document.getElementById("await") as HTMLElement).style.display
		).toBe("none");
		expect(
			(document.getElementById("then") as HTMLElement).style.display
		).toBe("");
		expect(
			(document.getElementById("then") as HTMLElement).textContent
		).toBe("Val: 42");
		// Toggle dependency and ensure chain re-runs to catch
		(state as Record<string, unknown>).ok = false;
		await flush();
		await flush();
		expect(
			(document.getElementById("catch") as HTMLElement).style.display
		).toBe("");
		expect(
			(document.getElementById("catch") as HTMLElement).textContent
		).toBe("Err: fail");
	});
}
