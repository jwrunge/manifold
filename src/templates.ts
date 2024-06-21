import { type MfldOps, $fn, $st } from "./common_types";
import { _ensureTemplate, _iterable, _iterateSiblings, _registerInternalStore } from "./domutil";
import { _register } from "./registrar";
import { _applyTransition, _scheduleUpdate } from "./updates";
import { _parseFunction, ATTR_PREFIX } from "./util";

export let _handleTemplates = (
  el: HTMLElement,
  mode: string,
  as: string[],
  func: Function | undefined,
  dependencyList: string[],
  ops: MfldOps
): void => {
  let startElement = document.createElement("template"),
    templ = _ensureTemplate(el.cloneNode(true) as HTMLElement) as HTMLTemplateElement,
    templStore,
    conditional = mode.match(/if|else/),
    conditionalSub = mode.match(/(else|elseif)(\s|$)/), // Whole word match to allow for exact checks later on (otherwise else is greedy)
    newFunc: Function | undefined = undefined,
    prevConditions: string[] = [];

  startElement.classList.add(`${mode}-start`);
  templ.classList.add(`${mode}-end`);

  el.before(startElement);
  el.after(templ);
  el.remove();

  // Handle conditional elements
  if(conditional) {
    // Get upstream conditions
    if(conditionalSub) {
      let first = _iterateSiblings(startElement, (sib) => sib?.classList?.contains(`${ATTR_PREFIX}if-end`), null, true);
      _iterateSiblings(first, sib => sib == templ, sib => {
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
  templ.dataset[`${ATTR_PREFIX}cstore`] = templStore.name;

  // Clear old elements
  templStore.sub(val => {
    if(val === undefined) return;
    _scheduleUpdate(() => {
      _iterateSiblings(startElement?.nextElementSibling as HTMLElement, sib => sib?.classList?.contains(`${mode}-end`), sib => {
        if(sib) _applyTransition(sib as HTMLElement, "out", ops, () => sib.remove());
      });

      if(conditional && !val) return;

      _iterable(mode.match(/each/) ? val : [val], (val, key) => {
        let item = templ.cloneNode(true) as HTMLTemplateElement;
        if(!conditional) {
          let html = templ.innerHTML.replace(/\$:{([^}]*)}/g, (_, cap) => _parseFunction(cap, as[0], as[1]).func?.({ $el: el, $st, $fn, [as[0]]: val, [as[1]]: key }) || "") || "";
          if(item.innerHTML) item.innerHTML = html;
        }

        for (let element of Array.from(item.content.children)) {
          if(!element.innerHTML) element.innerHTML = String(val);
          templ.before(element);
          _applyTransition(element as HTMLElement, "in", ops);
        }
      });
    });
  });
};