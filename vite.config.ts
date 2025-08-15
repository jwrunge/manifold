import { defineConfig } from "vite";

// Access env safely via globalThis to avoid Node typings in pure ESM TS
// biome-ignore lint/suspicious/noExplicitAny: env access
const env = (globalThis as any).process?.env || {};
const isLight = !!env.MF_LIGHT;

// Allow limiting formats: MF_FORMAT=es | umd | es,umd (default both)
let formats: ("es" | "umd")[] = ["es", "umd"];
if (env.MF_FORMAT) {
	const parts = String(env.MF_FORMAT)
		.split(/[\s,]+/)
		.filter(Boolean) as ("es" | "umd")[];
	if (parts.length) formats = parts;
}

export default defineConfig({
	define: {
		__MF_LIGHT__: JSON.stringify(String(isLight)),
	},
	resolve: isLight
		? {
				alias: {
					"./expression-runtime.ts": "./expression-runtime.light.ts",
				},
		  }
		: undefined,
	build: {
		minify: "esbuild",
		lib: {
			entry: "src/main.ts",
			name: "Manifold",
			fileName: (format) =>
				isLight
					? `manifold.light.${format}.js`
					: `manifold.${format}.js`,
			formats,
		},
		// Keep default emptyOutDir behaviour unless user explicitly disables it
		emptyOutDir: env.MF_EMPTY_OUT_DIR === "false" ? false : undefined,
		rollupOptions: { output: { compact: true } },
	},
	plugins: [
		{
			name: "ultra-minify",
			generateBundle(options, bundle) {
				for (const fileName in bundle) {
					const chunk = bundle[fileName];
					if (chunk.type === "chunk") {
						// Aggressive but safe whitespace and punctuation tightening
						let c = chunk.code;
						c = c.replace(/\n+/g, "\n"); // collapse newlines
						c = c.replace(/\n\s+/g, "\n"); // trim indentation
						c = c.replace(/\s{2,}/g, " "); // collapse spaces
						c = c.replace(/;\s*;/g, ";"); // drop empty statements
						// NOTE: do not remove semicolons before } to preserve empty statements (e.g., `for(...);`)
						c = c.replace(/\{\s+/g, "{"); // space after {
						c = c.replace(/\s+\}/g, "}"); // space before }
						c = c.replace(/\(\s+/g, "("); // space after (
						c = c.replace(/\s+\)/g, ")"); // space before )
						c = c.replace(/,\s+/g, ","); // space after ,
						c = c.replace(/:\s+/g, ":"); // space after : (objects)
						c = c.replace(/\s*([=+\-*/<>!?:,&|])\s*/g, "$1"); // around simple operators

						// String pooling for curated, non-user-facing literals
						const pool = [
							// Internal attributes and selectors
							"data-if",
							"data-elseif",
							"data-else",
							"data-each",
							"[data-if]",
							"[data-each]",
							"data-mf-register",
							// Short internal names
							"data-st",
							"data-mt",
							// Directive attributes
							":each",
							":onclick",
							":then",
							":catch",
							":await",
							// Common DOM strings
							"none",
							"click",
							"input",
							"change",
							"style",
							"display",
							"value",
							"checked",
							"selectedIndex",
							// Misc
							"m.s",
							"Promise",
							"object",
							"string",
						];
						const counts: Record<string, number> =
							Object.create(null);
						const esc = (s: string) =>
							s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
						for (const s of pool) {
							const re = new RegExp(`"${esc(s)}"`, "g");
							counts[s] = (c.match(re) || []).length;
						}
						const entries = Object.entries(counts).filter(
							([, n]) => n >= 3
						);
						if (entries.length) {
							let idx = 0;
							const map: Record<string, string> =
								Object.create(null);
							const decls: string[] = [];
							for (const [s] of entries) {
								const v = `__s${idx++}`;
								map[s] = v;
								decls.push(`${v}="${s}"`);
							}
							// Replace all occurrences
							for (const [s, v] of Object.entries(map)) {
								const re = new RegExp(`"${esc(s)}"`, "g");
								c = c.replace(re, v);
							}
							// Insert declarations. For UMD, prepend at the very start so wrapper can access vars.
							const decl = `var ${decls.join(",")};`;
							const format =
								(options as unknown as { format?: string })
									?.format || "es";
							if (format === "umd") {
								// Prepend at absolute start to cover UMD wrapper usage
								c = decl + c;
							} else {
								// ES: keep imports first if present
								const importPrologue = c.match(
									/^(?:import\s[^;]*;\s*)+/
								);
								if (importPrologue) {
									const at = importPrologue[0].length;
									c = c.slice(0, at) + decl + c.slice(at);
								} else {
									c = decl + c;
								}
							}
						}
						chunk.code = c.trim();
					}
				}
			},
		},
	],
	esbuild: {
		mangleProps: /^_/, // Mangle properties starting with underscore
		minifyIdentifiers: true,
		minifySyntax: true,
		minifyWhitespace: true,
		legalComments: "none",
		pure: ["console.log", "console.info", "console.debug"],
		drop: ["console", "debugger"],
		target: "es2022",
	},
});
