type SubFunction$1 = (value: any, ref?: string) => void;
declare class Store$1<T> {
    name: string;
    value: T;
    constructor(name: string, ops?: StoreOptions<T>);
    sub(sub: (value: T) => void, immediate?: boolean): void;
    update(value: T | ((value: T) => T)): void;
}

type RegisteredElementRecipe = {
    parent?: Document | HTMLElement;
    element?: HTMLElement | null;
    query?: string;
    create?: string;
    classes?: string[];
        ref: RegisteredElement;
        mode?: Positions;
    };
    ops: MfldOps;
};
type Positions = "before" | "after" | "append" | "prepend" | "appendChild";
declare class RegisteredElement {
    constructor(from: string, recipe: RegisteredElementRecipe);
        w: string;
        left: string;
        top: string;
    };
}

declare global {
    interface Window {
        MFLD: {
            st: Map<string, Store<any>>;
            mut: Map<HTMLElement, {
                toRemove: Set<Store<any>>;
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
    scope?: RegisteredElement;
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

declare let Mfld: {
    store: <T>(store_name: string, store_ops: StoreOptions<T> | T) => Store$1<T>;
    ustore: (store_name: string, store_ops: StoreOptions<any>) => Store$1<any>;
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
