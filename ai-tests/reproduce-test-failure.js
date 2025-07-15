// Reproduce the exact failing test scenario
import $ from "../dist/manifold.es.js";

console.log("=== Reproducing Test Failure ===");

const myState = $.watch({ name: "Jake", age: 37 });

let trackedStateValue = null;
let trackedStateName = null;
let trackedStateAge = null;

let storeUpdateCount = 0;
let nameUpdateCount = 0;
let ageUpdateCount = 0;

// These are the exact effects from the test
myState.effect(() => {
	trackedStateValue = myState.value;
	storeUpdateCount++;
	console.log(
		`Store effect: ${JSON.stringify(
			trackedStateValue
		)}, count: ${storeUpdateCount}`
	);
});

myState.effect(() => {
	trackedStateName = myState.value.name;
	nameUpdateCount++;
	console.log(`Name effect: ${trackedStateName}, count: ${nameUpdateCount}`);
});

myState.effect(() => {
	trackedStateAge = myState.value.age;
	ageUpdateCount++;
	console.log(`Age effect: ${trackedStateAge}, count: ${ageUpdateCount}`);
});

// Run through the test data like the test does
const testData = [
	{ name: "Jake", age: 38 },
	{ name: "Jake", age: 39 },
	{ name: "Mary", age: 37 },
	{ name: "Mary", age: 37 },
	{ name: "Mary", age: 38 },
];

console.log("\n=== Processing test data ===");
testData.forEach((data, index) => {
	console.log(`\nStep ${index + 1}: Setting to ${JSON.stringify(data)}`);
	myState.value = data;
});

console.log("\n=== Before direct property change ===");
console.log(`trackedStateValue: ${JSON.stringify(trackedStateValue)}`);
console.log(`trackedStateAge: ${trackedStateAge}`);
console.log(`Counts - Store: ${storeUpdateCount}, Age: ${ageUpdateCount}`);

// This is the line that fails in the test
console.log("\n=== Direct property change ===");
myState.value.age = 39;

console.log("\n=== After direct property change ===");
console.log(`myState.value.age: ${myState.value.age}`);
console.log(`trackedStateValue: ${JSON.stringify(trackedStateValue)}`);
console.log(`trackedStateAge: ${trackedStateAge}`);
console.log(`Counts - Store: ${storeUpdateCount}, Age: ${ageUpdateCount}`);

// Check what the test expects
console.log("\n=== Test Expectations ===");
console.log(`myState.value.age should be 39: ${myState.value.age === 39}`);
console.log(
	`trackedStateValue should be {name: "Mary", age: 39}: ${
		JSON.stringify(trackedStateValue) ===
		JSON.stringify({ name: "Mary", age: 39 })
	}`
);
console.log(`trackedStateAge should be 39: ${trackedStateAge === 39}`);
console.log(`storeUpdateCount should be 5: ${storeUpdateCount === 5}`);
console.log(`ageUpdateCount should be 6: ${ageUpdateCount === 6}`);
