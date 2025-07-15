// Test fine-grained reactivity specifically
import $ from "../dist/manifold.es.js";

console.log("=== Testing Fine-Grained Reactivity Specifically ===");

const myState = $.watch({ name: "Jake", age: 37 });

let nameUpdateCount = 0;
let ageUpdateCount = 0;

// Effect that only reads name
myState.effect(() => {
	const name = myState.value.name;
	console.log(`Name effect triggered: ${name}`);
	nameUpdateCount++;
});

// Effect that only reads age
myState.effect(() => {
	const age = myState.value.age;
	console.log(`Age effect triggered: ${age}`);
	ageUpdateCount++;
});

console.log(
	`Initial counts - Name: ${nameUpdateCount}, Age: ${ageUpdateCount}`
);

// Test 1: Change only age by direct property access
console.log("\n=== Test 1: Direct property change (age only) ===");
myState.value.age = 40;
console.log(
	`After direct age change - Name: ${nameUpdateCount}, Age: ${ageUpdateCount}`
);

// Test 2: Change only name by direct property access
console.log("\n=== Test 2: Direct property change (name only) ===");
myState.value.name = "Mary";
console.log(
	`After direct name change - Name: ${nameUpdateCount}, Age: ${ageUpdateCount}`
);
