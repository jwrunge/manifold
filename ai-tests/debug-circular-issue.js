// Import the built library
import $ from "../dist/manifold.es.js";

console.log("=== Reproducing Actual Issue ===");

// Create a state like the failing test
const myState = $.watch({ name: "Mary", age: 38 });

let storeUpdateCount = 0;
let ageUpdateCount = 0;

// Store effect - accesses the whole value
myState.effect(() => {
	const value = myState.value; // This accesses the whole object
	storeUpdateCount++;
	console.log(
		`Store effect: ${JSON.stringify(value)}, count: ${storeUpdateCount}`
	);
});

// Age effect - accesses just the age property
myState.effect(() => {
	const age = myState.value.age; // This accesses .value then .age
	ageUpdateCount++;
	console.log(`Age effect: ${age}, count: ${ageUpdateCount}`);

	// Safety valve
	if (ageUpdateCount > 10) {
		console.log("Stopping age effect to prevent infinite loop");
		return;
	}
});

console.log("\n=== Before direct property change ===");
console.log(`Store count: ${storeUpdateCount}, Age count: ${ageUpdateCount}`);

console.log("\n=== Changing property directly ===");
myState.value.age = 39;

console.log("\n=== After property change ===");
console.log(`Store count: ${storeUpdateCount}, Age count: ${ageUpdateCount}`);
