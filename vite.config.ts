import { defineConfig } from "vite";

export default defineConfig({
	build: {
		minify: true,
		lib: {
			entry: "src/main.ts",
			name: "Manifold",
			fileName: (format) => `manifold.${format}.js`,
		},
		rollupOptions: {
			output: {
				compact: true,
			},
		},
	},
	esbuild: {
		// Use esbuild's property mangling
		mangleProps: /^_/, // Mangle properties starting with underscore
		reserveProps: /^(?:constructor|prototype|__proto__|fn)$/, // Reserve important properties
		minifyIdentifiers: true,
		minifySyntax: true,
		minifyWhitespace: true,
	},
});
