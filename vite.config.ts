import { defineConfig } from "vite";

export default defineConfig({
	build: {
		minify: "terser",
		terserOptions: {
			compress: {
				module: true,
				toplevel: true,
				passes: 3,
				pure_getters: true,
				unsafe_arrows: true,
				unsafe_methods: true,
				unused: true,
			},
			mangle: { toplevel: true },
			format: { comments: false },
		},
		lib: {
			entry: "src/main.ts",
			name: "Manifold",
			formats: ["es", "umd", "cjs"],
			fileName: "manifold",
		},
	},
});
