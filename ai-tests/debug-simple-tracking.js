import $ from "../dist/manifold.es.js";

console.log("=== Debug: Tracking Issues ===");

const myState = $.watch({ name: "Jake", age: 37 });

console.log("=== Setting up age effect ===");
let ageEffectCount = 0;
myState.effect(() => {
	console.log(`  📊 Age effect running (${++ageEffectCount})`);
	const age = myState.value.age;
	console.log(`    - Accessed age: ${age}`);
});

console.log("\n=== Changing state value once ===");
myState.value = { name: "Mary", age: 38 };

console.log("\n=== Attempting direct property change ===");
console.log("Before: myState.value.age =", myState.value.age);
myState.value.age = 39;
console.log("After: myState.value.age =", myState.value.age);

console.log(`\nTotal age effect runs: ${ageEffectCount}`);
