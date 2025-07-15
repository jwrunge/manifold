import $ from "../dist/manifold.es.js";

console.log("=== Derived State Debug ===");

const myState = $.watch({ name: "Jake", age: 37 });
console.log("Initial myState:", myState.value);

const derivedState = $.watch(() => ({
	name: myState.value.name.toUpperCase(),
	age: myState.value.age + 10,
}));

console.log("Initial derivedState:", derivedState.value);

let trackedDerivedStateName = null;
let nameUpdateCount = 0;

// Add effect to track derived state
derivedState.effect(() => {
	trackedDerivedStateName = derivedState.value.name;
	nameUpdateCount++;
	console.log(
		`Effect triggered: trackedDerivedStateName = ${trackedDerivedStateName}, count = ${nameUpdateCount}`
	);
});

console.log(`Initial tracked name: ${trackedDerivedStateName}`);

// Change the base state
console.log("\n--- Changing myState value ---");
myState.value = { name: "Mary", age: 30 };
console.log("After change - myState:", myState.value);
console.log("After change - derivedState:", derivedState.value);
console.log(`Tracked name: ${trackedDerivedStateName}`);

// Try property change
console.log("\n--- Changing myState property ---");
myState.value.age = 25;
console.log("After property change - myState:", myState.value);
console.log("After property change - derivedState:", derivedState.value);
console.log(`Tracked name: ${trackedDerivedStateName}`);
