import { myBuilder } from "./init";

// Import the builder and continue building
// TypeScript knows myBuilder is of type Builder<{ name: string }>
// After adding "age", the type becomes Builder<{ name: string } & Record<"age", number>>
// Which simplifies to Builder<{ name: string; age: number }>
const finalState = myBuilder.addState("age", 37).build();

// TypeScript knows finalState.state has type { name: string; age: number }
console.log(finalState.state.name); // ✅ TypeScript knows this is string
console.log(finalState.state.age); // ✅ TypeScript knows this is number
// console.log(finalState.state.nonExistent); // ❌ Would be TypeScript error - property doesn't exist

// You can also continue the chain further
const extendedState = myBuilder
	.addState("age", 37)
	.addState("isActive", true)
	.addState("email", "jake@example.com")
	.build();

// Type is { name: string; age: number; isActive: boolean; email: string }
console.log(extendedState.state);

export { finalState, extendedState };
