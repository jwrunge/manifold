function hashStr(input) {
    console.log(`Hashing string. Length: ${input.length}`)
    let hash = 0;
    const enc = new TextEncoder().encode(input);
    for(let char of enc) {
      hash = ((hash << 5) - hash) + char;
      hash &= 0xFFFF; // Convert to usize int
    }
    return hash;
}

function hashAny(input) {
  if(!input) return 0;
  if(!isNaN(input)) return input;
  if(typeof input == "string") {
    console.log("Parsing string");
    return hashStr(input);
  }
  else if(typeof input !== "object") {
    console.log("Parsing non-string");
    return hashStr(input.toString());
  }

  let toHash;
  if(Array.isArray(input)) {
    toHash = input;
  }
  else if(input instanceof Map) {
    toHash = Array.from(input.entries());
  }
  else if(input instanceof Set) {
    toHash = Array.from(input);
  }
  else {
    console.log("Returning date.now")
    return Date.now();
  }
  console.log("Hashing array")
  return hashStr(JSON.stringify(toHash));
}

function randomString() {
  const bank = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ012346789";
  let random = '';
  for(let i = 0; i < 300; i++){
      random += bank[parseInt(Math.random()*bank.length)];
  }
  return random;
}

function randomInt() {
  return Math.floor(Math.random() * Number.MAX_SAFE_INTEGER);
}

function createLargeArray(size, type) {
  let t = performance.now();
  let arr = [];
  for(let i = 0; i < size; i++) {
    let value = type == "string" ? randomString() : randomInt();
    arr.push(value);
  }
  console.log(`Array of ${size} ${type}s created in ${performance.now() - t}ms`);
  return arr;
}

function createLargeMap(size, type) {
  let t = performance.now();
  let map = new Map();
  for(let i = 0; i < size; i++) {
    let value = type == "string" ? randomString() : randomInt();
    map.set(i, value);
  }
  console.log(`Map of ${size} ${type}s created in ${performance.now() - t}ms`);
  return map;
}

const arrNum = 100000;

const fs = require('fs');
const testFile = fs.readFileSync("tests/testHash.json", "utf8");
const testJSON = JSON.parse(testFile);

console.log("STRING:");
let t = performance.now();
let hash = hashAny("This is just a regular string. It may be a little long-ish, but it's not too bad.");
console.log(`HASH: ${hash}, time: ${performance.now() - t}`);

console.log("\nSTRING dup:");
t = performance.now();
hash = hashAny("This is just a regular string. It may be a little long-ish, but it's not too bad.");
console.log(`HASH: ${hash}, time: ${performance.now() - t}`);

console.log("\nNUMBER:");
t = performance.now();
hash = hashAny(1234567);
console.log(`HASH: ${hash}, time: ${performance.now() - t}`);

console.log("\nNUMBER dup:");
t = performance.now();
hash = hashAny(1234567);
console.log(`HASH: ${hash}, time: ${performance.now() - t}`);

console.log("\nJSON STRING (~10MB)");
t = performance.now();
hash = hashAny(testFile);
console.log(`HASH: ${hash}, time: ${performance.now() - t}`);

console.log("\nJSON STRING dup (~10MB)");
t = performance.now();
hash = hashAny(testFile);
console.log(`HASH: ${hash}, time: ${performance.now() - t}`);

console.log("\nJS OBJECT (from ~10MB string)");
t = performance.now();
hash = hashAny(testJSON);
console.log(`HASH: ${hash}, time: ${performance.now() - t}`);

console.log(`\nARRAY of 300-CHAR STRINGS (x${arrNum})`);
let arr = createLargeArray(arrNum, "string");
t = performance.now();
hash = hashAny(arr);
console.log(`HASH: ${hash}, time: ${performance.now() - t}`);

console.log(`\nARRAY of INTS (x${arrNum})`);
arr = createLargeArray(arrNum, "int");
t = performance.now();
hash = hashAny(arr);
console.log(`HASH: ${hash}, time: ${performance.now() - t}`);

console.log(`\nMAP of 300-CHAR STRINGS (x${arrNum})`);
let map = createLargeMap(arrNum, "string");
t = performance.now();
hash = hashAny(map);
console.log(`HASH: ${hash}, time: ${performance.now() - t}`);

console.log(`\nMAP of INTS (x${arrNum})`);
map = createLargeMap(arrNum, "int");
t = performance.now();
hash = hashAny(map);
console.log(`HASH: ${hash}, time: ${performance.now() - t}`);