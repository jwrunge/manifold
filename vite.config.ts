import { defineConfig } from "vite";

export default defineConfig({
	build: {
		minify: true,
		lib: {
			entry: "src/main.ts",
			name: "Manifold",
			formats: ["es", "umd", "cjs"],
		},
	},
});
