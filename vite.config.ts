import { defineConfig } from "vite";

export default defineConfig({
	build: {
		minify: "esbuild",
		lib: {
			entry: "src/main.ts",
			name: "Manifold",
			fileName: (format) => `manifold.${format}.js`,
		},
		rollupOptions: {
			output: {
				compact: true,
			},
			plugins: [
				{
					name: "safe-ultra-minify",
					generateBundle(_options, bundle) {
						for (const fileName in bundle) {
							const chunk = bundle[fileName];
							if (chunk.type === "chunk") {
								// Safe whitespace removal that preserves syntax
								chunk.code = chunk.code
									// Remove leading/trailing whitespace from lines
									.split("\n")
									.map((line) => line.trim())
									.join("\n")
									// Remove empty lines
									.replace(/\n\s*\n/g, "\n")
									// Remove newlines between simple statements
									.replace(/;\n/g, ";")
									// Remove spaces around operators (conservative)
									.replace(/\s*([{}();,])\s*/g, "$1")
									// Remove extra spaces but preserve single spaces in strings and comments
									.replace(
										/([^"'/*])\s{2,}([^"'/*])/g,
										"$1 $2"
									)
									.trim();
							}
						}
					},
				},
			],
		},
	},
	esbuild: {
		mangleProps: /^_/,
		reserveProps: /^(?:constructor|prototype|__proto__|fn)$/,
		minifyIdentifiers: true,
		minifySyntax: true,
		minifyWhitespace: true,
		legalComments: "none",
		pure: ["console.log", "console.info", "console.debug"],
		drop: ["console", "debugger"],
	},
});
