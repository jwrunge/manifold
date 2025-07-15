import $ from "../dist/manifold.es.js";

console.log("=== Replicating Exact Test Scenario ===");

const myState = $.watch({ name: "Jake", age: 37 });

let trackedStateValue = null;
let trackedStateName = null;
let trackedStateAge = null;

let storeUpdateCount = 0;
let nameUpdateCount = 0;
let ageUpdateCount = 0;

myState.effect(() => {
	trackedStateValue = myState.value;
	storeUpdateCount++;
	console.log(
		`Store effect ${storeUpdateCount}: ${JSON.stringify(trackedStateValue)}`
	);
});

myState.effect(() => {
	trackedStateName = myState.value.name;
	nameUpdateCount++;
	console.log(`Name effect ${nameUpdateCount}: ${trackedStateName}`);
});

myState.effect(() => {
	trackedStateAge = myState.value.age;
	ageUpdateCount++;
	console.log(`Age effect ${ageUpdateCount}: ${trackedStateAge}`);
});

console.log("\n=== Running loop from test ===");

const testValues = [
	{ name: "Jake", age: 38 },
	{ name: "Jake", age: 39 },
	{ name: "Mary", age: 37 },
	{ name: "Mary", age: 37 },
	{ name: "Mary", age: 38 },
];

for (const i of testValues) {
	console.log(`\n--- Setting myState.value = ${JSON.stringify(i)} ---`);
	myState.value = i;
	console.log(
		`Result: name=${trackedStateName}, age=${trackedStateAge}, expected: name=${i.name}, age=${i.age}`
	);
	console.log(
		`Match: name=${trackedStateName === i.name}, age=${
			trackedStateAge === i.age
		}`
	);
}

console.log(
	`\n=== After loop: store=${storeUpdateCount}, name=${nameUpdateCount}, age=${ageUpdateCount} ===`
);

console.log(`\n--- Setting myState.value.age = 39 ---`);
myState.value.age = 39;

console.log(
	`\n=== Final: store=${storeUpdateCount}, name=${nameUpdateCount}, age=${ageUpdateCount} ===`
);
console.log(`Expected: store=5, name=5 (should be 2), age=6`);
console.log(`trackedStateAge = ${trackedStateAge} (should be 39)`);
