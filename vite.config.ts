import { defineConfig } from "vite";

// Access env safely via globalThis to avoid Node typings in pure ESM TS
// biome-ignore lint/suspicious/noExplicitAny: env access
const env = (globalThis as any).process?.env || {};
const debugBuild = !!env.MF_DEBUG_BUILD;
const isLight = !!env.MF_LIGHT;

// Allow limiting formats: MF_FORMAT=es | umd | es,umd (default both)
let formats: ("es" | "umd")[] = ["es", "umd"];
if (env.MF_FORMAT) {
	const parts = String(env.MF_FORMAT)
		.split(/[\s,]+/)
		.filter(Boolean) as ("es" | "umd")[];
	if (parts.length) formats = parts;
}

export default defineConfig({
	define: { __MF_LIGHT__: JSON.stringify(String(isLight)) },
	resolve: isLight
		? {
				alias: {
					"./expression-runtime.ts": "./expression-runtime.light.ts",
				},
		  }
		: undefined,
	build: {
		minify: "esbuild",
		lib: {
			entry: "src/main.ts",
			name: "Manifold",
			fileName: (format) =>
				isLight
					? `manifold.light.${format}.js`
					: `manifold.${format}.js`,
			formats,
		},
		// Keep default emptyOutDir behaviour unless user explicitly disables it
		emptyOutDir: env.MF_EMPTY_OUT_DIR === "false" ? false : undefined,
		rollupOptions: { output: { compact: isLight } },
	},
	esbuild: {
		minifyIdentifiers: isLight ? true : !debugBuild,
		minifySyntax: isLight ? true : !debugBuild,
		minifyWhitespace: isLight ? true : !debugBuild,
		legalComments: "none",
		pure: [],
		drop: [],
		target: "es2022",
	},
});
