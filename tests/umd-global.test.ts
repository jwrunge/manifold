import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { expect, test } from "vitest";

type ManifoldModule = typeof import("../src/main.ts").default;
type GlobalWithManifold = Window & { Manifold?: ManifoldModule };

const globalWindow = window as GlobalWithManifold &
	typeof window & {
		eval(code: string): unknown;
	};

test("UMD bundle registers Manifold on window", async () => {
	const here = dirname(fileURLToPath(import.meta.url));
	const bundlePath = join(here, "../dist/manifold.umd.js");
	const bundle = readFileSync(bundlePath, "utf8");

	delete globalWindow.Manifold;
	globalWindow.eval(bundle);

	const manifoldFromGlobal = globalWindow.Manifold;
	expect(manifoldFromGlobal).toBeDefined();
	if (!manifoldFromGlobal) {
		throw new Error("Expected Manifold to be attached to window");
	}
	const Manifold: ManifoldModule = manifoldFromGlobal;
	const state = Manifold.create()
		.add("count", 1)
		.derive("double", (s) => s.count * 2)
		.build();

	await new Promise((resolve) => setTimeout(resolve, 0));
	expect(state.double).toBe(2);

	state.count = 5;
	await new Promise((resolve) => setTimeout(resolve, 0));
	expect(state.double).toBe(10);

	delete globalWindow.Manifold;
});
