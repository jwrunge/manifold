import { State } from "./src/State.js";

// Debug test for derived state property access
console.log("🔍 Testing derived state property access...");

const myState = new State({ name: "Jake", age: 37 });
console.log("✓ Created base state:", myState.value);

const derivedState = new State(() => ({
	name: myState.value.name.toUpperCase(),
	age: myState.value.age + 10,
}));

console.log("✓ Created derived state:", derivedState.value);

// Test direct property access
try {
	const name = derivedState.value.name;
	console.log("✓ derivedState.value.name:", name);
} catch (error) {
	console.error("❌ Error accessing derivedState.value.name:", error);
}

try {
	const age = derivedState.value.age;
	console.log("✓ derivedState.value.age:", age);
} catch (error) {
	console.error("❌ Error accessing derivedState.value.age:", error);
}

// Test with effects
try {
	let trackedAge = null;
	const cleanup = derivedState.effect(() => {
		console.log("🔄 Effect running, accessing derivedState.value.age...");
		trackedAge = derivedState.value.age;
		console.log("✓ Effect got age:", trackedAge);
	});

	console.log("✓ Effect completed, tracked age:", trackedAge);
	cleanup();
} catch (error) {
	console.error(
		"❌ Error in effect accessing derivedState.value.age:",
		error
	);
}

// Test state updates
try {
	console.log("🔄 Updating myState.value.age...");
	myState.value.age = 40;
	console.log("✓ Updated myState.value.age to:", myState.value.age);
	console.log("✓ Derived state age is now:", derivedState.value.age);
} catch (error) {
	console.error("❌ Error updating or accessing age:", error);
}

console.log("✅ Debug test completed");
