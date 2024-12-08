import { defineConfig } from "vite";

export default defineConfig({
  build: {
    minify: "terser",
    terserOptions: {
      mangle: {
        eval: true,
        module: true,
        properties: {
          regex: /^[#_].*/,
        },
      },
      compress: {
        drop_console: true,
        dead_code: true,
        unused: true,
        collapse_vars: true,
      },
    },
    lib: {
      entry: "src/index.ts",
      name: "Manifold",
      fileName: (format) => `manifold.${format}.js`,
    },
  },
});
