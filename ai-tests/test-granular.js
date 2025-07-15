import $ from "../dist/manifold.es.js";

// Simple test of fine-grained reactivity
const state = $.watch({ name: "Alice", age: 30 });

let nameCount = 0;
let ageCount = 0;

// Track specific properties
state.effect(() => {
	const name = state.value.name;
	nameCount++;
	console.log(`Name effect: ${name}, count: ${nameCount}`);
});

state.effect(() => {
	const age = state.value.age;
	ageCount++;
	console.log(`Age effect: ${age}, count: ${ageCount}`);
});

console.log("\n=== Initial state ===");
console.log(`Name count: ${nameCount}, Age count: ${ageCount}`);

console.log("\n=== Changing age only ===");
state.value.age = 31;

console.log(`Name count: ${nameCount}, Age count: ${ageCount}`);
console.log(`Expected: Name count should be 1, Age count should be 2`);

console.log("\n=== Changing name only ===");
state.value.name = "Bob";

console.log(`Name count: ${nameCount}, Age count: ${ageCount}`);
console.log(`Expected: Name count should be 2, Age count should be 2`);
