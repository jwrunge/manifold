import { MfldOps, $fn, $st } from "./common_types";
import { _register } from "./registrar";
import { _store } from "./store";
import { _scheduleUpdate } from "./updates";
import { _id, ATTR_PREFIX } from "./util";

export let elementReg = new Map<HTMLElement, RegisteredElement>();

type RegisteredElementRecipe = {
    parent?: Document | HTMLElement;
    element?: HTMLElement | null;
    query?: string;
    create?: string,
    classes?: string[],
    _position?: {
        ref: RegisteredElement,
        mode?: Positions,
    },
    ops: MfldOps,
}

type Positions = "before" | "after" | "append" | "prepend" | "appendChild";

export let _registerElement = (el: HTMLElement, ops: MfldOps) => {
    return elementReg.get(el) || new RegisteredElement("REGISTER ELEMENT FN",{ element: el, ops });
}

export let _transition = (el: HTMLElement, dir: "in" | "out", ops: MfldOps, fn?: Function | null, after?: Function | null) => {
    console.log("TRANSITIONING", dir);
    (elementReg.get(el) || new RegisteredElement("TRANSITION "+dir,{ element: el, ops }))?._transition(dir, fn, after);
}

export class RegisteredElement {
    // @ts-ignore
    _el: HTMLElement;
    _listeners: Map<string, any> | null = new Map();
    _funcs: Set<Function> | null = new Set();
    _ops: MfldOps;

    constructor(from: string, recipe: RegisteredElementRecipe) {
        let el: HTMLElement | null;
        if(recipe.element) el = recipe.element;
        else if(recipe.query) el = (recipe.parent || document).querySelector(recipe.query) as HTMLElement;
        else el = document.createElement(recipe.create || "TEMPLATE");
        
        this._el = el;

        elementReg.get(this._el)?._cleanUp(false);
        elementReg.set(this._el, this);
        console.log("CREATING regel from", from, this._el, elementReg.get(this._el), elementReg.size)

        this._classes(["_mfld", ...recipe.classes || []]);

        if(recipe._position) recipe._position.ref._position(el, recipe._position.mode, false);
        this._ops = recipe.ops;
        return this;
    }

    _attribute(key: string, value?: string) {
        if(value) this._el?.setAttribute(`${ATTR_PREFIX}${key}`, value);
        let val = this._el?.getAttribute(`${ATTR_PREFIX}${key}`);
        return val ?? null;
    }

    _classes(classes: string[], remove = false) {
        for(let cls of classes) this._el?.classList[remove ? "remove" : "add"]?.(cls);
    }

    _query(query: string, all = true) {
        // @ts-ignore
        return this._el?.["querySelector".concat(all ? "All" : "")](query) as NodeListOf<HTMLElement> | HTMLElement | null;
    }

    _addListener(trigger: string, func: any) {
        let F = ()=> func({$el: this._el, $st, $fn})
        this._el?.addEventListener(trigger, F);
        this._listeners?.set(trigger, F);
    }

    _addFunc(func?: Function) {
        if(func) this._funcs?.add(func);
        return func;
    }

    _registerInternalStore(func?: Function, dependencyList?: string[], sub?: (val: any)=> void) {
        let id = _id();
        this._attribute("cstore", id);
        this._addFunc(func);

        let S = _store(id, {
            updater: () => func?.({ $el: this._el, $st, $fn }),
            dependencyList,
            scope: this,
        });

        if(sub) {
            this._addFunc(sub);
            S.sub(sub);
        }
        return S;
    }

    _position(el: HTMLElement, mode: Positions = "append", clone = true) {
        let newEl = clone ? el.cloneNode(true) : el;
        this._el?.[mode]?.(newEl);
        return newEl as HTMLElement;
    }

    _replaceWith(el: RegisteredElement) {
        this._el?.replaceWith(el._el);
        this._cleanUp();
    }

    _asTempl(classes: string[] = []) {
        if(this._el?.tagName == "TEMPLATE") {
            this._classes(classes);
            return this;
        }
        let templ = new RegisteredElement("As TeMPL", {classes, ops: this._ops, _position: {ref: this}});
        (templ._el as HTMLTemplateElement).content?.append(this._el.cloneNode(true));
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

    _transition(dir: "in" | "out", fn?: Function | null, after?: Function | null) {
        _scheduleUpdate(()=> {
            if(dir == "out") {
                console.log("OUT", this._el)
                this._cleanUp();
            }
            after?.();
        });
    }

    // _transition(dir: "in" | "out", fn?: Function | null, after?: Function) {
    //     let el = this._el,
    //         ops = this._ops,
    //         dur = ops.trans?.dur?.[dir == "in" ? "shift" : "pop"]?.() || 0;

    //     if(dur && el) el.style.transitionDuration = `${dur}ms`;
    //     let transClass = ops?.trans?.class || `${ATTR_PREFIX}trans`;
    //     ops.trans?.hooks?.[`${dir}-start`]?.(el);

    //     if(dir == "out") {
    //         _scheduleUpdate(()=> {
    //             this._classes(["out"]);
    //             let dimensions;
    //             if(ops.trans?.smart ?? true) {
    //                 dimensions = this._dimensions();
    //                 Object.assign(
    //                     el.style, 
    //                     { 
    //                         position: "fixed", 
    //                         width: dimensions.w, 
    //                         left: dimensions.left, 
    //                         top: dimensions.top, 
    //                         margin: "0" 
    //                     }
    //                 );
    //             }
    //         })
    //     }
    //     else {
    //         this._classes(["in"]);
    //         fn?.();
    //         setTimeout(()=> {
    //             _scheduleUpdate(()=> {
    //                 this._classes([dir], true);
    //             });
    //         }, ops.trans?.swap || 0);
    //     }

    //     setTimeout(()=> {
    //         _scheduleUpdate(()=> {
    //             if(dir == "out") this._cleanUp();
    //             else {
    //                 this._classes([transClass], true);
    //                 console.log("REGISTERING", this._el)
    //                 _register(this._el, true);
    //             }
    //             ops.trans?.hooks?.[`${dir}-end`]?.(el);
    //             el.style.transitionDuration = "";
    //             if(dir == "in") after?.(this);
    //         });
    //     }, 
    //     dur + (dir == "in" && ops.trans?.swap || 0));
    // }

    _cleanUp(removeElement = true) {
        console.log("CLEANING", this._el, elementReg.get(this._el), elementReg.size -1)

        // Clear listeners and funcs
        this._listeners?.forEach((func, trigger) => {
            this._el?.removeEventListener(trigger, func);
        });

        this._funcs?.forEach((func) => {
            this._funcs?.delete(func);
        });

        // Clear children
        (this._query("._mfld", true) as NodeListOf<HTMLElement>)?.forEach(child => {
            elementReg.get(child as HTMLElement)?._cleanUp();
        });

        this._funcs = this._listeners = null;

        //Clear references
        if(removeElement) this._el.remove();
        elementReg.delete(this._el);
    }
}

window.reg = elementReg;