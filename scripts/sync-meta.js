#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

function readJson(file) {
	const p = path.resolve(process.cwd(), file);
	if (!fs.existsSync(p)) return null;
	const raw = fs.readFileSync(p, "utf8");
	// support JSONC by stripping comments while preserving string literals
	let out = "";
	let inString = false;
	let stringChar = "";
	let i = 0;
	while (i < raw.length) {
		const ch = raw[i];
		const next = raw[i + 1];
		if (!inString) {
			// start of string
			if (ch === '"' || ch === "'") {
				inString = true;
				stringChar = ch;
				out += ch;
				i++;
				continue;
			}
			// block comment
			if (ch === "/" && next === "*") {
				i += 2;
				while (i < raw.length && !(raw[i] === "*" && raw[i + 1] === "/")) i++;
				i += 2;
				continue;
			}
			// line comment
			if (ch === "/" && next === "/") {
				i += 2;
				while (i < raw.length && raw[i] !== "\n") i++;
				continue;
			}
			out += ch;
			i++;
		} else {
			// inside string
			if (ch === "\\") {
				out += ch + raw[i + 1];
				i += 2;
				continue;
			}
			out += ch;
			if (ch === stringChar) {
				inString = false;
				stringChar = "";
			}
			i++;
		}
	}
	return JSON.parse(out);
}

function writeJson(file, obj) {
	const p = path.resolve(process.cwd(), file);
	fs.writeFileSync(p, JSON.stringify(obj, null, 2) + "\n", "utf8");
	console.log(`Wrote ${file}`);
}

function main() {
	const args = process.argv.slice(2);
	const checkOnly = args.includes("--check") || args.includes("-c");
	const pkg = readJson("package.json");
	if (!pkg) {
		console.error("package.json not found");
		process.exit(1);
	}

	const tsconfig = readJson("tsconfig.json");
	const deno = readJson("deno.json") || {};
	const jsr = readJson("jsr.json") || {};

	const version = pkg.version;
	if (!version) {
		console.error("package.json has no version");
		process.exit(1);
	}

	// copy version to deno.json
	deno.version = version;

	// copy version to jsr.json
	jsr.version = version;

	// copy compilerOptions from tsconfig to jsr.json (merge)
	if (tsconfig?.compilerOptions) {
		jsr.compilerOptions = Object.assign(
			{},
			jsr.compilerOptions || {},
			tsconfig.compilerOptions,
		);
	}

	// show or write
	if (checkOnly) {
		console.log("--- deno.json (proposed) ---");
		console.log(JSON.stringify(deno, null, 2));
		console.log("--- jsr.json (proposed) ---");
		console.log(JSON.stringify(jsr, null, 2));
		console.log("Check mode: no files were written.");
	} else {
		writeJson("deno.json", deno);
		writeJson("jsr.json", jsr);
		console.log("Sync complete.");
	}
}

main();
