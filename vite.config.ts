import { defineConfig, type LibraryFormats } from "vite";
import ultraMinifyPlugin from "./scripts/ultra-minify";

// Access env safely via globalThis to avoid Node typings in pure ESM TS
// biome-ignore lint/suspicious/noExplicitAny: env access
const env = (globalThis as any).process?.env || {};
const formats: LibraryFormats[] = ["es", "umd", "cjs"];

// Esbuild options (keep conservative; no prop mangling to avoid cross-module breaks)
const esbuildOpts: Record<string, unknown> = {
	target: "es2022",
};

export default defineConfig({
	build: {
		minify: true,
		lib: {
			entry: "src/main.ts",
			name: "Manifold",
			fileName: (format) => `manifold.${format}.js`,
			formats,
		},
		emptyOutDir: env.MF_EMPTY_OUT_DIR === "false" ? false : undefined,
		rollupOptions: {
			output: { compact: true },
		},
	},
	plugins: [ultraMinifyPlugin()],
	esbuild: esbuildOpts,
});
