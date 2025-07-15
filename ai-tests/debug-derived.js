import $ from "../dist/manifold.es.js";

console.log("=== Testing Derived State Issue ===");

const myState = $.watch({ name: "Jake", age: 37 });
console.log("myState created:", myState.value);

const derivedState = $.watch(() => ({
	name: myState.value.name.toUpperCase(),
	age: myState.value.age + 10,
}));
console.log("derivedState created:", derivedState.value);

let trackedDerivedStateName = null;
console.log("Setting up effect on derivedState...");

derivedState.effect(() => {
	console.log("Effect running, accessing derivedState.value.name");
	trackedDerivedStateName = derivedState.value.name;
	console.log("trackedDerivedStateName set to:", trackedDerivedStateName);
});

console.log("After effect setup:");
console.log("- derivedState.value.name:", derivedState.value.name);
console.log("- trackedDerivedStateName:", trackedDerivedStateName);

console.log("\n=== Changing myState.value completely ===");
myState.value = { name: "Mary", age: 37 };

console.log("After complete change:");
console.log("- myState.value:", myState.value);
console.log("- derivedState.value:", derivedState.value);
console.log("- trackedDerivedStateName:", trackedDerivedStateName);
