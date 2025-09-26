/// <reference lib="dom" />
/// <reference lib="es2015.iterable" />

// This file forces the DOM and iterable libs into TypeScript type-checking for
// environments (like some JSR/deno builds) that might not pick up
// `tsconfig.json` correctly. It is intentionally minimal and only used to
// provide DOM and iterator types during release.
