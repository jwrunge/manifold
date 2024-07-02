import { _commaSepRx, _getOpOverrides, _handlePushState, _parseFunction, _registerInternalStore, ATTR_PREFIX } from "./util";
import { _handleFetch } from "./fetch";
import { MfldOps, $fn, $st } from "./common_types";
import { Store } from "./store";

let _ops: Partial<MfldOps> = {};
let _modes = ["bind", "sync", "get", "head", "post", "put", "delete", "patch", "promote"];

export let _setOptions = (newops: Partial<MfldOps>, profileName?: string): void => {
    if(profileName) _ops.profiles = { ..._ops.profiles, [profileName]: newops };
    else _ops = { ..._ops, ...newops };
}

window.addEventListener("popstate", () => {
    location.reload();
});

export class RegisterdElement {
    el: HTMLElement | null = null;
    listeners: { [key: string]: EventListenerObject } = {};
    stores: { [key: string]: Store<any> } = {};

    constructor(el: HTMLElement) {
        this.el = el;
    }

    addListener(event: string, listener: EventListenerObject) {
        this.listeners[event] = listener;
        this.el?.addEventListener(event, listener);
    }

    addInternalStore(name: string, store: Store<any>) {
        this.stores[name] = store;
    }

    cleanUp() {
        for(let [event, listener] of Object.entries(this.listeners)) {
            this.el?.removeEventListener(event, listener);
        }

        // for(let store of Object.values(this.stores)) {
        //     store.();
        // }

        this.el?.remove();
        this.el = null
    }
}

export let _register = (parent?: HTMLElement | null, noparent = false): void => {
    console.log("Registering", parent);
    if(!parent || parent?.nodeType == Node.TEXT_NODE) return;

    let els: NodeListOf<HTMLElement> = (parent).querySelectorAll(
        `[${ATTR_PREFIX}${_modes.join(`],[${ATTR_PREFIX}`)}]`
    );

    for(let el of (noparent ? [...els] : [parent, ...els])) {
        if(el.classList.contains("_mfld")) continue;
        el.classList.add("_mfld");

        let regEl = new RegisterdElement(el);

        console.log("Registering", el);
        let _op_overrides = _getOpOverrides(structuredClone(_ops), el);

        console.log(el.attributes)
        for(let attr of el.attributes) {
            if(!attr.name.startsWith(ATTR_PREFIX) || attr.value === null) continue;
            let _strippedMode = attr.name.replace(ATTR_PREFIX, "");

            // Handle promote
            if(_strippedMode == "promote") {
                let [mode, href, input, trigger] = el.tagName == "A" ?
                    ["get", (el as HTMLAnchorElement).href, undefined, "click"] :
                    [(el as HTMLFormElement).method?.toLowerCase(), (el as HTMLFormElement).action, () => "$form", "submit"];
                if(href) _handleFetch(el, trigger, _op_overrides, href, mode, input, (el: HTMLElement)=> _register(el));
                continue;
            }

            // Handle attribute parsing
            for(let setting of el.getAttribute(attr.name)?.split(";;") || [""]) {
                let isFetch = !/bind|sync/.test(attr.name) ? true : false,
                    parts = setting?.split(/\s*->\s*/g),
                    href = isFetch ? parts.pop() || "" : "",
                    triggers = (isFetch || _strippedMode == "sync") ? (parts.shift()?.match(/[^\(\)]{1,}/g)?.pop()?.split(_commaSepRx)?.map(s => s.trim()) || []) : null,
                    funcStr = parts?.[0] || "";

                console.log(_strippedMode, "SETTING:", setting, "TRIGGERS:", triggers, "FUNCSTR:", funcStr, "HREF:", href)
                let { func, as, dependencyList } = _parseFunction(funcStr);
                console.log("FUNC FROM STR", funcStr, func)
                // el._addFunc(func);

                if(!triggers) { 
                    _registerInternalStore(el, func, dependencyList); 
                    continue;
                }

                // Handle triggered events (sync, fetch)
                for(let trigger of triggers) {
                    console.log("HANDLING TRIGGERS", _strippedMode)
                    if(_strippedMode == "sync") {
                        console.log(el, $st, $fn, func)
                        let ev = (e?: Event): void => {
                            func?.({$el: el, $st, $fn});
                            _handlePushState(el, e);
                        }

                        if(trigger === "$mount") ev();
                        else el.addEventListener(trigger, ev);
                    }
                    else _handleFetch(el, trigger, _op_overrides, href, _strippedMode, func);
                }
            }
        }
    }
}

_register(document.body);