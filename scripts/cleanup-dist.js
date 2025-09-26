import { readdirSync, statSync, unlinkSync } from "node:fs";
import { join } from "node:path";

const dist = new URL("../dist", import.meta.url);
const dir = dist.pathname;

// Keep these files in dist (rollup outputs)
const keep = new Set(["manifold.d.ts", "manifold.d.ts.map"]);

function walkAndClean(p) {
	for (const name of readdirSync(p)) {
		const full = join(p, name);
		try {
			const st = statSync(full);
			if (st.isDirectory()) {
				walkAndClean(full);
				continue;
			}
			if (
				(name.endsWith(".d.ts") || name.endsWith(".d.ts.map")) &&
				!keep.has(name)
			) {
				try {
					unlinkSync(full);
					console.log("removed", full);
				} catch (_e) {
					console.error("failed to remove", full);
				}
			}
		} catch (_e) {
			// ignore
		}
	}
}

walkAndClean(dir);
// After removing files, remove any empty directories under dist
function removeEmptyDirs(p) {
	for (const name of readdirSync(p)) {
		const full = join(p, name);
		try {
			const st = statSync(full);
			if (st.isDirectory()) {
				removeEmptyDirs(full);
				const children = readdirSync(full);
				if (children.length === 0) {
					try {
						// remove empty directory
						// Using rmdirSync is fine for empty dirs
						// eslint-disable-next-line node/no-deprecated-api
						import("node:fs").then((fs) => fs.rmdirSync(full));
						console.log("removed empty dir", full);
					} catch (_e) {
						// ignore
					}
				}
			}
		} catch (_e) {
			// ignore
		}
	}
}

removeEmptyDirs(dir);
console.log("cleanup-dist: done");
