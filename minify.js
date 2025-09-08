import { readFileSync, statSync, writeFileSync } from "node:fs";
import { minify } from "terser";

const filenames = ["manifold.umd.cjs", "manifold.cjs", "manifold.js"];
const outputs = {};

for (const fname of filenames) {
	const filename = `./dist/${fname}`;
	const contents = readFileSync(filename, "utf8");

	const minified = await minify(contents, { sourceMap: true });

	writeFileSync(filename, minified.code ?? contents, "utf8");

	outputs[filename] = `${statSync(filename).size / 1000} KB`;
}

console.table(outputs);
