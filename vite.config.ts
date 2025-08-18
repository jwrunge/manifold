import { defineConfig } from "vite";
import ultraMinifyPlugin from "./scripts/ultra-minify.ts";

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

// Feature flags (defaults true). Set MF_FEAT_COND/ASYNC/EACH="false" to drop feature code paths.
const FEAT_COND = env.MF_FEAT_COND !== "false";
const FEAT_ASYNC = env.MF_FEAT_ASYNC !== "false";
const FEAT_EACH = env.MF_FEAT_EACH !== "false";

export default defineConfig({
	define: {
		__MF_FEAT_COND__: JSON.stringify(FEAT_COND),
		__MF_FEAT_ASYNC__: JSON.stringify(FEAT_ASYNC),
		__MF_FEAT_EACH__: JSON.stringify(FEAT_EACH),
	},
	build: {
		minify: "esbuild",
		lib: {
			entry: "src/main.ts",
			name: "Manifold",
			fileName: (format) => `manifold.${format}.js`,
			formats,
		},
		// Keep default emptyOutDir behaviour unless user explicitly disables it
		emptyOutDir: env.MF_EMPTY_OUT_DIR === "false" ? false : undefined,
		rollupOptions: { output: { compact: true } },
	},
	plugins: [ultraMinifyPlugin()],
	esbuild: {
		// Mangle single-underscore props but preserve double-underscore props used for internal context passing
		mangleProps: /^_/,
		reserveProps: /^__/,
		minifyIdentifiers: true,
		minifySyntax: true,
		minifyWhitespace: true,
		legalComments: "none",
		pure: ["console.log", "console.info", "console.debug"],
		drop: ["console", "debugger"],
		target: "es2020",
	},
});
