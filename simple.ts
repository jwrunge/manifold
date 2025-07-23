/**
 * Getting Started with Manifold - Simple Example
 *
 * This is a minimal example showing the core concepts of Manifold:
 * 1. Creating reactive state
 * 2. Computed values
 * 3. Effects (reactions to state changes)
 * 4. HTML data attribute binding
 */

import { State, createState } from "./src/index";

// 1. Create reactive state
const name = createState("World");
const count = new State(0);

// 2. Create computed state (automatically updates when dependencies change)
const greeting = new State(() => `Hello, ${name.value}!`);
const isEven = new State(() => count.value % 2 === 0);

// 3. Create effects (side effects that run when state changes)
greeting.effect(() => {
	console.log("Greeting changed:", greeting.value);

	// Update DOM element
	const el = document.getElementById("greeting");
	if (el) el.textContent = greeting.value;
});

count.effect(() => {
	console.log(
		"Count is now:",
		count.value,
		isEven.value ? "(even)" : "(odd)"
	);
});

// 4. Functions to demonstrate reactivity
function updateName() {
	const names = ["World", "Alice", "Bob", "Charlie", "Diana"];
	const currentIndex = names.indexOf(name.value);
	const nextIndex = (currentIndex + 1) % names.length;
	name.value = names[nextIndex];
}

function increment() {
	count.value += 1;
}

function decrement() {
	count.value -= 1;
}

// 5. Expose to global scope for HTML demo
(window as any).simple = {
	name,
	count,
	greeting,
	isEven,
	updateName,
	increment,
	decrement,
};

// 6. Initialize
console.log("🌟 Simple Manifold demo loaded");
console.log("Initial state:", {
	name: name.value,
	count: count.value,
	greeting: greeting.value,
});
