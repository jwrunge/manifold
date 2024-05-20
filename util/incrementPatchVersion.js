//@ts-nocheck
import fs from 'fs';

console.log("Incrementing package version...")

// Get last published version
let lastVersion;
try {
    const file_str = fs.readFileSync('./util/lastPublish.txt', 'utf8');
    lastVersion = file_str.trim();
    if(!lastVersion) {
        lastVersion = "0.0.0";
        fs.writeFileSync('./util/lastPublish.txt', lastVersion, 'utf8');
        console.log("No last version found. Setting to 0.0.0");
        process.exit(0);
    }
    else {
        lastVersion = lastVersion.split('.').map(v => parseInt(v));
    }
}
catch(err) {
    console.log("Error reading lastPublish.txt", err);
}

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
    if(i == 2) {
        return parseInt(v) + 1;
    }
    return v;
}).join(".");

//Save package.json
try {
    fs.writeFileSync('./util/lastPublish.txt', pkg.version, 'utf8');
    fs.writeFileSync('./package.json', JSON.stringify(pkg, null, 4), 'utf8');
}
catch(err) {
    console.log("Error writing package.json", err);
}
