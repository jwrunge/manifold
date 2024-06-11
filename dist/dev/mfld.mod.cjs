let t="mf_",e=/[\.\[\]\?]{1,}/g,n=/, {0,}/g
function i(){return`${Date.now()}.${Math.floor(1e5*Math.random())}`}function o(e,n,i,o=!0,r="{}",s){let a=n.dataset[`${t}${e}`]
if(a)return"overrides"==e?i.profiles?.[a||""]?.fetch||JSON.parse(a||"{}"):o?JSON.parse(a||r):"num"==s?parseInt(a)||void 0:"bool"==s?"true"==a||"false"!=a&&void 0:a}function r(t,e){let n=o("overrides",e,t)
return{profiles:t.profiles,fetch:{...t.fetch,responseType:o("responsetype",e,t,!1)||t.fetch?.responseType,...n?.fetch||{},...o("fetch",e,t)||{}},trans:{...t.trans,dur:o("transdur",e,t,!0,"[]","num")||t.trans?.dur,swap:o("transswap",e,t,!1,"","num")||t.trans?.swap,class:o("transclass",e,t,!1)||t.trans?.class,smartTransition:o("transsmart",e,t,!1,void 0,"bool")||t.trans?.smartTransition,...n?.trans||{},...o("trans",e,t)||{}}}}function s(i){"string"!=typeof i&&((i=i?.el?.dataset?.[i?.datakey]||"")||null==i?.el?.dataset?.[`${t}else`]||(i="return true"))
let[o,r]=i?.split("=>")?.map((t=>t.trim()))?.reverse()||["",""],[s,a]=o?.split(/\s{1,}as\s{1,}/)||[s,"value"],l=a?.slice?.(n)?.map?.((t=>t.trim()))?.[0]||["value"],f=r?.split(",")?.map((t=>t.replace(/[()]/g,"").trim()))||[],u=globalThis[s]||MfFn[s]
if(!u){f?.length||s.includes("=>")||(s.match(/\(|\)/)?f=s.match(/\([^\)]{1,}\)/)?.[0]?.replace(/[\(\) ]/g,"").split(",").filter((t=>!t.match(/[\"\'\`]/)))||[]:(f=[s],s=`return ${s}`)),f=function(t){return"string"==typeof t&&(t=t.split(/\s{0,},\s{0,}/)),t.map((t=>t.split(e)?.[0]))||[]}(f),s.match(/^\s{0,}\{/)||s.includes("return")||(s=s.replace(/^\s{0,}/,"return "))
try{u=new Function(...f,s)}catch(t){console.error(t),console.log(f,s)}}return{valueList:f,func:u,as:l}}window.parse=s
let a,l=[],f=!1,u=[],c="",p=globalThis?.requestAnimationFrame||(t=>setTimeout(t,0))
function d(t){l.push(t),f||(f=!0,p(m))}function h(t,e,n,i=!1,o){if(!o.trans?.smartTransition??1)return
a=document.createElement("div")
let{paddingTop:r,paddingBottom:s}=e instanceof Element?window.getComputedStyle(e):{paddingTop:0,paddingBottom:0}
c=a.style.height=`calc(${Math.abs(n-(t?.clientHeight||0))}px - ${r} - ${s})`,e?.after(a)}function w(t,e){if(!e.trans?.smartTransition??1)return
let n=(e?.trans?.dur?.[0]||e?.trans?.dur||600)/2
d((()=>{a?.remove(),t?.animate?.([{height:c},{height:`${t.clientHeight||0}px`}],n)}))}function m(){f=!1
for(let t of l)if("function"==typeof t)t()
else{let e=t.out?t.out.clientHeight:0
if("prepend"==t.relation)h?.(t.in,t.out,e,!1,t.ops),$(t.in,"in",t.ops,(()=>{t.in&&t.out?.prepend(t.in),w?.(t.in,t.ops)}))
else{if(["swapinner","swapouter"].includes(t.relation)){let e=t.out?.cloneNode(!0)
if(e){t.out?.after(e)
let n="swapinner"==t.relation
"swapinner"==t.relation&&(e.style.border="none",t.out.replaceChildren()),$(e,"out",t.ops,void 0,t.out,n)}}h?.(t.in,t.out,e,!1,t.ops),$(t.in,"in",t.ops,(()=>{t.in&&("swapouter"==t.relation?t.out?.replaceWith(t.in):t.out?.appendChild(t.in)),w?.(t.in,t.ops)}))}t.done?.(t.in)}for(let t of u)t()
u=[],l=[]}function $(e,n,i,o,r,s=!1){if(e?.nodeType==Node.TEXT_NODE){let t=e.textContent,n=document?.createElement("div")
n.textContent=t,e.replaceWith(n),e=n}if(e){let a=Array.isArray(i.trans?.dur)?i.trans?.dur["in"==n?0:1]||i.trans?.dur[0]:i.trans?.dur||0,l=i?.trans?.class||`${t}trans`
if(e?.classList?.add(l),i.trans?.hooks?.[`${n}-start`]?.(e),"out"==n){if(r||(r=e),!r)return
let t={}
if((i.trans?.smartTransition??1)&&0==s){let e=getComputedStyle(r)
t.w=`calc(${r.clientWidth}px - ${e.paddingLeft} - ${e.paddingRight})`,t.left=`calc(${r.getBoundingClientRect().left}px + ${window.scrollX}px)`,t.top=`calc(${r.getBoundingClientRect().top}px + ${window.scrollY}px)`}d((()=>{if(i.trans?.smartTransition??1){if(s&&r){let e=getComputedStyle(r)
t.w=`calc(${r.clientWidth}px - ${e.paddingLeft} - ${e.paddingRight})`,t.left=`calc(${r.getBoundingClientRect().left}px + ${window.scrollX}px)`,t.top=`calc(${r.getBoundingClientRect().top}px + ${window.scrollY}px)`}e.style.position="fixed",e.style.width=t.w,e.style.left=t.left,e.style.top=t.top,e.style.margin="0"}a&&(e.style.transitionDuration=`${a}ms`),e.classList?.add("out")}))}else e?.classList?.add("in"),a&&(e.style.transitionDuration=`${a}ms`),o?.(),setTimeout((()=>{d((()=>{setTimeout((()=>d((()=>e?.classList?.remove(n)))),0)}))}),i.trans?.swap||0)
setTimeout((()=>{d((()=>{"out"==n&&e?.remove(),e?.classList?.remove(l),i.trans?.hooks?.[`${n}-end`]?.(e)}))}),a+("in"==n&&i.trans?.swap||0))}}function g(t){if(!t)return 0
if("number"==typeof t)return t
if(!0===t)return 1
if(t instanceof Map)return g(Array.from(t.entries()))
if(t instanceof Set)return g(Array.from(t))
let e=0
for(let n of(new TextEncoder).encode("string"==typeof t?t:t?.toString()||""))e=(e<<5)-e+n
return e}globalThis.MfSt||(globalThis.MfSt=new Map),globalThis.MfFn||(globalThis.MfFn={}),globalThis.MfMutOb||(globalThis.MfMutOb=new Map)
class y{t=void 0
i=new Map
o=void 0
l=new Set
u=new Set
p
constructor(t,e){return this.h(t,e)}h(t,e){if(this.name=t,this.p=e?.scope||document.currentScript||"global",MfSt.set(t,this),this.p instanceof Element){let t=MfMutOb.get(this.p)
t||(t={},t.toRemove=new Set,t.observer=new MutationObserver((e=>{for(let n of e)if("childList"==n.type)for(let e of n.removedNodes)if(e instanceof Element)for(let n of t.toRemove)if(n.p==e){let e=this.p
v(n),t.observer.disconnect(),t.toRemove.delete(n),MfMutOb.delete(e)}})),t.observer.observe(this.p?.parentElement,{childList:!0})),t.toRemove.add(this),MfMutOb.set(this.p,t)}return e?.upstream?.map((t=>{let e=b(t)
return this.l.add(e),e.u.add(this),e})),this.value=e?.value,this.t=e?.updater,this.m(),this}sub(t,e,n=!0){this.i.set(e||i(),t),n&&t?.(this.value)}async update(t){return new Promise((async e=>{let n="function"==typeof t?(await t)?.(this.value):t,i=g(n)
if(i!==this.o){this.value=n,this.o=i
for(let t of this.u)await t.m()
d((()=>{for(let[t,e]of this?.i||[])e?.(this.value,t)
e(this.value)}))}else e(this.value)}))}async clearHash(){this.o=void 0}async m(){let t=await(this.t?.(Array.from(this.l)?.map((t=>t?.value))||[],this?.value))
await this.update(void 0===t?this.value:t)}}function b(t,e){let n=MfSt.get(t)
return e?n?n.h(t,e):new y(t,e):n||new y(t,e)}function v(t){t.i.clear(),t.l.clear(),t.u.clear(),MfSt.delete(t.name),t=void 0}function M(e,n,i,o,r,a,l){let f=async n=>{n?.preventDefault(),n?.stopPropagation(),r||(r=(n?.target)?.method||"get"),i?.fetch?.externals?.find((t=>o?.startsWith(t.domain)))||!o.match(/^https?:\/\//)||o.includes(location.origin)
let f=Array.isArray(a)?a[0]:"$form"==a?new FormData(e):a
if(l){let t=Array.isArray(a)?a?.map((t=>b(t).value))||[]:[f]
f=l?.(...t)}let u=await fetch(o,{...i?.fetch?.request||{},headers:{...i?.fetch?.request?.headers,"Manifold-App-Fetch":"true"},method:r,body:"$form"==a||"string"==typeof f?f:JSON.stringify(f)}).catch((t=>{i?.fetch?.err?.(t)||console.error("FETCH ERROR",t)})),c=u?.status
if(c&&0==i?.fetch?.onCode?.(c,u))return
let p=await(u?.[i?.fetch?.responseType||"text"]())
for(let n of["append","prepend","swapinner","swapouter"]){let o=e.dataset[`${t}${n}`]
if(void 0===o)continue
let[r,s]=o?.split("->").map((t=>t.trim()))||[],a=(new DOMParser)?.parseFromString?.(p,"text/html")
a&&d({in:a.querySelector(r||"body"),out:s?document.querySelector(s):e,relation:n,ops:i,done:t=>{_(t)}})}void 0!==e.dataset?.[`${t}pushstate`]&&history.pushState({},"",o)
let h=e.dataset?.[`${t}resolve`],w=s(h||"")?.func
w?.(p)}
"$mount"==n?f():e.addEventListener(n,f)}function T(t,e,n,o,r,s){if(r.match("bind"))a=i(),l={observeEl:t,func:()=>{let i=s?.(...function(t){let e=[]
for(let n of t){let t=MfSt.get(n)
e.push(t.value||globalThis.value)}return e}(e),t)
if(n&&null!=i){let e=n.split(":")
switch(e[0]){case"style":t.style[e[1]]=i
break
case"attr":t.setAttribute(e[1],i)
break
default:t[n]=i}}return t.dispatchEvent(new CustomEvent(o)),i}},b(a||"",{upstream:[...e||[]],updater:t=>{try{return l?.func?.(...t)||t[0]}catch(t){return}},scope:l?.observeEl})
else{let i=()=>{e.length>1&&console.warn("Multiple inputs not supported for sync",t)
let i,o=e?.[0].trim().split(":")
switch(o[0]){case"style":i=t.style[o[1]]
break
case"attr":i=t.getAttribute(o[1])
break
default:i=t[o[0]]}let r=parseFloat(i)
isNaN(r)||(i=r)
let a=s?.(i,t)
n&&void 0!==a&&b(n)?.update?.(a)}
"$mount"==o?i():t.addEventListener(o,i)}var a,l}let x={},S=["bind","sync","templ","if","each","get","head","post","put","delete","patch"].map((e=>`${t}${e}`))
function _(e){if(e&&e.nodeType==Node.TEXT_NODE)return
let n=(e||document.body).querySelectorAll(`[data-${S.join("],[data-")}],a,form`)||[]
for(let e of n){let n=r(x,e)
if(void 0!==e.dataset?.[`${t}promote`]){let[t,i,o,r]="A"==e.tagName?["get",e.href,"","click"]:[e.method.toLowerCase(),e.action,"$form","submit"]
if(i){M(e,r,n,i,t,o)
continue}}for(let n in e.dataset){if(!S.includes(n))continue
let i=![`${t}bind`].includes(n),o=e.dataset?.[n],[r,a]=o?.split("->")?.map((t=>t.trim()))||[],l=i?O(r.slice(0,r.indexOf(")"))):[],f=i?r.slice(r.indexOf(")")+1):r
if(i&&!l?.length){console.error("No trigger",e)
break}let{func:u,valueList:c,as:p}=s(f)
f&&!u&&console.warn(`"${f}" not registered`,e),l?.length||(l=[""])
for(let t of l)n.match(/bind|sync/)&&T(e,c,a,t,n,u)}}}function O(t){if(t?.includes("(")){let e=t.match(/[^\(\)]{1,}/g)
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
let A={store:
/**!
* - Create or overwrite a _typed_ global Manifold store by passing `store_ops` (`MfldOps`) -> *returns `Store\<T\>`* 
* - Retrieve an untyped reference to the store specified by name by omitting `store_ops` -> *returns `Store\<any\>`*
* @template T
* @param {string} store_name
* @param {StoreOptions<T> | T} store_ops
* @return {Store<T>}
*/
(store_name,store_ops)=>(store_ops?.hasOwnProperty("value")||store_ops?.hasOwnProperty("updater")||(store_ops={value:store_ops}),b(store_name,store_ops)),ustore:
/**!
* - Create or overwrite an untyped global Manifold store by passing `store_ops` (`MfldOps`) -> *returns `Store\<any\>`* 
* - Retrieve an untyped reference to the store specified by name by omitting `store_ops` -> *returns `Store\<any\>`*
* @param {string} store_name
* @param {StoreOptions<any> | any} store_ops
* @return {Store<any>}
*/
(store_name,store_ops)=>b(store_name,store_ops),get:
/**!
 * - Retrieve a Manifold store by name. *returns `Store\<any\>`*
 * @param {string} store_name
 * @return {Store<any>}
 */
store_name=>b(store_name),func:
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
(new_ops,profile_name)=>{return t=new_ops,void((e=profile_name)?x.profiles={...x.profiles,[e]:t}:x={...x,...t})

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
t=>{"string"==typeof t&&(t=document.querySelector(t)),_(t)}}
exports.Mfld=A
