// Debug direct property changes
import $ from "../dist/manifold.es.js";

console.log("=== Debug Direct Property Changes ===");

const myState = $.watch({ name: "Mary", age: 38 });

console.log("Initial state:", myState.value);
console.log("Initial age:", myState.value.age);

console.log("\nSetting myState.value.age = 39");
myState.value.age = 39;

console.log("After setting age to 39:");
console.log("myState.value:", myState.value);
console.log("myState.value.age:", myState.value.age);

// Let's also test the full object check
console.log("\nAdditional checks:");
console.log("Direct access to property:", myState.value.age);
console.log("Does JSON match?", JSON.stringify(myState.value));
