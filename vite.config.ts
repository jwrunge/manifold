import { defineConfig } from "vite";
import terserOptions from "./terser.config.js";

export default defineConfig({
	build: {
		minify: "terser",
		terserOptions,
		lib: {
			entry: "src/main.ts",
			name: "Manifold",
			formats: ["es", "umd"],
			fileName: (format) =>
				format === "umd" ? "manifold.umd.js" : "manifold.js",
		},
	},
});
