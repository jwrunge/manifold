#!/usr/bin/env node
const fs = require("fs");

const pkg = require("../../package.json");
pkg.name = `@${process.env.GITHUB_REPOSITORY_OWNER}/manifold`;
pkg.publishConfig = {
	registry: "https://npm.pkg.github.com",
	[`@${process.env.GITHUB_REPOSITORY_OWNER}:registry`]:
		"https://npm.pkg.github.com",
};

fs.writeFileSync("package.json", JSON.stringify(pkg, null, 2));
console.log("Modified package.json for GitHub Packages");
