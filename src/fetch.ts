import { _handlePushState, _parseFunction } from "./util";
import { _scheduleUpdate } from "./updates";
import { _store } from "./store";
import { $fn, $st, FetchInsertionMode } from "./common_types";
import { ExternalOptions, MfldOps } from "./common_types";
import { RegisteredElement } from "./registered_element";

export let _handleFetch = (
  el: RegisteredElement,
  trigger: string,
  fetchOps: MfldOps,
  href: string,
  method?: string,
  func?: Function,
  complete?: Function,
): void => {

  let ev = (e?: Event) => _fetchAndInsert(e, method, fetchOps, href, el, true, func, complete);
  if(trigger === "$mount") ev();
  else el._addListener(trigger, ev);
};

export let _fetchAndInsert = async (
  e: Event | undefined,
  method: string | undefined,
  fetchOps: MfldOps,
  href: string,
  el: RegisteredElement,
  domUpdate: boolean,
  func?: Function,
  complete?: Function,
): Promise<void> => {
  e?.preventDefault();
  e?.stopPropagation();

  if(!method) method = (e?.target as HTMLFormElement)?.method || "get";

  let externalPermissions: ExternalOptions | undefined = fetchOps.fetch?.externals?.find(allowed => {
    return (
      (allowed.domain === "$origin" && (href.startsWith(location.origin) || !href.match(/^(https?):\/\//))) ||
      href.startsWith(allowed.domain)
    );
  });

  if(!externalPermissions) {
    externalPermissions = href.startsWith(location.origin)
      ? { domain: "$origin", script: "selected", style: "selected" }
      : undefined;
  }

  let input = func ? func({ $el: el, $st, $fn }) : undefined;
  let body: FormData | string | undefined = input === "$form"
    ? new FormData((el as RegisteredElement)._el as HTMLFormElement) 
    : input;

  let data = await fetch(href, {
    ...(fetchOps.fetch?.request || {}),
    headers: {
      ...fetchOps.fetch?.request?.headers,
      "MFLD": "true",
    },
    method,
    body: input === "$form" || typeof body === "string" ? body : JSON.stringify(body),
  }).catch(error => {
    fetchOps.fetch?.err?.(error);
  });

  let code = data?.status;
  if(code && fetchOps.fetch?.onCode?.(code, data) === false) return;

  let resp = await data?.[fetchOps.fetch?.resType || "text"]();

  for(let instruction of ["append", "prepend", "inner", "outer"]) {
    let ds = el._attribute(instruction);
    if(ds == null) continue;
    let [selector, toReplace] = ds.split("->").map(s => s.trim());

    let fullMarkup = new DOMParser().parseFromString(resp, 'text/html');
    let inEl = new RegisteredElement("FETCH IN EL",{ parent: fullMarkup, query: selector || "body", ops: fetchOps });

    let [ styles, scripts ] = ["style", "script"].map(tag => Array.from(
      (externalPermissions?.[tag as keyof ExternalOptions] == "all" ? fullMarkup : inEl._el)?.querySelectorAll(tag)
    )) as [HTMLStyleElement[], HTMLScriptElement[]];

    switch(externalPermissions?.style) {
      case "all": styles.forEach(s => inEl?._position(s, "append", false)); break;
      default: styles.forEach(s => s.parentNode?.removeChild(s));
    }

    for(let script of scripts) script.parentNode?.removeChild(script);

    if(inEl) inEl._transition("in", null, ()=> {
      complete?.(el);
      for(let s of scripts) {
        let n = document.createElement("script");
        n.textContent = s.textContent;
        el?._el?.append(n);
      }
    });

    (toReplace ? new RegisteredElement("FETCH OUTEL",{query: toReplace, ops: fetchOps}) : el as RegisteredElement)._transition("out");
  }

  let resolveTxt = el._attribute("resolve");
  let resolveFunc = _parseFunction(resolveTxt || "")?.func;
  resolveFunc?.({ $el: el, $st, $fn, $body: resp });

  if(domUpdate) _handlePushState(el as RegisteredElement, e, href);
};