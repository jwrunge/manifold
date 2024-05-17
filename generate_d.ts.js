import * as fs from 'fs';
import { exec } from 'child_process';

let devFile = "./dist/dev.copper.js";

console.log("Generating .d.ts file for", devFile);

//Run .d.ts generator
exec(`npx -p typescript tsc ${devFile} --declaration --allowJs --emitDeclarationOnly --outFile ${devFile.replace(".js", ".d.ts")}`, (error, _, stderr) => {
    if (error) {
        console.log(`Error: ${error.message}`);
        return;
    }
    if (stderr) {
        console.log(`Stderr: ${stderr}`);
        return;
    }

    // Read the .d.ts file
    fs.readFile(`${devFile.replace(".js", ".d.ts")}`, 'utf8', function (err, data) {
        if (err) {
            return console.log(err);
        }
        let result = data.replace(`declare module "dev.copper" {`, `declare module "@jwrunge/copper" {`);
        fs.writeFile(`${devFile.replace(".js", ".d.ts")}`, result, 'utf8', function (err) {
            if (err) return console.log(err);
        });
    });
});