/**
 * Manifold Demo - TypeScript Implementation
 *
 * This file demonstrates the core features of the Manifold reactive state library:
 * - Creating reactive state with the State class
 * - Using computed/derived state
 * - Reactive effects and subscriptions
 * - State mutations and object reactivity
 * - Integration with HTML data attributes
 */

import { State, createState, evaluateExpression } from "./src/index";
import { attributeParser } from "./src/attribute-parser";

console.log("🚀 Manifold Demo - Reactive State Management");

// ========================
// Basic State Management
// ========================

// Create basic reactive state
const count = new State(0);
const username = createState("Guest");

// Create computed/derived state
const doubleCount = new State(() => count.value * 2);
const greeting = new State(() => `Hello, ${username.value}!`);

console.log("\n📊 Basic State:");
console.log("Initial count:", count.value);
console.log("Initial username:", username.value);
console.log("Computed double count:", doubleCount.value);
console.log("Computed greeting:", greeting.value);

// ========================
// Reactive Effects
// ========================

// Set up reactive effects that run when dependencies change
count.effect(() => {
	console.log(`💫 Count changed to: ${count.value}`);
});

doubleCount.effect(() => {
	console.log(`💫 Double count is now: ${doubleCount.value}`);
});

greeting.effect(() => {
	console.log(`💫 Greeting updated: ${greeting.value}`);

	// Update DOM element if it exists
	const greetingEl = document.getElementById("greeting");
	if (greetingEl) {
		greetingEl.textContent = greeting.value;
	}
});

// ========================
// State Updates
// ========================

console.log("\n🔄 Testing State Updates:");

// Update count - should trigger both count and doubleCount effects
count.value = 5;

// Update username - should trigger greeting effect
username.value = "Alice";

// More updates
count.value = 10;
username.value = "Bob";

// ========================
// Object Reactivity
// ========================

console.log("\n🎯 Object Reactivity:");

// Create state with object
interface User {
	id: number;
	name: string;
	email: string;
	preferences: {
		theme: "light" | "dark";
		notifications: boolean;
	};
}

const user = new State<User>({
	id: 1,
	name: "John Doe",
	email: "john@example.com",
	preferences: {
		theme: "light",
		notifications: true,
	},
});

// Create computed state from object properties
const displayName = new State(() => user.value.name.toUpperCase());

const themeClass = new State(() => `theme-${user.value.preferences.theme}`);

// Set up effects for object changes
user.effect(() => {
	console.log("👤 User data changed:", JSON.stringify(user.value, null, 2));
});

displayName.effect(() => {
	console.log("📝 Display name:", displayName.value);

	const displayEl = document.getElementById("display-name");
	if (displayEl) {
		displayEl.textContent = displayName.value;
	}
});

themeClass.effect(() => {
	console.log("🎨 Theme class:", themeClass.value);

	// Apply theme to body
	document.body.className = themeClass.value;
});

// Update object properties - should trigger effects
console.log("\n🔧 Updating user properties:");
user.value = {
	...user.value,
	name: "Jane Smith",
};

user.value = {
	...user.value,
	preferences: {
		...user.value.preferences,
		theme: "dark",
	},
};

// ========================
// Array Reactivity
// ========================

console.log("\n📝 Array Reactivity:");

const todos = new State<string[]>(["Learn Manifold", "Build an app"]);

const todoCount = new State(() => todos.value.length);
const todoSummary = new State(
	() => `${todoCount.value} todo${todoCount.value !== 1 ? "s" : ""} remaining`
);

todos.effect(() => {
	console.log("📋 Todos:", todos.value);
});

todoSummary.effect(() => {
	console.log("📊 Summary:", todoSummary.value);

	const summaryEl = document.getElementById("todo-summary");
	if (summaryEl) {
		summaryEl.textContent = todoSummary.value;
	}
});

// Add and remove todos
todos.value = [...todos.value, "Write documentation"];
todos.value = todos.value.filter((todo) => todo !== "Learn Manifold");

// ========================
// Expression Evaluation
// ========================

console.log("\n🧮 Expression Evaluation:");

// Test expression evaluation
const context = {
	x: 10,
	y: 5,
	user: { name: "Alice", active: true },
	items: [1, 2, 3],
};

const expressions = [
	"x + y",
	'x > y ? "greater" : "smaller"',
	"user.name",
	"user.active && x > 0",
	"items.length",
	'"Hello " + user.name + "!"',
];

expressions.forEach((expr) => {
	const result = evaluateExpression(expr, context);
	console.log(`📐 ${expr} = ${result}`);
});

// ========================
// DOM Integration Setup
// ========================

// Expose state variables to global scope for data attribute access
(window as any).count = count;
(window as any).username = username;
(window as any).user = user;
(window as any).todos = todos;
(window as any).greeting = greeting;
(window as any).displayName = displayName;
(window as any).themeClass = themeClass;
(window as any).todoSummary = todoSummary;

// Global state for HTML demo
(window as any).manifoldDemo = {
	// State objects
	count,
	username,
	user,
	todos,
	greeting,
	displayName,
	themeClass,
	todoSummary,

	// Utility functions for HTML demo
	incrementCount: () => {
		count.value += 1;
	},

	decrementCount: () => {
		count.value -= 1;
	},

	updateUsername: (name: string) => {
		username.value = name;
	},

	toggleTheme: () => {
		const newTheme =
			user.value.preferences.theme === "light" ? "dark" : "light";
		user.value = {
			...user.value,
			preferences: {
				...user.value.preferences,
				theme: newTheme,
			},
		};
	},

	addTodo: (text: string) => {
		if (text.trim()) {
			todos.value = [...todos.value, text.trim()];
		}
	},

	removeTodo: (index: number) => {
		todos.value = todos.value.filter((_, i) => i !== index);
	},

	updateUserName: (name: string) => {
		user.value = { ...user.value, name };
	},
};

// ========================
// DOM Parsing Integration
// ========================

// Wait for DOM to be ready, then parse data attributes
document.addEventListener("DOMContentLoaded", () => {
	console.log("\n🌐 Parsing DOM with data attributes...");

	// Parse the entire document for data attributes
	attributeParser.parseContainer(document.body);

	console.log("✅ DOM parsing complete");
});

console.log(
	"\n✨ Demo setup complete! Check the HTML file to see the reactive UI."
);
