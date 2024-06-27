import { _handlePushState, _parseFunction, ATTR_PREFIX } from "./util";
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
  el: RegisteredElement | { _dataset: (val: string)=> string },
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
      ? { domain: "$origin", scripts: "selected", styles: "selected" }
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
    let ds = el._dataset(instruction);
    if(!ds) continue;
    let [selector, toReplace] = ds.split("->").map(s => s.trim());

    let fullMarkup = new DOMParser().parseFromString(resp, 'text/html');
    let inEl = new RegisteredElement({ parent: fullMarkup, query: selector || "body", ops: fetchOps });

    if(fullMarkup) {
      let scripts: HTMLScriptElement[] = [];
      if(!externalPermissions?.styles || externalPermissions.styles === "none") fullMarkup.querySelectorAll("style").forEach(s => s.parentNode?.removeChild(s));
      if(externalPermissions?.styles === "all") fullMarkup.querySelectorAll("style").forEach(s => inEl?._position(s, "append", false));
      (externalPermissions?.scripts === "all" ? fullMarkup : inEl._el)?.querySelectorAll("script").forEach(s => {
        if(["all", "selected"].includes(externalPermissions?.scripts || "")) scripts.push(s as HTMLScriptElement);
        s.parentNode?.removeChild(s);
      });

      if(inEl) {
        if(domUpdate) _scheduleUpdate({
          in: inEl,
          out: toReplace ? new RegisteredElement({query: toReplace, ops: fetchOps}) : el as RegisteredElement,
          relation: instruction as FetchInsertionMode,
          ops: fetchOps,
          done: (el) => {
            complete?.(el);
            for(let s of scripts) {
              let n = document.createElement("script");
              n.textContent = s.textContent;
              el?._position(n, "append", false);
            }
          },
        });
        else {
          document.body.appendChild(inEl._el);
          for(let s of scripts) {
            let n = document.createElement("script");
            for(let attr of s.attributes) n.setAttribute(attr.name, attr.value);
            n.textContent = s.textContent;
            inEl._el.before(n);
          }
        }
      }
    }
  }

  let resolveTxt = el._dataset("resolve");
  let resolveFunc = _parseFunction(resolveTxt || "")?.func;
  resolveFunc?.({ $el: el, $st, $fn, $body: resp });

  if(domUpdate) _handlePushState(el as RegisteredElement, e, href);
};