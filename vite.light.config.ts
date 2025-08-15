import { defineConfig } from "vite";

export default defineConfig({
	define: { __MF_LIGHT__: "true" },
	resolve: {
		alias: { "./expression-runtime.ts": "./expression-runtime.light.ts" },
	},
	build: {
		minify: "esbuild",
		lib: {
			entry: "src/main.ts",
			name: "Manifold",
			fileName: (format) => `manifold.light.${format}.js`,
		},
		rollupOptions: { output: { compact: true } },
	},
	esbuild: {
		minifyIdentifiers: true,
		minifySyntax: true,
		minifyWhitespace: true,
		legalComments: "none",
		drop: [],
		target: "es2022",
	},
});
