import { type MfldOps, $fn, $st } from "./common_types";
import { _registerInternalStore } from "./util";
import { RegisteredElement } from "./registered_element";
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
  return breakFn?.(sib) ? sib : _iterateSiblings(cb?.(sib) || sib?.[dir as keyof typeof sib] as HTMLElement, breakFn, cb, reverse);
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
  return;
  let startElement = new RegisteredElement({ classes: [`${mode}-start`], ops }),
    templ = el._asTempl([`${mode}-end`]),
    templStore,
    conditional = mode.match(/if|else/),
    conditionalSub = mode.match(/(else|elseif)(\s|$)/), // Whole word match to allow for exact checks later on (otherwise else is greedy)
    newFunc: Function | undefined = undefined,
    prevConditions: string[] = [];

  templ._el.before(startElement._el);

  // Handle conditional elements
  if(conditional) {
    // Get upstream conditions
    if(conditionalSub) {
      let first = _iterateSiblings(startElement._el, (sib) => sib?.classList?.contains(`${ATTR_PREFIX}if-end`), null, true);
      _iterateSiblings(first, sib => sib == templ._el, sib => {
        if(sib?.dataset?.[`${ATTR_PREFIX}cstore`]) prevConditions.push(sib.dataset[`${ATTR_PREFIX}cstore`] || "");
      });
    }

    // Create function
    newFunc = () => {
      if(conditionalSub) {
        for(let d of prevConditions) {
          if($st[d]) return false;
        }
      }
      return conditionalSub?.[0] === "else" ? true : func?.({ el, $st, $fn }) === true;
    };
  }

  templStore = _registerInternalStore([...dependencyList, ...prevConditions], conditional ? newFunc : func, templ);

  // Clear old elements
  templStore.sub(val => {
    if(val === undefined) return;
    _scheduleUpdate(() => {
      _iterateSiblings(startElement._el.nextElementSibling as HTMLElement, sib => sib?.classList?.contains(`${mode}-end`), sib => {
        new RegisteredElement({ element: sib as HTMLElement, ops })._transition("out");
      });

      if(conditional && !val) return;

      _iterable(mode.match(/each/) ? val : [val], (val, key) => {
        let item = templ._el.cloneNode(true) as HTMLTemplateElement;
        if(!conditional) {
          let html = templ._el.innerHTML.replace(/\$:{([^}]*)}/g, (_, cap) => _parseFunction(cap, as[0], as[1]).func?.({ $el: el, $st, $fn, [as[0]]: val, [as[1]]: key }) || "") || "";
          if(item.innerHTML) item.innerHTML = html;
        }

        for(let element of Array.from(item.content.children) as HTMLElement[]) {
          if(!element.innerHTML) element.innerHTML = String(val);
          templ._position(element, "before", false);
          new RegisteredElement({element: element as HTMLElement, ops})._transition("in");
        }
      });
    });
  });
};