import typescript from '@rollup/plugin-typescript';
import terser from '@rollup/plugin-terser';
import dts from "rollup-plugin-dts";

function cleanHiddenProps() {
    return {
        generateBundle(options, bundle) {
            let fname = options.file.replace(/^.*?\//, "");
            const outputFile = bundle[fname];
            const content = outputFile.code;
            const modifiedContent = content.replace(/^\s{0,}_.*?$\n/gm, "");
            outputFile.code = modifiedContent;
        }
    }
}

const input = 'src/index.ts'
const plugins = [
    typescript(),
    terser({
        mangle: {
            eval: true,
            module: true,
            properties: {
                regex: /^[#_].*/
            }
        },
    }),
]

function output(details) {
    return details.map(d=> {
        return {
            file: `dist/${d.prefix?.concat(".") || ""}manifold.js`,
            format: "es",
            name: "Mfld",
            sourcemap: d.sourcemap || false,
        }
    });
}

export default [
    {
        input,
        output: [...output([
            { sourcemap: false },
            { prefix: "dev", sourcemap: true },
        ])],
        plugins
    },
    {
        input: "./dist/types_output/index.d.ts",
        output: [
            {
                file: "dist/manifold.d.ts",
                format: "es",
            },
            {
                file: "dist/dev.manifold.d.ts",
                format: "es",
            },
        ],
        plugins: [ 
            dts(),
            cleanHiddenProps(),
        ]
    }
]