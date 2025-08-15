import { build } from "vite";

async function buildAll() {
	try {
		console.log("Building full bundle...");
		delete process.env.MF_LIGHT;
		delete process.env.MF_EMPTY_OUT_DIR;
		await build();

		console.log("Building light bundle (appending)...");
		process.env.MF_LIGHT = "1";
		process.env.MF_EMPTY_OUT_DIR = "false";
		await build();

		console.log("All bundles built (full + light).");
	} catch (e) {
		console.error(e);
		process.exit(1);
	}
}

buildAll();
