import type { StateConstraint } from "./main.ts";

// Global registry for incremental DOM registration
export const globalStores = new Map<string | undefined, StateConstraint>();
