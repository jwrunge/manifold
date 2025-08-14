import { defineConfig } from "vite";

// Conditional console stripping: enable full logging when MF_DEBUG_BUILD=1
// Access via globalThis to avoid needing Node typings
// biome-ignore lint/suspicious/noExplicitAny: env access
const debugBuild = !!(globalThis as any).process?.env?.MF_DEBUG_BUILD;

export default defineConfig({
	build: {
		minify: "esbuild",
		lib: {
			entry: "src/main.ts",
			name: "Manifold",
			fileName: (format) => `manifold.${format}.js`,
		},
		rollupOptions: {
			output: { compact: false },
		},
	},
	esbuild: {
		minifyIdentifiers: !debugBuild,
		minifySyntax: !debugBuild,
		minifyWhitespace: !debugBuild,
		legalComments: "none",
		// Temporarily disable removal of console to aid debugging
		pure: [],
		drop: [],
		target: "es2022",
	},
});
