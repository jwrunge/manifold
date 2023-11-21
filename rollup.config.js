// rollup.config.js
import typescript from '@rollup/plugin-typescript';
import terser from '@rollup/plugin-terser';

export default {
    input: 'src/index.ts',
    output: [
        {
            file: 'dist/copper.iife.js',
            format: 'iife',
            name: "Copper",
        },
        {
            file: 'dist/copper.dev.iife.js',
            format: 'iife',
            name: "Copper",
            sourcemap: "inline",
        },
        {
            file: 'dist/copper.esm.js',
            format: 'esm',
        },
    ],
    plugins: [
        typescript(), 
        terser()
    ]
};
