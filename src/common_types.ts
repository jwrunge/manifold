import { RegisteredElement } from "./registered_element";
import { _store } from "./store";

declare global {
    interface Window {
      MFLD: {
        st: Map<string, Store<any>>;
        mut: Map<HTMLElement, { toRemove: Set<Store<any>>, observer: MutationObserver }>;
        $st: { [key: string]: any }; // Proxy type for dynamic property access
        $fn: { [key: string]: Function };
        comp: { [key: string]: CustomElementConstructor };
      }
    }

    let MFLD: typeof window.MFLD;
}

if(!window.MFLD) window.MFLD = {
    st: new Map(),
    mut: new Map(),
    $st: new Proxy(_store, {
        get: (store, property: string | symbol) => {
          return typeof property === "string" ? store(property)?.value : undefined;
        },
        set: (store, property: string | symbol, value) => {
            if(typeof property === "string") {
                let propParts = property.split(/[\.\[\]\?]{1,}/g).map(s => parseFloat(s.trim()) || s.trim()),
                    S = store(propParts[0] as string),
                    ret = S.value;

                for(let part of propParts.slice(1) || []) ret = (ret as any)[part];
                ret = value;
                S.update(ret);
            }

            return true;
        }
    }),
    $fn: {},
    comp: {}
};

export let { $fn, $st } = MFLD;

/***
 * OPTIONS
 */
export type FetchInsertionMode = "append" | "prepend" | "inner" | "outer";

export type MfldOps = {
  profiles?: { [ key: string ]: Partial<MfldOps> }
  fetch?: FetchOptions
  trans?: TransitionOptions
}

export type FetchOptions = {
  request?: RequestInit
  resType?: "json" | "text"
  err?: (err: Error) => void
  onCode?: (code: number, data: void | Response) => boolean | void
  externals?: ExternalOptions[]
}

export type ExternalOptions = {
  domain: string;
  script?: "all" | "selected" | "none";
  style?: "all" | "selected" | "none";
}

export type TransitionOptions = {
  class?: string
  dur?: [number, number]
  swap?: number
  smart?: boolean
  hooks?: { [ key in HookKey ]?: (el: HTMLElement) => void }
}

export type HookKey = "in-start" | "in-end" | "out-start" | "out-end"

/**
 * STORES
 */

export type UpdaterFunction<T> = (value: T | (()=> T)) => T;
export type ValueDeterminer<T> = (currentValue?: T) => T | undefined;
export type UpdateFunction<T> = (value: T | ValueDeterminer<T>) => T | undefined;
export type SubDeterminer<T> = (value: T) => void;
export type SubFunction<T> = (value: SubDeterminer<T>) => void;

export interface StoreOptions<T> {
  name?: string;
  value?: T;
  updater?: UpdaterFunction<T>;
  scope?: RegisteredElement;
  dependencyList?: string[];
}

export interface Store<T> {
  readonly value: T;
  update: UpdateFunction<T>;
  sub: SubFunction<T>;
}

export type MfldFunc = (val: any, el?: HTMLElement) => void;