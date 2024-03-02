// rollup.config.js
import typescript from '@rollup/plugin-typescript';
import terser from '@rollup/plugin-terser';

export default {
    input: `src/index.ts`,
    output: [
        {
            file: `dist/copper.js`,
            format: 'iife',
            name: "Cu",
            sourcemap: true,
        }
    ],
    plugins: [
        typescript(), 
        terser()
    ],
};
