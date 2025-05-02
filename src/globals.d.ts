import type { Store } from "./store";

declare global {
  interface Window {
    $st: unknown,
    mfldStores: Map<string, WeakRef<Store<unknown>>>;
  }
}

export {};
