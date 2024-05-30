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
        const { prefix, suffix, sourceMaps } = op;
        return {
            input: `src/index.${op.module ? "module" : "tag"}.js`,
            output: [
                {
                    file: `dist/${op.subfolder ? op.subfolder + "/" : ""}${prefix ? prefix + "." : ""}mfld${suffix ? "." + suffix : ""}${op.module ? op.mod === "es" ? ".js" : "." + op.mod : ".js"}`,
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
        { mod: "es", sourceMaps: false, jsdocTypes: true },
        { suffix: "slim", mod: "es", sourceMaps: false, jsdocTypes: false },
        { prefix: "slim", suffix: "mod", mod: "cjs", module: true, sourceMaps: false, jsdocTypes: false },
        { prefix: "slim", suffix: "mod", mod: "es", module: true, sourceMaps: false, jsdocTypes: false },
        { subfolder: "dev", suffix: "mod", mod: "cjs", module: true, sourceMaps: false, jsdocTypes: true },
        { subfolder: "dev", suffix: "mod", mod: "es", module: true, sourceMaps: true, jsdocTypes: true }
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
