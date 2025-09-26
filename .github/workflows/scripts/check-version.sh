#!/usr/bin/env bash
set -euo pipefail

PACKAGE_VERSION=$(node -p "require('./package.json').version")
echo "Current version: $PACKAGE_VERSION"
if [ -n "${GITHUB_OUTPUT-}" ]; then
  echo "version=$PACKAGE_VERSION" >> "$GITHUB_OUTPUT"
else
  echo "version=$PACKAGE_VERSION"
fi

# Check if this version exists on npm
if npm view mfld@"$PACKAGE_VERSION" version 2>/dev/null; then
  echo "Version $PACKAGE_VERSION already exists on npm"
  if [ -n "${GITHUB_OUTPUT-}" ]; then
    echo "should_publish_npm=false" >> "$GITHUB_OUTPUT"
  else
    echo "should_publish_npm=false"
  fi
else
  echo "Version $PACKAGE_VERSION does not exist on npm, proceeding with publish"
  if [ -n "${GITHUB_OUTPUT-}" ]; then
    echo "should_publish_npm=true" >> "$GITHUB_OUTPUT"
  else
    echo "should_publish_npm=true"
  fi
fi
