import type { Store } from "./reactivity";

declare global {
	interface Window {
		nextTickQueue: (() => void)[];
		mfldStores: Map<string, WeakRef<Store>>;
		mfldFuncs: Map<string, WeakRef<() => void>>;
	}

	let nextTickQueue: (() => void)[];
	let mfldStores: Map<string, WeakRef<Store>>;
	let mfldFuncs: Map<string, WeakRef<() => void>>;
}
