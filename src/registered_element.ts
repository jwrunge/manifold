import { $fn, $st } from ".";
import { MfldOps } from "./common_types";
import { _scheduleUpdate } from "./updates";
import { _id, ATTR_PREFIX } from "./util";

export let elementReg = new WeakMap<HTMLElement, RegisteredElement>();

type RegisteredElementRecipe = {
    parent?: Document | HTMLElement;
    element?: HTMLElement;
    query?: string;
    create?: string,
    classes?: string[],
    ops: MfldOps,
}

export class RegisteredElement {
    // @ts-ignore
    _el: HTMLElement;
    _listeners: Map<string, any> | null = new Map();
    _funcs: Set<Function> | null = new Set();
    _ops: MfldOps;

    constructor(recipe: RegisteredElementRecipe) {
        if(recipe.element) this._el = recipe.element;
        else if(recipe.query) this._el = (recipe.parent || document).querySelector(recipe.query) as HTMLElement;
        else this._el = document.createElement(recipe.create || "TEMPLATE");
        
        elementReg.set(this._el, this);
        this._classes(["_mfld", ...recipe.classes || []]);
        // if(!this._el.id) this._el.id = _id();

        this._ops = recipe.ops;
        return this;
    }

    _getDataset() {
        return this._el?.dataset || {};
    }

    _dataset(key: string, value?: string) {
        if(value) this._el.dataset[`${ATTR_PREFIX}${key}`] = value;
        let val = this._el?.dataset[`${ATTR_PREFIX}${key}`];
        return val || val !== undefined ? "T" : "";
    }

    _classes(classes: string | string[], remove = false) {
        if(classes !instanceof Array) classes = [classes as any];
        for(let cls of classes) this._el.classList[remove ? "remove" : "add"]?.(cls);
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

    _position(el: HTMLElement, mode: "after" | "before" | "append" | "prepend" | "appendChild" = "append", clone = true) {
        let newEl = clone ? el.cloneNode(true) : el;
        this._el[mode]?.(newEl);
        return newEl as HTMLElement;
    }

    _empty() {
        this._el.replaceChildren();
    }

    _replaceWith(el: RegisteredElement) {
        this._el?.replaceWith(el._el);
        this._cleanUp();
    }

    _asTempl(classes: string[] = []) {
        let templ = new RegisteredElement({classes, ops: this._ops});
        templ._position(this._el);
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

    _transition(dir: "in" | "out", fn?: Function, after?: Function) {
        let ops = this._ops;
        let dur = ops.trans?.dur?.[dir == "in" ? "shift" : "pop"]?.() || 0;
        if(dur) this._el.style.transitionDuration = `${dur}ms`;
        let transClass = ops?.trans?.class || `${ATTR_PREFIX}trans`;
        ops.trans?.hooks?.[`${dir}-start`]?.(this._el);

        if(dir == "out") {
            _scheduleUpdate(()=> {
                this._classes("out");
                let dimensions;
                if(ops.trans?.smart ?? true) {
                    dimensions = this._dimensions();
                    Object.assign(
                        this._el.style, 
                        { 
                            position: "fixed", 
                            width: dimensions.w, 
                            left: dimensions.left, 
                            top: dimensions.top, 
                            margin: "0" 
                        }
                    );
                }
            })
        }
        else {
            this._classes("in");
            fn?.();
            setTimeout(()=> {
                _scheduleUpdate(()=> {
                    setTimeout(()=> _scheduleUpdate(()=> this._classes(dir, true)), 0);
                });
            }, ops.trans?.swap || 0);
        }

        setTimeout(()=> {
            _scheduleUpdate(()=> {
                if(dir == "out") this._cleanUp();
                else this._classes(transClass, true);
                ops.trans?.hooks?.[`${dir}-end`]?.(this._el);
                this._el.style.transitionDuration = "";
                if(dir == "in") after?.(this);
            });
        }, 
        dur + (dir == "in" && ops.trans?.swap || 0));
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