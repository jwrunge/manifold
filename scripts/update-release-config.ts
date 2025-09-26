/// <reference lib="deno.ns" />
// Update JSR and Deno config versions to match package.json
// Usage: deno run --allow-read --allow-write scripts/update-release-config.ts

const enc = new TextEncoder();

function readJson(path: string) {
	const txt = Deno.readTextFileSync(path);
	// Support JSONC by stripping comments while preserving string literals
	const raw = txt;
	let out = "";
	let inString = false;
	let stringChar = "";
	let i = 0;
	while (i < raw.length) {
		const ch = raw[i];
		const next = raw[i + 1];
		if (!inString) {
			if (ch === '"' || ch === "'") {
				inString = true;
				stringChar = ch;
				out += ch;
				i++;
				continue;
			}
			if (ch === "/" && next === "*") {
				i += 2;
				while (i < raw.length && !(raw[i] === "*" && raw[i + 1] === "/")) i++;
				i += 2;
				continue;
			}
			if (ch === "/" && next === "/") {
				i += 2;
				while (i < raw.length && raw[i] !== "\n") i++;
				continue;
			}
			out += ch;
			i++;
		} else {
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

function writeJson(path: string, obj: unknown) {
	const txt = `${JSON.stringify(obj, null, 2)}\n`;
	Deno.writeFileSync(path, enc.encode(txt));
}

function getMessage(err: unknown) {
	if (err instanceof Error) return err.message;
	try {
		return String(err);
	} catch {
		return "unknown error";
	}
}

try {
	const pkg = readJson("package.json");
	const version = pkg.version;
	console.log(`Package version: ${version}`);

	// Update jsr.json if present
	try {
		const jsrPath = "jsr.json";
		const jsr = readJson(jsrPath);
		jsr.version = version;
		// Also merge compilerOptions from tsconfig.json if present so JSR publishes with correct libs
		try {
			const tsconfig = readJson("tsconfig.json");
			if (tsconfig?.compilerOptions) {
				jsr.compilerOptions = Object.assign(
					{},
					jsr.compilerOptions || {},
					tsconfig.compilerOptions,
				);
				console.log(
					`Merged compilerOptions from tsconfig.json into ${jsrPath}`,
				);
			}
		} catch (e) {
			console.warn(
				`Could not read tsconfig.json to merge compilerOptions: ${getMessage(
					e,
				)}`,
			);
		}
		// Log final jsr json for release-time debugging (so CI logs show what JSR saw)
		console.log("Final jsr.json:", JSON.stringify(jsr, null, 2));
		writeJson(jsrPath, jsr);
		console.log(`Updated ${jsrPath} -> version ${version}`);
	} catch (err) {
		console.warn(`Skipping jsr.json update: ${getMessage(err)}`);
	}

	// Update deno.json if present
	try {
		const denoPath = "deno.json";
		const deno = readJson(denoPath);
		deno.version = version;
		console.log("Final deno.json:", JSON.stringify(deno, null, 2));
		writeJson(denoPath, deno);
		console.log(`Updated ${denoPath} -> version ${version}`);
	} catch (err) {
		console.warn(`Skipping deno.json update: ${getMessage(err)}`);
	}
} catch (err) {
	console.error("Failed to update release configs:", getMessage(err));
	Deno.exit(2);
}
