import { _handlePushState, _parseFunction, ATTR_PREFIX } from "./util";
import { _scheduleUpdate } from "./updates";
import { _register } from "./registrar";
import { _store } from "./store";
import { $fn, $st } from "./index";
import { ExternalOptions, MfldOps } from "./common_types";

export const _handleFetch = (
  el: HTMLElement,
  trigger: string,
  fetchOps: MfldOps,
  href: string,
  method?: string,
  func?: Function
): void => {
  const ev = (e?: Event) => _fetchAndInsert(e, method, fetchOps, href, el, true, func);

  if(trigger === "$mount") ev();
  else el.addEventListener(trigger, ev);
};

export const _fetchAndInsert = async (
  e: Event | undefined,
  method: string | undefined,
  fetchOps: MfldOps,
  href: string,
  el: HTMLElement | { dataset: { [key: string]: string } },
  domUpdate: boolean,
  func?: Function
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
  let body: FormData | string | undefined = input === "$form" ? new FormData(el as HTMLFormElement) : input;

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

  for (let instruction of ["append", "prepend", "inner", "outer"] as const) {
    let ds = el.dataset[`${ATTR_PREFIX}${instruction}`];
    if(ds === undefined) continue;
    let [selector, toReplace] = ds.split("->").map(s => s.trim());

    let fullMarkup = new DOMParser().parseFromString(resp, 'text/html');
    let inEl = fullMarkup.querySelector<HTMLElement>(selector || "body");

    if(fullMarkup) {
      let scripts: HTMLScriptElement[] = [];
      if(!externalPermissions?.styles || externalPermissions.styles === "none") fullMarkup.querySelectorAll("style").forEach(s => s.parentNode?.removeChild(s));
      if(externalPermissions?.styles === "all") fullMarkup.querySelectorAll("style").forEach(s => inEl?.appendChild(s));
      (externalPermissions?.scripts === "all" ? fullMarkup : inEl)?.querySelectorAll("script").forEach(s => {
        if(["all", "selected"].includes(externalPermissions?.scripts || "")) scripts.push(s as HTMLScriptElement);
        s.parentNode?.removeChild(s);
      });

      if(domUpdate && inEl) _scheduleUpdate({
        in: inEl,
        out: toReplace ? document.querySelector<HTMLElement>(toReplace) : el as HTMLElement,
        relation: instruction,
        ops: fetchOps,
        done: (el) => {
          _register(el);
          for (let s of scripts) {
            let n = document.createElement("script");
            n.textContent = s.textContent;
            el?.appendChild(n);
          }
        },
      });
      else if(inEl) {
        document.body.appendChild(inEl);
        for (let s of scripts) {
          let n = document.createElement("script");
          for (let attr of s.attributes) n.setAttribute(attr.name, attr.value);
          n.textContent = s.textContent;
          inEl.before(n);
        }
      }
    }
  }

  let resolveTxt = el.dataset?.[`${ATTR_PREFIX}resolve`];
  let resolveFunc = _parseFunction(resolveTxt || "")?.func;
  resolveFunc?.({ $el: el, $st, $fn, $body: resp });

  if(domUpdate) _handlePushState(el as HTMLElement, e, href);
};