import { State, computed } from "./src/State.js";

// Create some basic states
const name = new State("Jake");
const age = new State(30);

// Create a computed state that derives from the basic states
const greeting = computed(
	() => `Hello, ${name.value}! You are ${age.value} years old.`
);

// Log initial values
console.log("Initial greeting:", greeting.value);

// Update the source states
name.value = "Mary";
age.value = 25;

// Log updated computed value
console.log("Updated greeting:", greeting.value);

// Test with function that returns a state value
const upperName = computed(() => name.value.toUpperCase());
console.log("Upper name:", upperName.value);

// Update name again
name.value = "Alice";
console.log("Updated upper name:", upperName.value);

console.log("✅ computed() helper function works correctly!");
