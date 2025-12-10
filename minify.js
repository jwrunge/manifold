import { readFileSync, statSync, writeFileSync } from "node:fs";
import { gzipSync } from "node:zlib";
import { minify } from "terser";
import sharedOptions from "./terser.config.js";

const filenames = ["manifold.js"];
const cssFiles = ["transitions.css"];
/** @type {Record<string, {raw: string, gzip: string}>} */
const outputs = {};

/** @param {number} bytes */
const fmt = (bytes) => `${(bytes / 1000).toFixed(2)} KB`;

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

// Process CSS files
for (const fname of cssFiles) {
	const srcFile = `./src/${fname}`;
	const destFile = `./dist/${fname}`;
	const contents = readFileSync(srcFile, "utf8");

	// Minify CSS: remove comments, extra whitespace, and newlines
	const minified = contents
		.replace(/\/\*[\s\S]*?\*\//g, "") // Remove comments
		.replace(/\s+/g, " ") // Collapse whitespace
		.replace(/\s*([{:;,}])\s*/g, "$1") // Remove space around punctuation
		.trim();

	writeFileSync(destFile, minified, "utf8");

	const rawBytes = statSync(destFile).size;
	let gzipBytes;
	try {
		gzipBytes = gzipSync(minified, { level: 9 }).length;
	} catch {
		gzipBytes = 0;
	}

	outputs[destFile] = {
		raw: fmt(rawBytes),
		gzip: gzipBytes ? fmt(gzipBytes) : "(gzip err)",
	};
}

console.table(outputs);
