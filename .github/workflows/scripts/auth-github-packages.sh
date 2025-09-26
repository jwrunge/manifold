#!/usr/bin/env bash
set -euo pipefail

# Safe auth helper for GitHub Packages. Accepts env vars and writes to ~/.npmrc.
# Guards against unbound variables when invoked in shells with strict mode.
:
# Ensure required variables are available; provide helpful errors otherwise
if [ -z "${GITHUB_REPOSITORY_OWNER-}" ]; then
	echo "GITHUB_REPOSITORY_OWNER is not set. Exiting." >&2
	exit 1
fi

if [ -z "${GITHUB_TOKEN-}" ]; then
	echo "GITHUB_TOKEN is not set. Exiting." >&2
	exit 1
fi

echo "@${GITHUB_REPOSITORY_OWNER}:registry=https://npm.pkg.github.com" >> ~/.npmrc
echo "//npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}" >> ~/.npmrc

# EOF (no-op)
