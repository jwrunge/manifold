import { Builder } from "./State";
import type {
	StateConstraint,
	FuncsConstraint,
	BuilderGenerics,
	AppGenerics,
	AppConfig,
} from "./State";

// Example 1: Using the base constraints directly
export class MyCustomBuilder<
	TState extends StateConstraint = {},
	TFuncs extends FuncsConstraint = {}
> extends Builder<TState, TFuncs> {
	// Custom methods can be added here
}

// Example 2: Using the BuilderGenerics type
export type UserApp = BuilderGenerics<
	{ name: string; age: number },
	{ greet: () => string }
>;

// Example 3: Using AppGenerics interface
export class TypedApp<T extends AppGenerics> {
	state: T["state"];
	funcs: T["funcs"];

	constructor(config: AppConfig<T["state"], T["funcs"]>) {
		this.state = config.state;
		this.funcs = config.funcs;
	}
}

// Example 4: Creating type-safe factory functions
export function createTypedBuilder<
	TState extends StateConstraint,
	TFuncs extends FuncsConstraint = {}
>(config: AppConfig<TState, TFuncs>): Builder<TState, TFuncs> {
	return new Builder<TState, TFuncs>(config.state, config.funcs);
}

// Usage examples:
export const userAppBuilder = createTypedBuilder({
	state: { name: "John", age: 30 },
	funcs: { greet: () => "Hello!" },
});

// This maintains full type safety across the chain
export const extendedApp = userAppBuilder
	.addState("email", "john@example.com")
	.addState("isActive", true)
	.build();

// Type: { name: string; age: number; email: string; isActive: boolean }
console.log(extendedApp.store.name);
console.log(extendedApp.store.email);
console.log(extendedApp.store.isActive);
