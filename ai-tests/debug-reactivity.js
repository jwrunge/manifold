// Debug script to understand reactivity behavior
import $ from "../dist/manifold.es.js";

console.log("=== Testing Fine-Grained Reactivity ===");

const myState = $.watch({ name: "Jake", age: 37 });

let nameUpdateCount = 0;
let ageUpdateCount = 0;

// Effect that only reads name
myState.effect(() => {
	console.log(`Name effect triggered: ${myState.value.name}`);
	nameUpdateCount++;
});

// Effect that only reads age
myState.effect(() => {
	console.log(`Age effect triggered: ${myState.value.age}`);
	ageUpdateCount++;
});

console.log(
	`Initial counts - Name: ${nameUpdateCount}, Age: ${ageUpdateCount}`
);

// Change only age - should only trigger age effect
console.log("\n=== Changing only age (37 -> 38) ===");
myState.value.age = 38;
console.log(
	`After age change - Name: ${nameUpdateCount}, Age: ${ageUpdateCount}`
);

// Change only name - should only trigger name effect
console.log("\n=== Changing only name (Jake -> Mary) ===");
myState.value.name = "Mary";
console.log(
	`After name change - Name: ${nameUpdateCount}, Age: ${ageUpdateCount}`
);

// Change both by replacing entire object
console.log("\n=== Replacing entire object ===");
myState.value = { name: "Bob", age: 40 };
console.log(
	`After object replace - Name: ${nameUpdateCount}, Age: ${ageUpdateCount}`
);
