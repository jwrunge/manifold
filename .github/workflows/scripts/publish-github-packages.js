#!/usr/bin/env node
const fs = require("node:fs");

const pkg = require("../../package.json");

const owner = process.env.GITHUB_REPOSITORY_OWNER;
if (!owner) {
	console.error(
		"GITHUB_REPOSITORY_OWNER is not set. Cannot modify package.json for GitHub Packages.",
	);
	process.exit(1);
}

pkg.name = `@${owner}/manifold`;
pkg.publishConfig = {
	registry: "https://npm.pkg.github.com",
	[`@${owner}:registry`]: "https://npm.pkg.github.com",
};

fs.writeFileSync("package.json", JSON.stringify(pkg, null, 2));
console.log("Modified package.json for GitHub Packages");

// EOF (no-op)
