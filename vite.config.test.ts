import { defineConfig } from "vite";
import terserOptions from "./terser.config.js";

export default defineConfig({
	build: {
		minify: "terser",
		terserOptions,
		lib: {
			entry: "src/main.ts",
			name: "Manifold",
			formats: ["es"],
			fileName: () => "manifold.js",
		},
		rollupOptions: {
			external: [/^node:/],
			output: {
				manualChunks: {
					"expression-parser": ["src/parsing/expression-parser.ts"],
				},
			},
			onwarn(warning, warn) {
				if (
					warning.code === "UNRESOLVED_IMPORT" &&
					warning.message.includes("node:")
				) {
					return;
				}
				warn(warning);
			},
		},
	},
});
