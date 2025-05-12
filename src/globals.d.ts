import type { Store } from "./reactivity";

declare global {
	var mfld: {
		ontick: (() => void)[];
		stores: Map<string, WeakRef<Store>>;
		funcs: Map<string, WeakRef<() => void>>;
	};

	var currentScript: HTMLScriptElement | undefined;
}
