import $ from "../dist/manifold.es.js";

function getPrivateField(obj, fieldName) {
	return obj[fieldName];
}

console.log("=== Debug: Effect Tracking Across State Changes ===");

const myState = $.watch({ name: "Jake", age: 37 });

myState.effect(() => {
	console.log(`Age effect: ${myState.value.age}`);
});

console.log("\nAfter creating age effect:");
const granularEffects = getPrivateField(myState, "_granularEffects");
console.log("_granularEffects keys:", Array.from(granularEffects.keys()));
console.log("Age effects count:", granularEffects.get("age")?.size || 0);

console.log("\n=== Setting myState.value = { name: 'Mary', age: 38 } ===");
myState.value = { name: "Mary", age: 38 };

console.log("\nAfter state change:");
console.log("_granularEffects keys:", Array.from(granularEffects.keys()));
console.log("Age effects count:", granularEffects.get("age")?.size || 0);

console.log("\n=== Setting myState.value.age = 39 ===");
myState.value.age = 39;
