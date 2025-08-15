import { build } from "vite";

async function buildAll() {
	try {
		console.log("Building bundle...");
		delete process.env.MF_EMPTY_OUT_DIR;
		await build();
		console.log("Bundle built.");
	} catch (e) {
		console.error(e);
		process.exit(1);
	}
}

buildAll();
