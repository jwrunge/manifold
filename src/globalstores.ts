import type { StateConstraint } from "./main";

// Global registry for incremental DOM registration
export const globalStores = new Map<string | undefined, StateConstraint>();
