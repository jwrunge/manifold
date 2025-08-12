// This file demonstrates the complete cross-file type safety

import { myBuilder } from "./init";
import { finalState } from "./usage";

// Example 1: Starting from the exported builder
const userState = myBuilder
	.addState("age", 37)
	.addState("preferences", { theme: "dark", language: "en" })
	.build();

// TypeScript infers: { name: string; age: number; preferences: { theme: string; language: string } }
console.log("User name:", userState.state.name);
console.log("User age:", userState.state.age);
console.log("User theme:", userState.state.preferences.theme);

// Example 2: Type checking works perfectly
function processUser(state: { name: string; age: number }) {
	return `${state.name} is ${state.age} years old`;
}

// This works because finalState has the correct type
console.log(processUser(finalState.state));

// Example 3: You can also create type-specific functions
function processFullUser(state: {
	name: string;
	age: number;
	preferences: any;
}) {
	return `${state.name} (${state.age}) prefers ${state.preferences.theme} theme`;
}

console.log(processFullUser(userState.state));

// Example 4: Branching from the same base builder
const adminState = myBuilder
	.addState("role", "admin")
	.addState("permissions", ["read", "write", "delete"])
	.build();

// Different type: { name: string; role: string; permissions: string[] }
console.log(
	"Admin:",
	adminState.state.name,
	"with role:",
	adminState.state.role
);

export { userState, adminState };
