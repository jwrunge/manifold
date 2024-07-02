type SubFunction$1 = (value: any, ref?: string) => void;
declare class Store$1<T> {
    name: string;
    value: T;
    constructor(name: string, ops?: StoreOptions<T>);
    sub(sub: (value: T) => void, immediate?: boolean): void;
    update(value: T | ((value: T) => T)): void;
}

declare class RegisteredElement {
    constructor(el: HTMLElement);
    addListener(event: string, listener: Function): void;
    addInternalStore(store: Store$1<any>): void;
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
        };
    }
    let MFLD: typeof window.MFLD;
}
declare let $fn: {
    [key: string]: Function;
};
declare let $st: {
    [key: string]: any;
};
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
type ValueDeterminer<T> = (currentValue?: T) => T | undefined;
type UpdateFunction<T> = (value: T | ValueDeterminer<T>) => T | undefined;
type SubDeterminer<T> = (value: T) => void;
type SubFunction<T> = (value: SubDeterminer<T>) => void;
interface StoreOptions<T> {
    name?: string;
    value?: T;
    updater?: UpdaterFunction<T>;
    scope?: HTMLElement;
    dependencyList?: string[];
    internal?: boolean;
}
interface Store<T> {
    readonly value: T;
    update: UpdateFunction<T>;
    sub: SubFunction<T>;
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

declare let onTick: (fn: Function) => void;

declare let _setOptions: (newops: Partial<MfldOps>, profileName?: string) => void;

declare let store: {
    make: <T>(store_name: string, store_ops: StoreOptions<T> | T) => Store$1<T>;
    untyped: (store_name: string, store_ops: StoreOptions<any>) => Store$1<any>;
    funcs: (funcs: {
        [key: string]: MfldFunc;
    }) => void;
};
declare let component: {
    make: (name: string, ops?: Partial<ComponentOptions> | undefined) => void;
    register: (src: string) => Promise<void>;
};

export { $fn, $st, component, _setOptions as config, onTick, store };
