import $ from "../dist/manifold.es.js";

console.log("=== Debug: Which Effects Are In Which Sets ===");

const myState = $.watch({ name: "Jake", age: 38 });

let storeEffect, nameEffect, ageEffect;

storeEffect = myState.effect(() => {
	console.log(`  🏪 Store effect: myState.value =`, myState.value);
});

nameEffect = myState.effect(() => {
	console.log(`  👤 Name effect: myState.value.name =`, myState.value.name);
});

ageEffect = myState.effect(() => {
	console.log(`  🎂 Age effect: myState.value.age =`, myState.value.age);
});

// Access private state to examine effect tracking
// (This is just for debugging - we'll remove this)
console.log("\n=== Effect Tracking Analysis ===");
console.log("This is internal debugging to understand the effect tracking");

console.log("\n=== Setting myState.value.age = 39 ===");
myState.value.age = 39;
