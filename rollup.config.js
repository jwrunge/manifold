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
        //Dev build with sourcemaps
        {
            file: 'dist/copper.dev.iife.js',
            format: 'iife',
            name: "Copper",
            sourcemap: true,
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
