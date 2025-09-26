/// <reference lib="deno.ns" />
// Update JSR and Deno config versions to match package.json
// Usage: deno run --allow-read --allow-write scripts/update-release-config.ts

const enc = new TextEncoder();

function readJson(path: string) {
	const txt = Deno.readTextFileSync(path);
	return JSON.parse(txt);
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
		writeJson(denoPath, deno);
		console.log(`Updated ${denoPath} -> version ${version}`);
	} catch (err) {
		console.warn(`Skipping deno.json update: ${getMessage(err)}`);
	}
} catch (err) {
	console.error("Failed to update release configs:", getMessage(err));
	Deno.exit(2);
}
