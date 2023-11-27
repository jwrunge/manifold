// rollup.config.js
import typescript from '@rollup/plugin-typescript';
import terser from '@rollup/plugin-terser';

const variants = ["client", "http", "unified"];
function assembleIo() {
    let cfg = [];
    for(let variant of variants) {
        cfg.push({
            input: `src/index.${variant}.ts`,
            output: [
                {
                    file: `dist/${variant}/copper.iife.js`,
                    format: 'iife',
                    name: "Copper",
                },
                {
                    file: `dist/${variant}/copper.esm.js`,
                    format: 'esm',
                },
                //Dev builds with sourcemaps
                {
                    file: `dist/${variant}/copper.dev.iife.js`,
                    format: 'iife',
                    name: "Copper",
                    sourcemap: true,
                },
                {
                    file: `dist/${variant}/copper.dev.esm.js`,
                    format: 'esm',
                }
            ],
            plugins: [
                typescript(), 
                terser()
            ]
        })
    }

    return cfg;
}

export default [
    ...assembleIo()
];
