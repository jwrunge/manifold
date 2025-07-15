import $ from "../dist/manifold.es.js";

// This is a hack to access private members for debugging
function getPrivateField(obj, fieldName) {
	return obj[fieldName];
}

console.log("=== Debug: Inspecting Effect Sets ===");

const myState = $.watch({ name: "Jake", age: 37 });

console.log("After creating state:");
console.log(
	"_topLevelEffects size:",
	getPrivateField(myState, "_topLevelEffects")?.size || 0
);
console.log(
	"_granularEffects size:",
	getPrivateField(myState, "_granularEffects")?.size || 0
);

myState.effect(() => {
	console.log(`Store effect running`);
	const value = myState.value;
});

console.log("\nAfter store effect:");
console.log(
	"_topLevelEffects size:",
	getPrivateField(myState, "_topLevelEffects")?.size || 0
);
console.log(
	"_granularEffects size:",
	getPrivateField(myState, "_granularEffects")?.size || 0
);

myState.effect(() => {
	console.log(`Name effect running`);
	const name = myState.value.name;
});

console.log("\nAfter name effect:");
console.log(
	"_topLevelEffects size:",
	getPrivateField(myState, "_topLevelEffects")?.size || 0
);
console.log(
	"_granularEffects size:",
	getPrivateField(myState, "_granularEffects")?.size || 0
);

myState.effect(() => {
	console.log(`Age effect running`);
	const age = myState.value.age;
});

console.log("\nAfter age effect:");
console.log(
	"_topLevelEffects size:",
	getPrivateField(myState, "_topLevelEffects")?.size || 0
);
console.log(
	"_granularEffects size:",
	getPrivateField(myState, "_granularEffects")?.size || 0
);

console.log("\n=== Setting myState.value.age = 39 ===");
myState.value.age = 39;
