import { defineConfig } from "vite";
import ultraMinifyPlugin from "./scripts/ultra-minify";

// Access env safely via globalThis to avoid Node typings in pure ESM TS
// biome-ignore lint/suspicious/noExplicitAny: env access
const env = (globalThis as any).process?.env || {};

// Allow limiting formats: MF_FORMAT=es | umd | es,umd (default both)
let formats: ("es" | "umd")[] = ["es", "umd"];
if (env.MF_FORMAT) {
	const parts = String(env.MF_FORMAT)
		.split(/[\s,]+/)
		.filter(Boolean) as ("es" | "umd")[];
	if (parts.length) formats = parts;
}

export default defineConfig({
	build: {
		// Use esbuild for baseline transforms; Terser runs via Rollup plugin below
		minify: "esbuild",
		lib: {
			entry: "src/main.ts",
			name: "Manifold",
			fileName: (format) => `manifold.${format}.js`,
			formats,
		},
		// Keep default emptyOutDir behaviour unless user explicitly disables it
		emptyOutDir: env.MF_EMPTY_OUT_DIR === "false" ? false : undefined,
		rollupOptions: {
			output: { compact: true },
		},
	},
	plugins: [ultraMinifyPlugin()],
	// esbuild remains for TS transforms; additional compression by Terser plugin
	esbuild: { target: "es2020" },
});
