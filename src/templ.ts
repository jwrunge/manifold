import { $fn, $st } from "./common_types";
import { _fetchAndInsert } from "./fetch";
import { _register } from "./registrar";
import { Store } from "./store";
import { _scheduleUpdate, _transition } from "./updates";
import { _parseFunction, _registerInternalStore } from "./util";

let _templAttributes = ["if", "elseif", "else", "eval", "each"];
let _innerHTML: keyof Element = "innerHTML";

let _swapInnerHTML = (el: HTMLElement, newEl: HTMLElement) => {
    el[_innerHTML] = newEl[_innerHTML];
    newEl[_innerHTML] = "";
}

let _iterable = <T>(obj: Iterable<T> | { [key: string]: T }, cb: (value: T, key: string | number) => void): void => {
    if(obj instanceof Map) {
        for(let[key, value] of obj.entries()) cb(value, key);
    } else {
        try {
            let arr = Array.isArray(obj) ? obj : Array.from(obj as Array<any>);
            if(arr.length) arr.forEach(cb);
            else for(let key in obj) cb((obj as any)[key], key);
        } catch (e) {
            console.error(`MFLD: ${obj} is not iterable`);
        }
    }
};

function _handleAttribute(self: MfldTemplElement, mode: string, detail: string | null) {
    let { func, as, dependencyList } = _parseFunction(detail ||""),
        prevConditions: string[] = [],
        isConditional = mode.match(/if|else/),
        modFunc;
    
    as = as || ["$val", "$key"];

    // Handle elses
    if(mode.match(/else/)) {
        let prev = self as MfldTemplElement,
            recurseCount = 0;

        // Loop backward to find previous if/elseif conditions
        while(prev = prev?.previousElementSibling as MfldTemplElement) {
            let attrToGet = "if";
            prev.getAttribute("if") ? attrToGet = "if" : prev.getAttribute("elseif") ? attrToGet = "elseif" : attrToGet = "";
            attrToGet && prevConditions.push(prev._stores.get(attrToGet)?.name || "");

            if(recurseCount++ > 100) {
                console.error("MFLD: No if start found");
                break;
            }
            if(prev.getAttribute("if")) break; 
        }

        dependencyList = [ ...(dependencyList || []), ...prevConditions ];

        // Inject previous conditions into this conditions determiner
        modFunc = () => {
            for(let d of prevConditions) {
                if($st[d]) return false;
            }
            return mode == "else" ? true : func?.({ $st, $fn }) === true;
        };
    }
    else modFunc = func;

    // Subscription function - on change, update the template
    let sub = (val: any) => {
        console.log("RUNNING SUB", val)
        if(val === undefined) return;   // Never update on undefined

        // Transition out all elements from the previous condition
        let container = document.createElement("span");
        _swapInnerHTML(container, self);
        self.before(container);
        _transition(container, "out");

        if(isConditional && !val) return; // Handle no value for conditional templates

        // Iterate over all values (only one if not each) and transition them in
        _iterable(mode == "each" ? val : [val], (val: any, key: any) => {
            let item = self._templ?.cloneNode(true) as HTMLTemplateElement;
            if(!isConditional) {
                item.innerHTML = (item[_innerHTML] as string)?.replace(
                    /\$:{([^}]*)}/g, (_, cap) => _parseFunction(cap, as[0], as[1]).func?.({ $st, $fn, [as[0]]: val, [as[1]]: key }) ?? ""
                ) 
                || String(val);
            }

            // Transition in
            self.append(item.content);
            _transition(self, "in", ()=> _register(self, true));
        });
    }

    // Register the store
    let S = _registerInternalStore(
        self,
        modFunc, 
        dependencyList,
        sub
    );

    // Track details for cleanup
    if(modFunc) self._funcs.add(modFunc);
    self._stores.set(mode, S);
}

export class MfldTemplElement extends HTMLElement {
    _templ: HTMLTemplateElement | null = null;
    _funcs: Set<Function | null> = new Set();
    _stores: Map<string, Store<any>> = new Map();

    connectedCallback(): void {
        // Convert to template
        this._templ = this.querySelector("template") || (()=> {
            let T = document.createElement("template");
            _swapInnerHTML(T, this)
            return T;
        })();

        // Initialize attributes in order of execution
        let found = "";
        for(let attr of _templAttributes) {
            let val = this.getAttribute(attr);
            if(val != null) {
                if(found) console.error(`MFLD: Multiple templ statements '${found}' and '${attr}'; '${found}' ignored`);
                found = attr;
            }
            val !== null && _handleAttribute(this, attr, val);
        }
    }

    disconnectedCallback(): void {
        // for(let store of this._stores) store.destroy();
        this._funcs.forEach(func=> func = null);
    }

    static get observedAttributes() {
        return _templAttributes;
    }
}

// @ts-ignore
if(!window.templ) window.templ = customElements.define("mf-templ", MfldTemplElement);