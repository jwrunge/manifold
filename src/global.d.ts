// Minimal ambient declarations to satisfy TS when using Cookie Store API in examples.
// Browsers supporting this expose `cookieStore` on Window, but TypeScript DOM lib may not include it.
interface CookieListItem { name: string; value: string; }
interface CookieStore {
  get(name: string): Promise<CookieListItem | null>;
  set(name: string, value: string): Promise<void>;
}
declare const cookieStore: CookieStore;
