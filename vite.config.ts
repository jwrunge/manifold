import { defineConfig } from "vite";

export default defineConfig({
	build: {
		minify: true,
		lib: {
			entry: "src/index.ts",
			name: "Manifold",
			fileName: (format) => `manifold.${format}.js`,
		},
	},
});
