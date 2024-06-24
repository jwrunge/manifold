declare global {
    interface Window {
        MFLD: {
            st: Map<string, Store$1<any>>;
            mut: Map<HTMLElement, {
                toRemove: Set<Store$1<any>>;
                observer: MutationObserver;
            }>;
            $st: {
                [key: string]: any;
            };
            $fn: {
                [key: string]: Function;
            };
            comp: {
                [key: string]: CustomElementConstructor;
            };
        };
    }
    let MFLD: typeof window.MFLD;
}
type MfldOps = {
    profiles?: {
        [key: string]: Partial<MfldOps>;
    };
    fetch?: FetchOptions;
    trans?: TransitionOptions;
};
type FetchOptions = {
    request?: RequestInit;
    resType?: "json" | "text";
    err?: (err: Error) => void;
    onCode?: (code: number, data: void | Response) => boolean | void;
    externals?: ExternalOptions[];
};
type ExternalOptions = {
    domain: string;
    scripts?: "all" | "selected" | "none";
    styles?: "all" | "selected" | "none";
};
type TransitionOptions = {
    class?: string;
    dur?: [number, number];
    swap?: number;
    smart?: boolean;
    hooks?: {
        [key in HookKey]?: (el: HTMLElement) => void;
    };
};
type HookKey = "in-start" | "in-end" | "out-start" | "out-end";
/**
 * STORES
 */
type UpdaterFunction<T> = (upstreamValues: any[], value: T) => T;
type ValueDeterminer<T> = (currentValue?: T) => T | undefined;
type UpdateFunction<T> = (value: T | ValueDeterminer<T>) => T | undefined;
type SubDeterminer<T> = (value: T) => void;
type SubFunction$1<T> = (value: SubDeterminer<T>) => void;
interface StoreOptions<T> {
    value?: T;
    upstream?: string[];
    updater?: UpdaterFunction<T>;
    scope?: HTMLElement | SVGScriptElement | "global";
}
interface Store$1<T> {
    readonly value: T;
    update: UpdateFunction<T>;
    sub: SubFunction$1<T>;
}
type MfldFunc = (val: any, el?: HTMLElement) => void;

interface ComponentOptions {
    href: string;
    shadow: "open" | "closed";
    templ: HTMLTemplateElement;
    selector: string;
    onconstruct: () => void;
    onconnect: () => void;
    ondisconnect: () => void;
    onadopted: () => void;
    onAttributeChanged: (attrName: string, oldVal: string | null, newVal: string | null) => void;
    observedAttributes: Array<string>;
    options: Partial<MfldOps>;
}

type SubFunction = (value: any, ref?: string) => void;
declare class Store<T> {
    name: string;
    value: T;
    constructor(name: string, ops?: StoreOptions<T>);
    sub(sub: (value: T) => void, ref?: string, immediate?: boolean): void;
    update(value: T | ((value: T) => T)): void;
}

declare let Mfld: {
    store: <T>(store_name: string, store_ops: StoreOptions<T> | T) => Store<T>;
    ustore: (store_name: string, store_ops: StoreOptions<any>) => Store<any>;
    funcs: (funcs: {
        [key: string]: MfldFunc;
    }) => void;
    config: (new_ops: MfldOps, profile_name?: string) => void;
    onTick: (cb: Function) => void;
    register: (parent: HTMLElement | string | null) => void;
    makeComponent: (name: string, ops?: Partial<ComponentOptions> | undefined) => void;
    component: (src: string) => Promise<void>;
};
declare let $st: {
    [key: string]: any;
};
declare let $fn: {
    [key: string]: Function;
};

export { $fn, $st, Mfld };
