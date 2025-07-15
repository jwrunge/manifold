// Analyze the "update triggers" test data
import $ from "./dist/manifold.es.js";

console.log("=== Analyzing Update Triggers Test ===");

const myState = $.watch({ name: "Jake", age: 37 });

let storeUpdateCount = 0;
let nameUpdateCount = 0;
let ageUpdateCount = 0;

myState.effect(() => {
	console.log(`Store effect: ${JSON.stringify(myState.value)}`);
	storeUpdateCount++;
});

myState.effect(() => {
	console.log(`Name effect: ${myState.value.name}`);
	nameUpdateCount++;
});

myState.effect(() => {
	console.log(`Age effect: ${myState.value.age}`);
	ageUpdateCount++;
});

console.log(
	`Initial counts - Store: ${storeUpdateCount}, Name: ${nameUpdateCount}, Age: ${ageUpdateCount}`
);

const testData = [
	{ name: "Jake", age: 38 },
	{ name: "Jake", age: 39 },
	{ name: "Mary", age: 37 },
	{ name: "Mary", age: 37 },
	{ name: "Mary", age: 38 },
];

console.log("\n=== Processing test data ===");
testData.forEach((data, index) => {
	console.log(`\nStep ${index + 1}: Setting to ${JSON.stringify(data)}`);
	myState.value = data;
	console.log(
		`Counts - Store: ${storeUpdateCount}, Name: ${nameUpdateCount}, Age: ${ageUpdateCount}`
	);
});

console.log("\n=== Final direct property change ===");
console.log("Setting myState.value.age = 39");
myState.value.age = 39;
console.log(
	`Final counts - Store: ${storeUpdateCount}, Name: ${nameUpdateCount}, Age: ${ageUpdateCount}`
);

console.log("\n=== Analysis ===");
console.log(
	"Name changes: Jake -> Jake -> Jake -> Mary -> Mary -> Mary (2 actual changes)"
);
console.log(
	"Age changes: 37 -> 38 -> 39 -> 37 -> 37 -> 38 -> 39 (5 actual changes)"
);
