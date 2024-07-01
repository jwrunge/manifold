import { type MfldOps, $fn, $st } from "./common_types";
import { _transition, RegisteredElement } from "./registered_element";
import { _register } from "./registrar";
import { _scheduleUpdate } from "./updates";
import { _parseFunction, ATTR_PREFIX } from "./util";

// Iterates over an element's siblings until a condition is met
let _iterateSiblings = (
  sib?: HTMLElement | null, 
  breakFn?: ((sib?: HTMLElement | null) => boolean | undefined) | null, 
  cb?: ((sib?: HTMLElement | null) => void) | null, 
  reverse: boolean = false
): HTMLElement | null | undefined => {
  let dir = reverse ? "previousElementSibling" : "nextElementSibling";
  return (!sib || breakFn?.(sib)) ? sib : _iterateSiblings(cb?.(sib) || sib?.[dir as keyof typeof sib] as HTMLElement, breakFn, cb, reverse);
};

// Iterates over an iterable object or an object's properties
export let _iterable = <T>(obj: Iterable<T> | { [key: string]: T }, cb: (value: T, key: string | number) => void): void => {
  if(obj instanceof Map) {
      for(let[key, value] of obj.entries()) cb(value, key);
  } else {
      try {
          let arr = Array.isArray(obj) ? obj : Array.from(obj as Array<any>);
          if(arr.length) arr.forEach(cb);
          else for(let key in obj) cb((obj as any)[key], key);
      } catch (e) {
          console.error(`${obj} is not iterable`);
      }
  }
};

export let _handleTemplates = (
  el: RegisteredElement,
  mode: string,
  as: string[],
  func: Function | undefined,
  dependencyList: string[],
  ops: MfldOps
): void => {
  let templ = el._asTempl([`${mode}-end`]),
    newFunc,
    conditional = mode.match(/if|else/),
    conditionalSub = mode.match(/else/),
    prevConditions: string[] = [];

  // Add the start element to the DOM
  if(!conditional || mode == "if") {
    let startElement = document.createElement("template");// new RegisteredElement("FROM START EL", { classes: [`${mode}-start`], ops, _position: { ref: templ, mode: "before" }}),
    startElement.classList.add(`${mode}-start`);
    templ._position(startElement, "before");
  }

  // Handle conditional elements
  if(conditional) {
    // Get all previous condition stores to derive this condition's value
    _iterateSiblings(templ._el, 
      (sib) => sib?.classList?.contains(`if-start`), 
      sib=> {
        let storeRef = sib?.getAttribute(`${ATTR_PREFIX}cstore`);
        if(storeRef) prevConditions.push(storeRef);
      }, 
      true
    );

    // Inject previous conditions into this conditions determiner
    newFunc = templ._addFunc(() => {
      if(conditionalSub) {
        for(let d of prevConditions) {
          if($st[d]) console.log(mode, "RETURNING FALSE BASED ON CONDITION", d);
          if($st[d]) return false;
        }
      }
      console.log(mode, mode == "else" ? "RETURNING IMPLICIT TRUE" : "RETURNING " + (func?.({ el, $st, $fn }) === true));
      return mode == "else" ? true : func?.({ el, $st, $fn }) === true;
    });
  }

  // Subscription function - on change, update the template
  let sub = (val: any) => {
    if(val === undefined) return;   // Never update on undefined
    if(conditional && !val) return; // Handle no value for conditional templates

    _scheduleUpdate(() => {
      // Transition out all elements from the previous condition
      let start = _iterateSiblings(
        templ._el.previousElementSibling as HTMLElement, 
        sib => sib?.classList?.contains(`if-start`), 
        sib => { if(sib?.nodeName != "TEMPLATE") _transition(sib as HTMLElement, "out", ops, func) },
        true
      );

      _scheduleUpdate(()=> {
        let ifend = start?.nextElementSibling as HTMLElement; //Delay to next update to ensure all elements are removed

        // Iterate over all values (only one if not each) and transition them in
        _iterable(mode == "each" ? val : [val], (val, key) => {
          let item = templ._el.cloneNode(true) as HTMLTemplateElement;
          if(!conditional) {
            let html = templ._el.innerHTML.replace(/\$:{([^}]*)}/g, (_, cap) => _parseFunction(cap, as[0], as[1]).func?.({ $el: el, $st, $fn, [as[0]]: val, [as[1]]: key }) || "") || "";
            if(item.innerHTML) item.innerHTML = html;
          }

          // Iterate over the template's children and transition them in
          for(let element of Array.from(item.content.children) as HTMLElement[]) {
            if(!element.innerHTML) element.innerHTML = String(val);
            // templ._position(element, "before");
            ifend.before(element);
            _transition(element, "in", ops)//, null, ()=> _register(element, true));
          }
        });
      });
    });
  }

  templ._registerInternalStore(
    conditional ? newFunc : func, 
    [...dependencyList, ...prevConditions],
    sub
  )
}