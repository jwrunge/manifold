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
        reserved: ["store_name", "store_ops"],
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
    return ops.map(op=> { 
        const { prefix, sourceMaps } = op;
        return {
            input: `src/index.${op.mod}.mjs`,
            output: [
                {
                    file: `dist/${prefix ? prefix + "." : ""}copper.${op.mod === "umd" ? "m" : ""}js`,
                    format: ops.mod,
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
        { prefix: "", mod: "es", sourceMaps: false, jsdocTypes: true },
        { prefix: "slim", mod: "umd", sourceMaps: false, jsdocTypes: false },
        { prefix: "dev", mod: "umd", sourceMaps: true, jsdocTypes: true }
    ]),
    {
        input: "src/extras/smartOutro.mjs",
        output: {
            file: "dist/extras/smartOutro.js",
            format: "es",
            name: "smartOutro"
        },
        plugins: [ terser(terserOps) ]
    }
];
