import type { Store } from "./reactivity";

declare global {
	var mfld: {
		st: WeakMap<HTMLScriptElement, Map<string, Store>>;
		fn: WeakMap<HTMLScriptElement, Map<string, () => void>>;
		tick: (() => void)[];
	};
}
