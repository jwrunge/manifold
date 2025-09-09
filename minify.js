import { readFileSync, statSync, writeFileSync } from "node:fs";
import { gzipSync } from "node:zlib";
import { minify } from "terser";

const filenames = ["manifold.umd.cjs", "manifold.cjs", "manifold.js"];
const outputs = {};

const fmt = (bytes) => `${(bytes / 1000).toFixed(2)} KB`;

for (const fname of filenames) {
	const filename = `./dist/${fname}`;
	const contents = readFileSync(filename, "utf8");

	const minified = await minify(contents, {
		sourceMap: true,
		toplevel: true,
		compress: {
			// Multiple passes increase chances of hoisting & reusing constants
			passes: 3,
			reduce_vars: true,
			reduce_funcs: true,
			hoist_funs: true,
			hoist_vars: true,
			booleans_as_integers: true,
			pure_getters: true,
		},
		mangle: {
			toplevel: true,
			properties: { regex: /^_/ },
		},
		format: {
			comments: false,
		},
	});

	const finalCode = minified.code ?? contents;
	writeFileSync(filename, finalCode, "utf8");

	const rawBytes = statSync(filename).size;
	let gzipBytes;
	try {
		gzipBytes = gzipSync(finalCode, { level: 9 }).length;
	} catch {
		gzipBytes = 0;
	}

	outputs[filename] = {
		raw: fmt(rawBytes),
		gzip: gzipBytes ? fmt(gzipBytes) : "(gzip err)",
	};
}

console.table(outputs);
