import * as fs from 'fs';
import { exec } from 'child_process';

let devFile = "./dist/dev.copper.js";

console.log("Generating .d.ts file for", devFile);

//Run .d.ts generator
for(let devFile of ["./dist/dev.copper.js"]) {
    let newFile = devFile.replace("dev.", "");
    exec(`npx -p typescript tsc ${devFile} --declaration --allowJs --emitDeclarationOnly --outFile ${newFile.replace("js", "d.ts")}`, (error, _, stderr) => {
        if (error) {
            console.log(`Error: ${error.message}`);
            return;
        }
        if (stderr) {
            console.log(`Stderr: ${stderr}`);
            return;
        }

        // Read the .d.ts file
        fs.readFile(`${newFile.replace("js", "d.ts")}`, 'utf8', function (err, data) {
            if (err) {
                return console.log(err);
            }

            // Replace the module name for each subpath
            for(let subpath of ["", "dev", "es", "cjs"]) {
                let result = data.replace(`declare module "dev.copper" {`, `declare module "@jwrunge/copper${subpath ? "/" + subpath : ""}" {`);
                fs.writeFile(`${newFile.replace("js", `${subpath ? subpath + "." : ""}d.ts`)}`, result, 'utf8', function (err) {
                    if (err) return console.log(err);
                });
            }
        });
    });
}