import { readFileSync, statSync, writeFileSync } from "node:fs";
import { gzipSync } from "node:zlib";
import { minify } from "terser";

const filenames = ["manifold.umd.cjs", "manifold.cjs", "manifold.js"];
/** @type {Record<string, {raw: string, gzip: string}>} */
const outputs = {};

/** @param {number} bytes */
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

// Also emit file aliases expected by tests/demo
try {
	// ESM alias
	const esSrc = "./dist/manifold.js";
	const esDst = "./dist/manifold.es.js";
	const esCode = readFileSync(esSrc, "utf8");
	writeFileSync(esDst, esCode, "utf8");
	const rawBytes = statSync(esDst).size;
	let gzipBytes;
	try {
		gzipBytes = gzipSync(esCode, { level: 9 }).length;
	} catch {
		gzipBytes = 0;
	}
	outputs[esDst] = {
		raw: fmt(rawBytes),
		gzip: gzipBytes ? fmt(gzipBytes) : "(gzip err)",
	};
} catch {}

try {
	// UMD alias
	const umdSrc = "./dist/manifold.umd.cjs";
	const umdDst = "./dist/manifold.umd.js";
	const umdCode = readFileSync(umdSrc, "utf8");
	writeFileSync(umdDst, umdCode, "utf8");
	const rawBytes = statSync(umdDst).size;
	let gzipBytes;
	try {
		gzipBytes = gzipSync(umdCode, { level: 9 }).length;
	} catch {
		gzipBytes = 0;
	}
	outputs[umdDst] = {
		raw: fmt(rawBytes),
		gzip: gzipBytes ? fmt(gzipBytes) : "(gzip err)",
	};
} catch {}

console.table(outputs);
