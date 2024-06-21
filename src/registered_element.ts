import { ATTR_PREFIX } from "./util";

export const elementReg = new Map<HTMLElement, RegisteredElement>();

type RegisteredElementRecipe = {
    query: string;
    create: {
        name: string,
    }
}

export class RegisteredElement {
    _el: HTMLElement | null = null;
    _listeners: Map<keyof HTMLElementEventMap, any> | null = new Map();
    _funcs: Set<Function> | null = new Set();

    constructor(ops: RegisteredElementRecipe) {
        if(ops.query) this._el = document.querySelector(ops.query) as HTMLElement;
        else {
            this._el = document.createElement(ops.create.name);
        }
    }

    _dataset(key: string) {
        return this._el?.dataset[`${ATTR_PREFIX}${key}`];
    }

    _addListener(trigger: keyof HTMLElementEventMap, func: any) {
        this._listeners?.set(trigger, func);
    }

    _addFunc(func: Function) {
        this._funcs?.add(func);
    }

    _cleanUp() {
        this._listeners?.forEach((func, trigger) => {
            this._el?.removeEventListener(trigger, func);
        });

        this._funcs?.forEach((func) => {
            this._funcs?.delete(func);
        });

        this._funcs = this._listeners = null;
        this._el = null;

        if(this._el) elementReg.delete(this._el);
    }
}