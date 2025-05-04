import { defineConfig } from "vite";

export default defineConfig({
	build: {
		minify: false,
		lib: {
			entry: "src/reactivity.ts",
			name: "Manifold",
			fileName: format => `manifold.${format}.js`,
		},
	},
});
