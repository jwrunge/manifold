import terser from '@rollup/plugin-terser';
import typescript from '@rollup/plugin-typescript';

function constructProfiles(ops) {
    return ops.map(op=> { 
        const { prefix, sourceMaps } = op;
        return {
            input: prefix?.includes("global") ? "src/index.global.ts" : `src/index.ts`,
            output: [
                {
                    file: `dist/${prefix ? prefix + "." : ""}mfld.js"}`,
                    format: "es",
                    name: "Mfld",
                    sourcemap: sourceMaps,
                }
            ],
            plugins: [
                typescript(),
                terser(),
            ]
        }
    });
}

export default [
    ...constructProfiles([
        { sourceMaps: false },
        { prefix: "global", sourceMaps: false },
        { prefix: "dev.global", sourceMaps: true },
        { prefix: "dev", sourceMaps: true }
    ]),
];
