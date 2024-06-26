type SubFunction$1 = (value: any, ref?: string) => void;
declare class Store$1<T> {
    _updater?: Function;
    _subscriptions: Map<string, SubFunction$1>;
    _storedHash?: string;
    _upstreamStores: Set<Store$1<any>>;
    _downstreamStores: Set<Store$1<any>>;
    _scope?: RegisteredElement;
    _updateTimeout?: any;
    name: string;
    value: T;
    constructor(name: string, ops?: StoreOptions<T>);
    _modify(ops?: StoreOptions<T>): Store$1<T>;
    sub(sub: (value: T) => void, ref?: string, immediate?: boolean): void;
    update(value: T | ((value: T) => T)): void;
    _auto_update(): void;
}

type RegisteredElementRecipe = {
    parent?: Document | HTMLElement;
    element?: HTMLElement;
    query?: string;
    create?: string;
    classes?: string[];
    ops: MfldOps;
};
declare class RegisteredElement {
    _el: HTMLElement;
    _listeners: Map<string, any> | null;
    _funcs: Set<Function> | null;
    _ops: MfldOps;
    constructor(recipe: RegisteredElementRecipe);
    _getDataset(): DOMStringMap;
    _dataset(key: string, value?: string): "" | "T";
    _classes(classes: string | string[], remove?: boolean): void;
    _query(query: string, all?: boolean): NodeListOf<HTMLElement> | null;
    _addListener(trigger: string, func: any): any;
    _addFunc(func: Function): Function;
    _callFunc(func: Function, key: string, val: any, body: any): any;
    _registerInternalStore(upstream: string[]): Store$1<any>;
    _position(el: HTMLElement, mode?: "after" | "before" | "append" | "prepend" | "appendChild", clone?: boolean): HTMLElement;
    _empty(): void;
    _replaceWith(el: RegisteredElement): void;
    _asTempl(classes?: string[]): RegisteredElement;
    _dimensions(): {
        w: string;
        left: string;
        top: string;
    };
    _transition(dir: "in" | "out", fn?: Function, after?: Function): void;
    _cleanUp(): void;
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
type UpdaterFunction<T> = (value: T | (() => T)) => T;
type ValueDeterminer<T> = (currentValue?: T) => T | undefined;
type UpdateFunction<T> = (value: T | ValueDeterminer<T>) => T | undefined;
type SubDeterminer<T> = (value: T) => void;
type SubFunction<T> = (value: SubDeterminer<T>) => void;
interface StoreOptions<T> {
    value?: T;
    updater?: UpdaterFunction<T>;
    scope?: RegisteredElement;
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
