import { Builder } from "./State";

// Create a builder with initial state and export it
// TypeScript will infer the type as Builder<{ name: string }>
export const myBuilder = Builder.create().addState("name", "Jake");

// You can also be explicit about the type if you want:
// export const myBuilder: Builder<{ name: string }> = Builder.create().add("name", "Jake");
