import { $fn, $st } from "./common_types";
import { _store, Store } from "./store";
import { _id } from "./util";

// Ensures the element is a HTMLTemplateElement, converting it if necessary
export const _ensureTemplate = (el: HTMLElement): HTMLTemplateElement => {
    const nodeName = "TEMPLATE";
    if(el.tagName === nodeName) return el as HTMLTemplateElement;

    const newEl = document.createElement(nodeName) as HTMLTemplateElement;
    newEl.content.appendChild(el.cloneNode(true));
    el.replaceWith(newEl);

    return newEl;
};

// Iterates over an iterable object or an object's properties
export const _iterable = <T>(obj: Iterable<T> | { [key: string]: T }, cb: (value: T, key: string | number) => void): void => {
    if(obj instanceof Map) {
        for (const [key, value] of obj.entries()) cb(value, key);
    } else {
        try {
            const arr = Array.isArray(obj) ? obj : Array.from(obj as Array<any>);
            if(arr.length) arr.forEach(cb);
            else for (const key in obj) cb((obj as any)[key], key);
        } catch (e) {
            console.error(`${obj} is not iterable`);
        }
    }
};

// Iterates over an element's siblings until a condition is met
export const _iterateSiblings = (
    sib?: HTMLElement | null, 
    breakFn?: ((sib?: HTMLElement | null) => boolean | undefined) | null, 
    cb?: ((sib?: HTMLElement | null) => void) | null, 
    reverse: boolean = false
): HTMLElement | null | undefined => {
    const dir = reverse ? "previousElementSibling" : "nextElementSibling";
    return breakFn?.(sib) ? sib : _iterateSiblings(cb?.(sib) || sib?.[dir] as HTMLElement, breakFn, cb, reverse);
};

// Registers an internal store with given options
export const _registerInternalStore = (upstream?: string[], func?: Function, $el?: HTMLElement): Store<any> => {
    return _store(_id(), {
        upstream,
        updater: () => func?.({ $el, $st, $fn }),
        scope: $el,
    });
};