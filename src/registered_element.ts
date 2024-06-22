import { $fn, $st } from ".";
import { _id, ATTR_PREFIX } from "./util";

export let elementReg = new WeakMap<HTMLElement, RegisteredElement>();

type RegisteredElementRecipe = {
    parent?: Document | HTMLElement;
    element?: HTMLElement;
    query?: string;
    create?: string,
    classes?: string[],
}

export class RegisteredElement {
    // @ts-ignore
    _el: HTMLElement;
    _listeners: Map<string, any> | null = new Map();
    _funcs: Set<Function> | null = new Set();

    constructor(ops: RegisteredElementRecipe) {
        if(ops.element) this._el = ops.element;
        else if(ops.query) this._el = (ops.parent || document).querySelector(ops.query) as HTMLElement;
        else this._el = document.createElement(ops.create || "TEMPLATE");
        
        elementReg.set(this._el, this);
        for(let cls of ["_mfld", ...ops.classes || []]) this._el.classList.add(cls);
        // if(!this._el.id) this._el.id = _id();

        return this;
    }

    _dataset(key: string, value?: string) {
        if(value) this._el.dataset[`${ATTR_PREFIX}${key}`] = value;
        let val = this._el?.dataset[`${ATTR_PREFIX}${key}`];
        return val || val !== undefined ? "T" : "";
    }

    _query(query: string, all = true) {
        // @ts-ignore
        return this._el["querySelector".concat(all ? "All" : "")](query) as NodeListOf<HTMLElement> | null;
    }

    _addListener(trigger: string, func: any) {
        this._listeners?.set(trigger, func);
        return func;
    }

    _addFunc(func: Function, key?: string, val?: string, body?: boolean) {
        this._funcs?.add(()=> func({$el: this._el, $st, $fn, key, val, body}));
        return func;
    }

    _append(el: HTMLElement, clone = true) {
        this._el?.appendChild(clone ? el.cloneNode(true) : el);
    }

    _replaceWith(el: RegisteredElement) {
        this._el?.replaceWith(el._el);
        this._cleanUp();
    }

    _asTempl(classes: string[] = []) {
        let templ = new RegisteredElement({ classes });
        templ._append(this._el, true);
        this._replaceWith(templ);
        return templ;
    }

    _dimensions() {
        let el = this._el,
            style = getComputedStyle(el),
            rect = el.getBoundingClientRect();
        return {
            w: `calc(${(el).clientWidth}px - ${style.paddingLeft} - ${style.paddingRight})`,
            left: `calc(${rect.left}px + ${window.scrollX}px)`,
            top: `calc(${rect.top}px + ${window.scrollY}px)`
        };
    }

    _cleanUp() {
        // Clear listeners and funcs
        this._listeners?.forEach((func, trigger) => {
            this._el?.removeEventListener(trigger, func);
        });

        this._funcs?.forEach((func) => {
            this._funcs?.delete(func);
        });

        // Clear children
        this._query("._mfld", true)?.forEach(child => {
            elementReg.get(child as HTMLElement)?._cleanUp();
        });

        //Clear references
        this._el.remove();
        // @ts-ignore
        this._funcs = this._listeners = this._el = null;

        if(this._el) elementReg.delete(this._el);
    }
}