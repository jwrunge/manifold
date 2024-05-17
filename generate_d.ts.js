import * as fs from 'fs';
import { exec } from 'child_process';

let typedFile = "./dist/typed.copper.js";

console.log("Generating .d.ts file for", typedFile);

//Run .d.ts generator
exec(`npx -p typescript tsc ${typedFile} --declaration --allowJs --emitDeclarationOnly --outFile ${typedFile.replace(".js", ".d.ts")}`, (error, _, stderr) => {
    if (error) {
        console.log(`Error: ${error.message}`);
        return;
    }
    if (stderr) {
        console.log(`Stderr: ${stderr}`);
        return;
    }

    // Read the .d.ts file
    fs.readFile(`${typedFile.replace(".js", ".d.ts")}`, 'utf8', function (err, data) {
        if (err) {
            return console.log(err);
        }
        let result = data.replace(`declare module "typed.copper" {`, `declare module "@jwrunge/copper" {`);
        fs.writeFile(`${typedFile.replace(".js", ".d.ts")}`, result, 'utf8', function (err) {
            if (err) return console.log(err);
        });
    });
});