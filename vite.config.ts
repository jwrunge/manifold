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
	plugins: [
		{
			name: "ultra-minify",
			generateBundle(_options, bundle) {
				for (const fileName in bundle) {
					const chunk = bundle[fileName];
					if (chunk.type === "chunk") {
						// More conservative whitespace removal
						chunk.code = chunk.code
							.replace(/\n\s*/g, " ") // Replace newlines with single space
							.replace(/\s{2,}/g, " ") // Replace multiple spaces with single space
							.replace(/;\s+/g, ";") // Remove spaces after semicolons
							.replace(/,\s+/g, ",") // Remove spaces after commas
							.replace(/\{\s+/g, "{") // Remove spaces after opening braces
							.replace(/\s+\}/g, "}") // Remove spaces before closing braces
							.replace(/\(\s+/g, "(") // Remove spaces after opening parentheses
							.replace(/\s+\)/g, ")") // Remove spaces before closing parentheses
							.trim(); // Remove leading/trailing whitespace
					}
				}
			},
		},
	],
	esbuild: {
		minifyIdentifiers: isLight ? true : !debugBuild,
		minifySyntax: isLight ? true : !debugBuild,
		minifyWhitespace: isLight ? true : !debugBuild,
		legalComments: "none",
		pure: ["console.log", "console.info", "console.debug"],
		drop: ["console", "debugger"],
		target: "es2022",
	},
});
