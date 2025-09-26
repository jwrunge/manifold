import type { StateConstraint } from "./main.ts";

// Global registry for incremental DOM registration
/**
 * Global registry of created stores keyed by optional name.
 * This allows incremental registration of DOM elements to a store.
 * @public
 */
export const globalStores = new Map<string | undefined, StateConstraint>();
