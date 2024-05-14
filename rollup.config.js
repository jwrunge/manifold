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
    let plugins = (op) => {
        let plugins = [ terser({...terserOps, format: { ...terserOps.format, comments: op.jsdocTypes ? "some" : false }}) ];

        if(op.prefix === "typed") {
            plugins.push({
                name: "assemble-dts",
                buildEnd() {
                    for(const id of this.getModuleIds()) {
                        let info = this.getModuleInfo(id);
                        for(let ast of info?.ast?.body || []) {
                            console.log(ast)
                        }
                    }
                }
            })
        }

        return plugins;
    };

    return ops.map((op, i)=> { 
        const { prefix, sourceMaps } = op;
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
            plugins: plugins(op)
        }
    });
}

export default [
    ...constructProfiles([
        { prefix: "", sourceMaps: true, jsdocTypes: false },
        { prefix: "typed", sourceMaps: false, jsdocTypes: true },
        { prefix: "dev", sourceMaps: true, jsdocTypes: true }
    ]),
    {
        input: "src/extras/smartOutro.js",
        output: {
            file: "dist/extras/smartOutro.js",
            format: "iife",
            name: "smartOutro"
        },
        plugins: [ terser(terserOps) ]
    }
];
