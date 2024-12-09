import { minify } from "terser";
import { readFile, writeFile } from "node:fs/promises";

const options = {
  compress: true,
  mangle: true,
};

for (const file of ["manifold.es.js", "manifold.umd.js"]) {
  const inputFilename = `dist/${file}`;
  const outputFilename = file.replace(".js", ".min.js");
  const input = await readFile(inputFilename, "utf-8");
  const result = await minify(input, options);
  writeFile(`dist/${outputFilename}`, result.code ?? "", { encoding: "utf-8" });
}
