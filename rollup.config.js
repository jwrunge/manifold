// rollup.config.js
import terser from '@rollup/plugin-terser';

function constructProfiles(prefixes, sourceMaps) {
    return prefixes.map((prefix, i)=> { 
        return {
            input: `src/index.js`,
            output: [
                {
                    file: `dist/${prefix ? prefix + "." : ""}copper.js`,
                    format: 'iife',
                    name: "Cu",
                    sourcemap: sourceMaps[i],
                }
            ],
            plugins: [
                terser()
            ],
        }
    });
}

export default constructProfiles(
    ["", "dev"], 
    [false, true]
);
