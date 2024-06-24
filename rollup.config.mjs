import typescript from '@rollup/plugin-typescript';
import terser from '@rollup/plugin-terser';
import dts from "rollup-plugin-dts";

const input = 'src/index.ts';
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
            { prefix: "", sourcemap: false },
            { prefix: "dev", sourcemap: true },
        ])],
        plugins
    },
    {
        input: "./dist/types/index.d.ts",
        output: {
            file: "dist/mfld.d.ts",
            format: "es",
            plugins: [ dts() ]
        }
    }
]