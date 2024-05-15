// rollup.config.js
import terser from '@rollup/plugin-terser';

/** @type {import('@rollup/plugin-terser').Options} */
const terserOps = {
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
        ecma: 2015,
        semicolons: false,
    }
} 

function constructProfiles(ops) {
    return ops.map((op, i)=> { 
        const { prefix, sourceMaps } = op;
        return {
            input: `src/index.js`,
            output: [
                {
                    file: `dist/${prefix ? prefix + "." : ""}copper.js`,
                    format: 'es',
                    name: "Cu",
                    sourcemap: sourceMaps,
                }
            ],
            plugins: [
                terser({
                    ...terserOps, 
                    format: { 
                        ...terserOps.format, 
                        comments: op.jsdocTypes ? "some" : false 
                    }
                }) 
            ]
        }
    });
}

export default [
    ...constructProfiles([
        { prefix: "", sourceMaps: false, jsdocTypes: true },
        { prefix: "slim", sourceMaps: false, jsdocTypes: false },
        { prefix: "dev", sourceMaps: true, jsdocTypes: true }
    ]),
    {
        input: "src/extras/smartOutro.js",
        output: {
            file: "dist/extras/smartOutro.js",
            format: "es",
            name: "smartOutro"
        },
        plugins: [ terser(terserOps) ]
    }
];
