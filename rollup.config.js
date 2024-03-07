// rollup.config.js
import typescript from '@rollup/plugin-typescript';
import terser from '@rollup/plugin-terser';

function constructProfiles(prefixes, sourceMaps) {
    return prefixes.map((prefix, i)=> { 
        return {
            input: `src/index.ts`,
            output: [
                {
                    file: `dist/${prefix ? prefix + "." : ""}copper.js`,
                    format: 'iife',
                    name: "Cu",
                    sourcemap: sourceMaps[i],
                }
            ],
            plugins: [
                typescript(), 
                terser()
            ],
        }
    });
}

export default constructProfiles(
    ["", "dev"], 
    [false, true]
);
