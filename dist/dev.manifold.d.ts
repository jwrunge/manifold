/***
 * OPTIONS
 */
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
    script?: "all" | "selected" | "none";
    style?: "all" | "selected" | "none";
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
type UpdaterFunction<T> = (value: T | (() => T)) => T;
interface StoreOptions<T> {
    name?: string;
    value?: T;
    updater?: UpdaterFunction<T>;
    scope?: HTMLElement;
    dependencyList?: string[];
    internal?: boolean;
}
type MfldFunc = (val: any, el?: HTMLElement) => void;

type SubFunction = (value: any, ref?: string) => void;
declare class Store<T> {
    name: string;
    value: T;
    constructor(name: string, ops?: StoreOptions<T>);
    sub(sub: (value: T) => void, immediate?: boolean): void;
    update(value: T | ((value: T) => T)): void;
}
declare function _store<T>(name: string, ops?: StoreOptions<T>): Store<T>;

interface ComponentOptions {
    href: string;
    shadow: "open" | "closed" | false;
    templ: HTMLTemplateElement;
    selector: string;
    onconstruct: () => void;
    onConnect: () => void;
    onDisconnect: () => void;
    onAdopted: () => void;
    onAttributeChanged: (attrName: string, oldVal: string | null, newVal: string | null) => void;
    observedAttributes: Array<string>;
    options: Partial<MfldOps>;
}

declare let onTick: (fn: Function) => void;

declare let _setOptions: (newops: Partial<MfldOps>, profileName?: string) => void;

declare class RegisteredElement {
        key: string;
        store: string;
    }>;
    constructor(el: HTMLElement, fnCtx?: Set<{
        key: string;
        store: string;
    }>);
    addListener(event: string, listener: Function): void;
    addInternalStore(store: Store<any>): void;
    cleanUp(): void;
}

declare global {
    interface Window {
        MFLD: {
            st: Map<string, Store<any>>;
            els: Map<HTMLElement, RegisteredElement>;
            $st: {
                [key: string]: any;
            };
            $fn: {
                [key: string]: Function;
            };
            comp: {
                [key: string]: CustomElementConstructor;
            };
            stProx?: typeof stProx;
        };
    }
    let MFLD: typeof window.MFLD;
}
declare let $st: {
    [key: string]: any;
};
declare let $fn: {
    [key: string]: Function;
};

declare function stProx(map?: {
    key: string;
    store: string;
}[]): typeof _store;

declare let store: {
    make: <T>(store_name: string, store_ops: StoreOptions<T> | T) => Store<T>;
    untyped: (store_name: string, store_ops: StoreOptions<any>) => Store<any>;
    funcs: (funcs: {
        [key: string]: MfldFunc;
    }) => void;
};
declare let component: {
    make: (name: string, ops?: Partial<ComponentOptions> | undefined) => void;
    get: (name: string, src: string, ops?: Partial<ComponentOptions> | undefined) => Promise<void>;
};

export { $fn, $st, component, _setOptions as config, onTick, store };
