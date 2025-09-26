#!/usr/bin/env bash
set -euo pipefail

echo "@${GITHUB_REPOSITORY_OWNER}:registry=https://npm.pkg.github.com" >> ~/.npmrc
echo "//npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}" >> ~/.npmrc
