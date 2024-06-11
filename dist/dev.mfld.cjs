let t="mf_",e=/[\.\[\]\?]{1,}/g,n=/, {0,}/g
function i(){return`${Date.now()}.${Math.floor(1e5*Math.random())}`}function o(e,n,i,o=!0,r="{}",s){let l=n.dataset[`${t}${e}`]
if(l)return"overrides"==e?i.profiles?.[l||""]?.fetch||JSON.parse(l||"{}"):o?JSON.parse(l||r):"num"==s?parseInt(l)||void 0:"bool"==s?"true"==l||"false"!=l&&void 0:l}function r(t,e){let n=o("overrides",e,t)
return{profiles:t.profiles,fetch:{...t.fetch,responseType:o("responsetype",e,t,!1)||t.fetch?.responseType,...n?.fetch||{},...o("fetch",e,t)||{}},trans:{...t.trans,dur:o("transdur",e,t,!0,"[]","num")||t.trans?.dur,swap:o("transswap",e,t,!1,"","num")||t.trans?.swap,class:o("transclass",e,t,!1)||t.trans?.class,smartTransition:o("transsmart",e,t,!1,void 0,"bool")||t.trans?.smartTransition,...n?.trans||{},...o("trans",e,t)||{}}}}function s(i){"string"!=typeof i&&((i=i?.el?.dataset?.[i?.datakey]||"")||null==i?.el?.dataset?.[`${t}else`]||(i="return true"))
let[o,r]=i?.split("=>")?.map((t=>t.trim()))?.reverse()||["",""],[s,l]=o?.split(/\s{1,}as\s{1,}/)||[o,"value"],a=l?.split?.(n)?.map?.((t=>t.trim()))||["value"],f=r?.split(",")?.map((t=>t.replace(/[()]/g,"").trim()))||[],u=globalThis[s]||MfFn[s]
if(!u){f?.length||s.includes("=>")||(s.match(/\(|\)/)?f=s.match(/\([^\)]{1,}\)/)?.[0]?.replace(/[\(\) ]/g,"").split(",").filter((t=>!t.match(/[\"\'\`]/)))||[]:(f=[s],s=`return ${s}`)),f=function(t){return"string"==typeof t&&(t=t.split(/\s{0,},\s{0,}/)),t.map((t=>t.split(e)?.[0]))||[]}(f),s.match(/^\s{0,}\{/)||s.includes("return")||(s=s.replace(/^\s{0,}/,"return "))
try{u=new Function(...f,s)}catch(t){console.error(t)}}return{valueList:f,func:u,as:a}}let l,a=[],f=!1,u=[],c=""
function p(t){a.push(t),f||(f=!0,requestAnimationFrame(m))}function d(t,e,n,i=!1,o){if(!o.trans?.smartTransition??1)return
l=document.createElement("div")
let{paddingTop:r,paddingBottom:s}=e instanceof Element?window.getComputedStyle(e):{paddingTop:0,paddingBottom:0}
c=l.style.height=`calc(${Math.abs(n-(t?.clientHeight||0))}px - ${r} - ${s})`,e?.after(l)}function h(t,e){if(!e.trans?.smartTransition??1)return
let n=(e?.trans?.dur?.[0]||e?.trans?.dur||600)/2
p((()=>{l?.remove(),t?.animate?.([{height:c},{height:`${t.clientHeight||0}px`}],n)}))}function m(){f=!1
for(let t of a)if("function"==typeof t)t()
else{let e=t.out?t.out.clientHeight:0
if("prepend"==t.relation)d?.(t.in,t.out,e,!1,t.ops),$(t.in,"in",t.ops,(()=>{t.in&&t.out?.prepend(t.in),h?.(t.in,t.ops)}))
else{if(["swapinner","swapouter"].includes(t.relation)){let e=t.out?.cloneNode(!0)
if(e){t.out?.after(e)
let n="swapinner"==t.relation
"swapinner"==t.relation&&(e.style.border="none",t.out.replaceChildren()),$(e,"out",t.ops,void 0,t.out,n)}}d?.(t.in,t.out,e,!1,t.ops),$(t.in,"in",t.ops,(()=>{t.in&&("swapouter"==t.relation?t.out?.replaceWith(t.in):t.out?.appendChild(t.in)),h?.(t.in,t.ops)}))}t.done?.(t.in)}for(let t of u)t()
u=[],a=[]}function $(e,n,i,o,r,s=!1){if(e?.nodeType==Node.TEXT_NODE){let t=e.textContent,n=document?.createElement("div")
n.textContent=t,e.replaceWith(n),e=n}if(e){let l=Array.isArray(i.trans?.dur)?i.trans?.dur["in"==n?0:1]||i.trans?.dur[0]:i.trans?.dur||0,a=i?.trans?.class||`${t}trans`
if(e?.classList?.add(a),i.trans?.hooks?.[`${n}-start`]?.(e),"out"==n){if(r||(r=e),!r)return
let t={}
if((i.trans?.smartTransition??1)&&0==s){let e=getComputedStyle(r)
t.w=`calc(${r.clientWidth}px - ${e.paddingLeft} - ${e.paddingRight})`,t.left=`calc(${r.getBoundingClientRect().left}px + ${window.scrollX}px)`,t.top=`calc(${r.getBoundingClientRect().top}px + ${window.scrollY}px)`}p((()=>{if(i.trans?.smartTransition??1){if(s&&r){let e=getComputedStyle(r)
t.w=`calc(${r.clientWidth}px - ${e.paddingLeft} - ${e.paddingRight})`,t.left=`calc(${r.getBoundingClientRect().left}px + ${window.scrollX}px)`,t.top=`calc(${r.getBoundingClientRect().top}px + ${window.scrollY}px)`}e.style.position="fixed",e.style.width=t.w,e.style.left=t.left,e.style.top=t.top,e.style.margin="0"}l&&(e.style.transitionDuration=`${l}ms`),e.classList?.add("out")}))}else e?.classList?.add("in"),l&&(e.style.transitionDuration=`${l}ms`),o?.(),setTimeout((()=>{p((()=>{setTimeout((()=>p((()=>e?.classList?.remove(n)))),0)}))}),i.trans?.swap||0)
setTimeout((()=>{p((()=>{"out"==n&&e?.remove(),e?.classList?.remove(a),i.trans?.hooks?.[`${n}-end`]?.(e)}))}),l+("in"==n&&i.trans?.swap||0))}}function w(t){if(!t)return 0
if("number"==typeof t)return t
if(!0===t)return 1
if(t instanceof Map)return w(Array.from(t.entries()))
if(t instanceof Set)return w(Array.from(t))
let e=0
for(let n of(new TextEncoder).encode("string"==typeof t?t:t?.toString()||""))e=(e<<5)-e+n
return e}globalThis.MfSt||(globalThis.MfSt=new Map),globalThis.MfFn||(globalThis.MfFn={}),globalThis.MfMutOb||(globalThis.MfMutOb=new Map)
class g{t=void 0
i=new Map
o=void 0
l=new Set
u=new Set
p
h
constructor(t,e){return this.m(t,e)}m(t,e){if(this.name=t,this.p=e?.scope||document.currentScript||"global",MfSt.set(t,this),this.p instanceof Element){let t=MfMutOb.get(this.p)
t||(t={},t.toRemove=new Set,t.observer=new MutationObserver((e=>{for(let n of e)if("childList"==n.type)for(let e of n.removedNodes)if(e instanceof Element)for(let n of t.toRemove)if(n.p==e){let e=this.p
b(n),t.observer.disconnect(),t.toRemove.delete(n),MfMutOb.delete(e)}})),t.observer.observe(this.p?.parentElement,{childList:!0})),t.toRemove.add(this),MfMutOb.set(this.p,t)}return e?.upstream?.map((t=>{let e=y(t)
return this.l.add(e),e.u.add(this),e})),this.value=e?.value,this.t=e?.updater,this.$(),this}sub(t,e,n=!0){this.i.set(e||i(),t),n&&t?.(this.value)}async update(t){return new Promise((async e=>{this.h&&clearTimeout(this.h),this.h=setTimeout((()=>{p((async()=>{let n="function"==typeof t?(await t)?.(this.value):t,i=w(n)
if(i!==this.o){this.value=n,this.o=i
for(let t of this.u)await t.$()
for(let[t,e]of this?.i||[])e?.(this.value,t)
e(this.value)}else e(this.value)}))}),0)}))}async clearHash(){this.o=void 0}async $(){let t=await(this.t?.(Array.from(this.l)?.map((t=>t?.value))||[],this?.value))
await this.update(void 0===t?this.value:t)}}function y(t,e){let n=MfSt.get(t)
return e?n?n.m(t,e):new g(t,e):n||new g(t,e)}function b(t){t.i.clear(),t.l.clear(),t.u.clear(),MfSt.delete(t.name),t=void 0}function v(e,n,i,o,r,l,a){let f=async n=>{n?.preventDefault(),n?.stopPropagation(),r||(r=(n?.target)?.method||"get"),i?.fetch?.externals?.find((t=>o?.startsWith(t.domain)))||!o.match(/^https?:\/\//)||o.includes(location.origin)
let f=a?.(...l||[])||l,u=Array.isArray(f)?f[0]:"$form"==f?new FormData(e):f
if(a){let t=Array.isArray(f)?f?.map((t=>y(t).value))||[]:[u]
u=a?.(...t)}let c=await fetch(o,{...i?.fetch?.request||{},headers:{...i?.fetch?.request?.headers,"Manifold-App-Fetch":"true"},method:r,body:"$form"==f||"string"==typeof u?u:JSON.stringify(u)}).catch((t=>{i?.fetch?.err?.(t)||console.error("FETCH ERROR",t)})),d=c?.status
if(d&&0==i?.fetch?.onCode?.(d,c))return
let h=await(c?.[i?.fetch?.responseType||"text"]())
for(let n of["append","prepend","swapinner","swapouter"]){let o=e.dataset[`${t}${n}`]
if(void 0===o)continue
let[r,s]=o?.split("->").map((t=>t.trim()))||[],l=(new DOMParser)?.parseFromString?.(h,"text/html")
l&&p({in:l.querySelector(r||"body"),out:s?document.querySelector(s):e,relation:n,ops:i,done:t=>{O(t)}})}void 0!==e.dataset?.[`${t}pushstate`]&&history.pushState({},"",o)
let m=e.dataset?.[`${t}resolve`],$=s(m||"")?.func
$?.(h)}
"$mount"==n?f():e.addEventListener(n,f)}function M(t,e,n=[],i=[]){if(t.tagName!=e){let o=document.createElement(e)
o.innerHTML=t.innerHTML
for(let e of t.attributes)n.includes(e.name)||o.setAttribute(e.name,e.value)
for(let t of i)o.classList.remove(t)
return t.replaceWith(o),o}return t}function T(t,e){if(t instanceof Map)for(const[n,i]of t.entries())e(n,i)
else try{let n=Array.from(t||[])
if(n?.length)n.forEach(e)
else for(let n in t)e(n,t[n])}catch(e){console.error(`${t} is not iterable`)}}function x(t,e,n){return e?.(t)?t:(t=n?.(t)||t,x(t?.nextElementSibling,e,n))}function S(t,e,n){return y(t||"",{upstream:[...e||[]],updater:t=>{try{return n?.func?.(...t)||t[0]}catch(t){return}},scope:n?.observeEl})}function A(t,e,n,o,r,s){if(r.match("bind"))S(i(),e,{observeEl:t,func:()=>{let i=s?.(...function(t){let e=[]
for(let n of t){let t=MfSt.get(n)
e.push(t.value||globalThis.value)}return e}(e),t)
if(n&&null!=i){let e=n.split(":")
switch(e[0]){case"style":t.style[e[1]]=i
break
case"attr":t.setAttribute(e[1],i)
break
default:t[n]=i}}return t.dispatchEvent(new CustomEvent(o)),i}})
else{let i=()=>{e.length>1&&console.warn("Multiple sync props",t)
let i,o=e?.[0].trim().split(":")
switch(o[0]){case"style":i=t.style[o[1]]
break
case"attr":i=t.getAttribute(o[1])
break
default:i=t[o[0]]}let r=parseFloat(i)
isNaN(r)||(i=r)
let l=s?.(i,t)
n&&void 0!==l&&y(n)?.update?.(l)}
"$mount"==o?i():t.addEventListener(o,i)}}function E(e,n,o,r,l,a){let f=document.createElement("template"),u=M(e.cloneNode(!0),"TEMPLATE")
f.classList.add(`${n}-start`),u.classList.add(`${n}-end`),u.dataset.nodeName=e.nodeName,e.before(f),e.after(u),e.remove(),S(i(),l,{func:r,observeEl:u}).sub((e=>{p((()=>{x(f?.nextElementSibling,(t=>t?.classList?.contains(`${n}-end`)),(t=>$(t,"out",a,(()=>t?.remove())))),(n.match(/each/)?T:(t,e)=>e(t||""))(e,((e,i)=>{if(null==e)return
let r,l=u?.innerHTML||u?.textContent?.replace(/^\n{0,}|\n{0,}$/,"")||"",f=l.match(/\${[^}]*}/g)||[]
for(let t of f)try{let n=s(`(${o.join(",")})=> ${t.slice(2,t.length-1)}`)?.func
l=l.replace(t,n?.(e,i)||"")}catch(t){throw t}if(n.match(/each/)){let t=u.cloneNode(!0)
t.innerHTML=l||e,r=t.content.children}else{let i=M(u.cloneNode(!0),u.dataset.nodeName,["data-node-name",`data-${t}`],[`${n}-end`])
i.innerHTML=l||e,r=[i]}for(let t of r)u.before(t),$(t,"in",a,(()=>O(t)))}))}))}))}let _={},F=["bind","sync","templ","if","each","get","head","post","put","delete","patch"].map((e=>`${t}${e}`))
function O(e){if(e&&e.nodeType==Node.TEXT_NODE)return
let n=(e||document.body).querySelectorAll(`[data-${F.join("],[data-")}],a,form`)||[]
for(let e of n){let n=r(_,e)
if(void 0!==e.dataset?.[`${t}promote`]){let[t,i,o,r]="A"==e.tagName?["get",e.href,[],"click"]:[e.method.toLowerCase(),e.action,"$form","submit"]
if(i){v(e,r,n,i,t,o)
continue}}for(let i in e.dataset){if(!F.includes(i))continue
let o=!i.match(/bind|templ|if|each/)
for(let r of e.dataset?.[i]?.split(";;")||[]){let[l,a]=r?.split("->")?.map((t=>t.trim()))||[],f=o?N(l.slice(0,l.indexOf(")"))):[]
!a&&i.match(/get|head|post|put|delete|patch/)&&(a=l.slice(l.indexOf(")")+1),l="")
let u=o?l?.slice(l.indexOf(")")+1):l
if(o&&!f?.length){console.error("No trigger",e)
break}let{func:c,valueList:p,as:d}=s(u)
if(u&&!c&&console.warn(`"${u}" not registered`,e),i.match(/if|each|templ/))E(e,i,d||[],c,p||[],n)
else{f?.length||(f=[""])
for(let o of f)i.match(/bind|sync/)?A(e,p,a,o,i,c):v(e,o,n,a,i.replace(t,""),p,c)}}}}}function N(t){if(t?.includes("(")){let e=t.match(/[^\(\)]{1,}/g)
t=e?.[e.length-1]||""}return t?.split(n)?.map((t=>t.trim()))||[]}
/**! @typedef {"in-start"|"in-end"|"out-start"|"out-end"} HookKey*/
/**!
 * @typedef {object} ExternalOptions
 * @property {string} domain - The domain name these settings apply to
 * @property {boolean} [scripts] - Allow scripts from this domain to execute
 * @property {boolean} [styles] - Allow styles from this domain to apply
 */
/**!
 * @typedef {object} FetchOptions
 * @property {RequestInit} [request] - Fetch request options
 * @property {"json"|"text"} [responseType] - Response type (default: "text")
 * @property {(err: Error)=> void} [err] - Error callback - run on fetch error
 * @property {(code: number, data: void | Response)=> boolean | void} [onCode] - Callback function - run on fetch response code; return `false` to prevent further processing
 * @property {ExternalOptions[]} [externals] - External domain fetch settings
 */
/**!
 * @typedef {object} TransitionOptions
 * @property {string} [class] - CSS class applied to transitions (default: `mfTrans`)
 * @property {[number, number] | number} [dur] - Transition duration: [in, out] or single value (in ms); default: 300
 * @property {number} [swap] - Swap delay (in ms) - applied between one element's outro start and the replacement's intro start; default: 0
 * @property {boolean} [smartTransition] - Enable smart transitions (default: true)
 * @property {{ [key in HookKey]?: (el: HTMLElement)=> void }} [hooks] - Transition hooks
 */
/**!
 * Manifold options for `fetch`, `trans`, and `profiles`.
 * @typedef {Object} MfldOps
 * @property {{ [ key: string ]: Partial<MfldOps> }} [profiles] - Fetch profiles assignable to elements
 * @property {FetchOptions} [fetch] - Fetch options - see https://google.com
 * @property {TransitionOptions} [trans] - Transition settings - see https://google.com
 */
/**!
 * @template T
 * @callback UpdaterFunction
 * @param {Array<any>} upstreamValues
 * @param {T} value
 * @returns {T | Promise<T>}
 */
/**!
 * @template T
 * @callback ValueDeterminer
 * @param {T} [currentValue]
 * @returns {T | Promise<T> | undefined}
 */
/**!
 * @template T
 * @callback UpdateFunction
 * @param {T | ValueDeterminer<T>} value
 * @returns {T | Promise<T> | undefined}
 */
/**!
 * @template T
 * @callback SubDeterminer
 * @param {T} value
 * @returns {void}
 */
/**!
 * @template T
 * @callback SubFunction
 * @param {SubDeterminer<T>} value The store's current value
 * @returns void
 */
/**!
 * @template T
 * @typedef {Object} StoreOptions
 * @property {T} [value]
 * @property {Array<string>} [upstream]
 * @property {UpdaterFunction<T>} [updater]
 * @property {HTMLElement | SVGScriptElement | "global"} [scope]
 */
/**!
 * @template T
 * @typedef Store
 * @prop {T} value - The store's current value (read only)
 * @prop {UpdateFunction<T>} update - Update the store's current value
 * @prop {SubFunction<T>} sub - Add a subscription function to the store
 */
/**!
 * @typedef {Function} MfldFunc
 * @param {any} val
 * @param {HTMLElement} [el]
 */
/**!
 * The global Manifold interface.
 */globalThis.addEventListener("popstate",(t=>{}))
let k={store:
/**!
* - Create or overwrite a _typed_ global Manifold store by passing `store_ops` (`MfldOps`) -> *returns `Store\<T\>`* 
* - Retrieve an untyped reference to the store specified by name by omitting `store_ops` -> *returns `Store\<any\>`*
* @template T
* @param {string} store_name
* @param {StoreOptions<T> | T} store_ops
* @return {Store<T>}
*/
(store_name,store_ops)=>(store_ops?.hasOwnProperty("value")||store_ops?.hasOwnProperty("updater")||(store_ops={value:store_ops}),y(store_name,store_ops)),ustore:
/**!
* - Create or overwrite an untyped global Manifold store by passing `store_ops` (`MfldOps`) -> *returns `Store\<any\>`* 
* - Retrieve an untyped reference to the store specified by name by omitting `store_ops` -> *returns `Store\<any\>`*
* @param {string} store_name
* @param {StoreOptions<any> | any} store_ops
* @return {Store<any>}
*/
(store_name,store_ops)=>y(store_name,store_ops),get:
/**!
 * - Retrieve a Manifold store by name. *returns `Store\<any\>`*
 * @param {string} store_name
 * @return {Store<any>}
 */
store_name=>y(store_name),func:
/**!
 * - Retrieve a Manifold function by name. *val* refers to the store's current value; *el* refers to the element that triggered the update (if applicable). *returns `MfldFunc`*
 * - *Note:* Functions retrived using this method cannot infer the type of the store's value and is therefore **not** type-checked. It is preferable to keep a reference to the function if you need to preserve type information.
 * @param {string} func_name
 * @return {MfldFunc}
 */
func_name=>MfFn[func_name],funcs:
/**!
 * - Add functions to the Manifold function registry in key-value pairs.
 * - Functions must be registered in order to be accessible to HTML elements via `mfBind`, `mfSync`, and `mfResolve`. 
 * - It may still be beneficial to keep a reference to the original function if you need to preserve type information.
 * @param {{ [key: string]: MfldFunc }} funcs
 */
funcs=>{for(let t in funcs)MfFn[t]=funcs[t]},config:
/**!
 * - Set Manifold configuration options, including `trans` (DOM transition settings), `fetch` (fetch options), and `profiles` (configuration option overrides that can be set on elements ad-hoc via `mfOverrides`).
 * - Providing the optional `profileName` parameter allows you to save the configuration as a named profile. Otherwise, the profile is saved as the default configuration.
 * @param {MfldOps} new_ops
 * @param {string} [profile_name]
 */
(new_ops,profile_name)=>{return t=new_ops,void((e=profile_name)?_.profiles={..._.profiles,[e]:t}:_={..._,...t})

;/**!
 * @param {Partial<MfldOps>} newops 
 * @param {string} [profileName] 
 */
var t,e},onTick:
/**!
  * - Wait for the next Manifold data update cycle to complete before executing the callback function.
  * @param {()=> void} cb
  */
t=>{var e;(e=t)&&u.push(e)},register:
/**!
 * - Register Manifold subscriptions on the DOM. *Optional:* Pass an `HTMLElement` or selector string to scope the registration to a specific element.
 * @param {HTMLElement | string | null} [parent]
 */
t=>{"string"==typeof t&&(t=document.querySelector(t)),O(t)}}
exports.Mfld=k
