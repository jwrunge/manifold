import type { Store } from "./store";

declare global {
  interface Window {
    mfldStores: Map<string, WeakRef<Store<unknown>>>;
  }
}
