import { _handlePushState, _parseFunction } from "./util";
import { _scheduleUpdate, _transition } from "./updates";
import { _store } from "./store";
import { $fn, $st } from "./common_types";
import { ExternalOptions, MfldOps } from "./common_types";

export let _handleFetch = (
	el: HTMLElement,
	trigger: string,
	fetchOps: MfldOps,
	href: string,
	method?: string,
	func?: Function,
	complete?: Function,
): void => {
	let ev = (e?: Event) => _fetchAndInsert(e, method, fetchOps, href, el, true, func, complete);
	if(trigger === "$mount") ev();
	else el.addEventListener(trigger, ev);
};

let _handlePermissions = (ops: MfldOps, href: string, fullMarkup: Document, inEl: HTMLElement)=> {
	let externalPermissions: ExternalOptions | undefined = ops.fetch?.externals?.find(allowed => {
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

	let [ styles, scripts ] = ["style", "script"].map(tag => Array.from(
		(externalPermissions?.[tag as keyof ExternalOptions] == "all" ? fullMarkup : inEl)?.querySelectorAll(tag)
	)) as [HTMLStyleElement[], HTMLScriptElement[]];

	switch(externalPermissions?.style) {
		case "all": styles.forEach(s => inEl?.append(s)); break;
		default: styles.forEach(s => s.parentNode?.removeChild(s));
	}

	for(let script of scripts) script.parentNode?.removeChild(script);
	return scripts;
}	

export let _fetchAndInsert = async (
	e: Event | undefined,
	method: string | undefined,
	fetchOps: MfldOps,
	href: string,
	el: HTMLElement,
	domUpdate: boolean,
	func?: Function,
	complete?: Function,
): Promise<void> => {
	e?.preventDefault();

	// Handle fetch body
	let input = func ? func({ $el: el, $st, $fn }) : undefined,
		body: FormData | string | undefined = input === "$form"
			? new FormData(el as HTMLFormElement) 
			: input,
		// Get response
		data = await fetch(href, {
			...(fetchOps.fetch?.request || {}),
			headers: {
				...fetchOps.fetch?.request?.headers,
				"MFLD": "true",
			},
			method: method || (e?.target as HTMLFormElement)?.method || "get",
			body: input === "$form" || typeof body === "string" ? body : JSON.stringify(body),
		}).catch(error => {
			fetchOps.fetch?.err?.(error);
		}),
		// Response code for callback
		code = data?.status,
		// Response text
		resp = await data?.[fetchOps.fetch?.resType || "text"]();

	// Handle code callback
	if(code && fetchOps.fetch?.onCode?.(code, data) === false) return;

	// Handle response insertion
	for(let instruction of ["append", "prepend", "insert", "replace"]) {
		let ds = el.getAttribute(instruction);
		if(ds == null) continue;

		let [selector, toReplace] = ds.split("->").map(s => s.trim()),
			fullMarkup = new DOMParser().parseFromString(resp, 'text/html'),
			inEl = fullMarkup.querySelector(selector) as HTMLElement,
			scripts = _handlePermissions(fetchOps, href, fullMarkup, inEl);

		if(inEl) _transition(inEl, "in", ()=> {
			complete?.(el);
			for(let s of scripts) {
				let n = document.createElement("script");
				n.textContent = (s).textContent;
				el?.append(n);
			}
		});

		_transition(toReplace ? el.querySelector(toReplace) as HTMLElement : el, "out");
	}

	// Resolve callback
	let resolveTxt = el.getAttribute("resolve"),
		resolveFunc = _parseFunction(resolveTxt || "")?.func;
	resolveFunc?.({ $el: el, $st, $fn, $body: resp });

	if(domUpdate) _handlePushState(el as HTMLElement, e, href);
};