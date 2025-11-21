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
		rollupOptions: {
			external: [/^node:/],
			onwarn(warning, warn) {
				// Suppress warnings about Node.js built-ins being externalized
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
