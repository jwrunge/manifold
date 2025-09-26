import { readFileSync, statSync, writeFileSync } from "node:fs";
import { gzipSync } from "node:zlib";
import { minify } from "terser";

const filenames = ["manifold.umd.cjs", "manifold.cjs", "manifold.js"];
/** @type {Record<string, {raw: string, gzip: string}>} */
const outputs = {};

/** @param {number} bytes */
const fmt = (bytes) => `${(bytes / 1000).toFixed(2)} KB`;

// Import shared terser config. Use dynamic import so this CJS-ish script can load ESM file.
const { default: sharedOptions } = await import(
	new URL("./terser.config.js", import.meta.url)
);

for (const fname of filenames) {
	const filename = `./dist/${fname}`;
	const contents = readFileSync(filename, "utf8");

	// Enhance shared options for post-build minify (properties regex)
	const opts = {
		sourceMap: true,
		toplevel: true,
		mangle: {
			...(sharedOptions.mangle || {}),
			properties: { regex: /^_/ },
		},
		format: sharedOptions.format,
		compress: { ...(sharedOptions.compress || {}) },
	};

	const minified = await minify(contents, opts);

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
} catch (_e) {
	// ignore - alias source may not exist in some builds
}

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
} catch (_e) {
	// ignore - alias source may not exist in some builds
}

console.table(outputs);
