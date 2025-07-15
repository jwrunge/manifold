import $ from "../dist/manifold.es.js";

console.log("=== Testing the exact scenario from failing test ===");

const myState = $.watch({ name: "Jake", age: 38 });

let trackedStateValue = null;
let trackedStateName = null;
let trackedStateAge = null;

let storeUpdateCount = 0;
let nameUpdateCount = 0;
let ageUpdateCount = 0;

// Set up effects exactly like the test
myState.effect(() => {
	trackedStateValue = myState.value;
	storeUpdateCount++;
	console.log(
		`Store effect triggered, count: ${storeUpdateCount}, value:`,
		trackedStateValue
	);
});

myState.effect(() => {
	trackedStateName = myState.value.name;
	nameUpdateCount++;
	console.log(
		`Name effect triggered, count: ${nameUpdateCount}, name: ${trackedStateName}`
	);
});

myState.effect(() => {
	trackedStateAge = myState.value.age;
	ageUpdateCount++;
	console.log(
		`Age effect triggered, count: ${ageUpdateCount}, age: ${trackedStateAge}`
	);
});

console.log("\n=== After initial setup ===");
console.log("trackedStateValue:", trackedStateValue);
console.log("trackedStateName:", trackedStateName);
console.log("trackedStateAge:", trackedStateAge);

console.log("\n=== Setting myState.value.age = 39 ===");
myState.value.age = 39;

console.log("\n=== After setting age to 39 ===");
console.log("myState.value.age:", myState.value.age);
console.log("trackedStateValue:", trackedStateValue);
console.log("trackedStateName:", trackedStateName);
console.log("trackedStateAge:", trackedStateAge);
console.log(
	"Counts - store:",
	storeUpdateCount,
	"name:",
	nameUpdateCount,
	"age:",
	ageUpdateCount
);
