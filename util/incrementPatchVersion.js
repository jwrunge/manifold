//@ts-nocheck
import fs from 'fs';

console.log("Incrementing package version...")

let pkg;
try {
    const file_str = fs.readFileSync('./package.json', 'utf8');
    pkg = JSON.parse(file_str);
}
catch(err) {
    console.log("Error reading package.json", err);
}

//Increment patch version
pkg.version = pkg.version?.split?.('.')?.map((v, i) => {
    if(i === 2) {
        return parseInt(v) + 1;
    }
    return v;
}).join(".");

//Save package.json
try {
    fs.writeFileSync('./package.json', JSON.stringify(pkg, null, 4), 'utf8');
}
catch(err) {
    console.log("Error writing package.json", err);
}
