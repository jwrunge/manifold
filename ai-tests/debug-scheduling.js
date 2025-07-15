import $ from "../dist/manifold.es.js";

console.log("=== Testing Effect Scheduling ===");

const myState = $.watch({ name: "Mary", age: 38 });

let storeUpdateCount = 0;
let ageUpdateCount = 0;

// Store effect - accesses the whole value
myState.effect(() => {
	const value = myState.value;
	storeUpdateCount++;
	console.log(
		`Store effect: ${JSON.stringify(value)}, count: ${storeUpdateCount}`
	);

	// Exit early if we detect infinite loop
	if (storeUpdateCount > 5) {
		console.log("Store effect: Detected potential infinite loop, stopping");
		return;
	}
});

// Age effect - accesses just the age property
myState.effect(() => {
	const age = myState.value.age;
	ageUpdateCount++;
	console.log(`Age effect: ${age}, count: ${ageUpdateCount}`);

	// Exit early if we detect infinite loop
	if (ageUpdateCount > 5) {
		console.log("Age effect: Detected potential infinite loop, stopping");
		return;
	}
});

console.log("\n=== Before direct property change ===");
console.log(`Store count: ${storeUpdateCount}, Age count: ${ageUpdateCount}`);

console.log("\n=== Changing property directly ===");
myState.value.age = 39;

console.log("\n=== After property change ===");
console.log(`Store count: ${storeUpdateCount}, Age count: ${ageUpdateCount}`);
