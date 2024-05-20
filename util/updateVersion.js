//@ts-nocheck
import fs from 'fs';

console.log("Updating package version...")

let pkg;
try {
    const file_str = fs.readFileSync('./package.json', 'utf8');
    pkg = JSON.parse(file_str);
}
catch(err) {
    console.log("Error reading package.json", err);
}

//Get version from CLI params
const version = process.argv[2];
if(version) {
    //Make sure provided version is higher than current version
    const currentVersion = pkg.version?.split?.('.').map(v => parseInt(v));
    const newVersion = version.split('.').map(v => parseInt(v));

    let noUpdate = true;
    for(let i=2; i >= 0; i--) {
        if(newVersion[i] > currentVersion[i]) {
            noUpdate = false;
            break;
        }
    }

    if(noUpdate) {
        console.log("Provided version is not higher than current version. Aborting.");
        process.exit(1);
    }

    pkg.version = version;
}
else {
    console.log("No version provided. Aborting.");
    process.exit(1);
}

//Save package.json
try {
    fs.writeFileSync('./util/lastPublish.txt', pkg.version + ".dev", 'utf8');
    fs.writeFileSync('./package.json', JSON.stringify(pkg, null, 4), 'utf8');
}
catch(err) {
    console.log("Error writing package.json", err);
}
