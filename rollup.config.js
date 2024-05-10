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
                terser({
                    ecma: 2015,
                    module: true,
                    toplevel: true,
                    mangle: {
                        eval: true,
                        module: true,
                        properties: {
                            regex: /^[#_].*/
                        }
                    },
                    format: {
                        comments: "some",
                        ecma: 2015,
                        semicolons: false,
                    }
                })
            ],
        }
    });
}

export default constructProfiles(
    ["", "dev"], 
    [false, true]
);
