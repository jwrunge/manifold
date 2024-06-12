import terser from '@rollup/plugin-terser';

/** @type {import('@rollup/plugin-terser').Options} */
const terserOps = {
    ecma: 2015,
    module: true,
    toplevel: true,
    mangle: {
        eval: true,
        module: true,
        reserved: ["store_name", "store_ops", "func_name", "funcs", "new_ops", "profile_name"],
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
            input: prefix?.includes("global") ? "src/index.global.js" : `src/index.js`,
            output: [
                {
                    file: `dist/${prefix ? prefix + "." : ""}mfld.${op.mod === "cjs" ? "cjs" : "js"}`,
                    format: op.mod,
                    name: "Mfld",
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
        { mod: "cjs", sourceMaps: false, jsdocTypes: false },
        { mod: "es", sourceMaps: false, jsdocTypes: false },
        { prefix: "global", mod: "es", sourceMaps: false, jsdocTypes: false },
        { prefix: "dev.global", mod: "es", sourceMaps: true, jsdocTypes: true },
        { prefix: "dev", mod: "cjs", sourceMaps: false, jsdocTypes: true },
        { prefix: "dev", mod: "es", sourceMaps: true, jsdocTypes: true }
    ]),
];
