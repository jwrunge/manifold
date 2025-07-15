import $ from "../dist/manifold.es.js";

console.log("=== Debug: Property Setting After State Change ===");

const myState = $.watch({ name: "Jake", age: 37 });

let ageCount = 0;
myState.effect(() => {
	console.log(`Age effect ${++ageCount}: ${myState.value.age}`);
});

console.log("\n--- Setting myState.value = { name: 'Mary', age: 38 } ---");
myState.value = { name: "Mary", age: 38 };

console.log("\n--- Setting myState.value.age = 39 ---");
myState.value.age = 39;

console.log(`\nFinal ageCount: ${ageCount}`);
console.log(`Current age: ${myState.value.age}`);
