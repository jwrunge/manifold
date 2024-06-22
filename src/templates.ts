import { type MfldOps, $fn, $st } from "./common_types";
import { _iterable, _iterateSiblings, _registerInternalStore } from "./util";
import { RegisteredElement } from "./registered_element";
import { _register } from "./registrar";
import { _applyTransition, _scheduleUpdate } from "./updates";
import { _parseFunction, ATTR_PREFIX } from "./util";

export let _handleTemplates = (
  el: RegisteredElement,
  mode: string,
  as: string[],
  func: Function | undefined,
  dependencyList: string[],
  ops: MfldOps
): void => {
  let startElement = new RegisteredElement({ classes: [`${mode}-start`] }),
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
        for (let d of prevConditions) {
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
        if(sib) _applyTransition(new RegisteredElement({ element: sib as HTMLElement }), "out", ops, () => sib.remove());
      });

      if(conditional && !val) return;

      _iterable(mode.match(/each/) ? val : [val], (val, key) => {
        let item = templ._el.cloneNode(true) as HTMLTemplateElement;
        if(!conditional) {
          let html = templ._el.innerHTML.replace(/\$:{([^}]*)}/g, (_, cap) => _parseFunction(cap, as[0], as[1]).func?.({ $el: el, $st, $fn, [as[0]]: val, [as[1]]: key }) || "") || "";
          if(item.innerHTML) item.innerHTML = html;
        }

        for (let element of Array.from(item.content.children)) {
          if(!element.innerHTML) element.innerHTML = String(val);
          templ._el.before(element);
          _applyTransition(new RegisteredElement({element: element as HTMLElement}), "in", ops);
        }
      });
    });
  });
};