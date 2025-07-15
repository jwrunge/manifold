import $ from "../dist/manifold.es.js";

console.log("=== Detailed Debug: Tracing Effect Executions ===");

const myState = $.watch({ name: "Jake", age: 38 });

let storeUpdateCount = 0;
let nameUpdateCount = 0;
let ageUpdateCount = 0;

// Add detailed logging to see exactly when each effect runs
myState.effect(() => {
	console.log(
		`  🏪 Store effect running (count will be ${storeUpdateCount + 1})`
	);
	console.log(`     - myState.value:`, myState.value);
	storeUpdateCount++;
});

myState.effect(() => {
	console.log(
		`  👤 Name effect running (count will be ${nameUpdateCount + 1})`
	);
	console.log(`     - myState.value.name:`, myState.value.name);
	nameUpdateCount++;
});

myState.effect(() => {
	console.log(
		`  🎂 Age effect running (count will be ${ageUpdateCount + 1})`
	);
	console.log(`     - myState.value.age:`, myState.value.age);
	ageUpdateCount++;
});

console.log("\n=== Initial Setup Complete ===");
console.log(
	`Counts: store=${storeUpdateCount}, name=${nameUpdateCount}, age=${ageUpdateCount}`
);

console.log("\n=== 🔄 Setting myState.value.age = 39 ===");
myState.value.age = 39;

console.log("\n=== Final Result ===");
console.log(
	`Counts: store=${storeUpdateCount}, name=${nameUpdateCount}, age=${ageUpdateCount}`
);
console.log(`Expected for test: store=5->6, name=5->5, age=5->6`);
