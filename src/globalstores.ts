import type { IntermediateState } from "./main.ts";

export const globalStores = new Map<string | undefined, IntermediateState>();
// biome-ignore lint/suspicious/noExplicitAny: is of type class that extends HTMLElement
export const globalComponents: Record<string, any> = {};
