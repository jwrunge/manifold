let t="mf_",e=/[\.\[\]\?]{1,}/g
function n(){return`${Date.now()}.${Math.floor(1e5*Math.random())}`}function i(t,e,n){let i=t
for(let t of e)null==i&&(i="number"==typeof t?[]:{}),null==n||e[e.length-1]!==t?i=i instanceof Map?i?.get(t):i?.[t]:i instanceof Map?i.set(t,n):i[t]=n
return i}function o(t){let[n,...i]=t?.split(e)
return[n,i?.map((t=>isNaN(parseInt(t))?t:parseInt(t))).filter((t=>t))||[]]}function r(e,n,i,o=!0,r="{}",s){let l=n.dataset[`${t}${e}`]
if(l)return"overrides"==e?i.profiles?.[l||""]?.fetch||JSON.parse(l||"{}"):o?JSON.parse(l||r):"num"==s?parseInt(l)||void 0:"bool"==s?"true"==l||"false"!=l&&void 0:l}function s(t,e){let n=r("overrides",e,t)
return{profiles:t.profiles,fetch:{...t.fetch,responseType:r("responsetype",e,t,!1)||t.fetch?.responseType,...n?.fetch||{},...r("fetch",e,t)||{}},trans:{...t.trans,dur:r("transdur",e,t,!0,"[]","num")||t.trans?.dur,swap:r("transswap",e,t,!1,"","num")||t.trans?.swap,class:r("transclass",e,t,!1)||t.trans?.class,smartTransition:r("transsmart",e,t,!1,void 0,"bool")||t.trans?.smartTransition,...n?.trans||{},...r("trans",e,t)||{}}}}function l(n){"string"!=typeof n&&((n=n?.el?.dataset?.[n?.datakey]||"")||null==n?.el?.dataset?.[`${t}else`]||(n="return true"))
let[i,o]=n?.split("=>")?.map((t=>t.trim()))?.reverse()||["",""],r=o?.split(",")?.map((t=>t.replace(/[()]/g,"").trim()))||[],s=globalThis[i]||MfFn?.get(i)
return s||(r?.length||i.includes("=>")||(i.match(/\(|\)/)?r=i.match(/\([^\)]{1,}\)/)?.[0]?.replace(/[\(\) ]/g,"").split(",").filter((t=>!t.match(/[\"\'\`]/)))||[]:(r=[i],i=`return ${i}`)),r=function(t){return"string"==typeof t&&(t=t.split(/\s{0,},\s{0,}/)),t.map((t=>t.split(e)?.[0]))||[]}(r),i.match(/^\s{0,}\{/)||i.includes("return")||(i=i.replace(/^\s{0,}/,"return ")),s=new Function(...r,i)),{valueList:r,func:s}}let a,f=[],u=!1,c=[],d="",p=globalThis?.requestAnimationFrame||(t=>setTimeout(t,0))
function h(t){f.push(t),u||(u=!0,p(w))}function $(t,e,n,i=!1,o){if(!o.trans?.smartTransition??1)return
a=document.createElement("div")
let{paddingTop:r,paddingBottom:s}=e instanceof Element?window.getComputedStyle(e):{paddingTop:0,paddingBottom:0}
d=a.style.height=`calc(${Math.abs(n-(t?.clientHeight||0))}px - ${r} - ${s})`,e?.after(a)}function m(t,e){if(!e.trans?.smartTransition??1)return
let n=(e?.trans?.dur?.[0]||e?.trans?.dur||600)/2
h((()=>{a?.remove(),t?.animate?.([{height:d},{height:`${t.clientHeight||0}px`}],n)}))}function w(){u=!1
for(let t of f)if("function"==typeof t)t()
else{let e=t.out?t.out.clientHeight:0
if("prepend"==t.relation)$?.(t.in,t.out,e,!1,t.ops),g(t.in,"in",t.ops,(()=>{t.in&&t.out?.prepend(t.in),m?.(t.in,t.ops)}))
else{if(["swapinner","swapouter"].includes(t.relation)){let e=t.out?.cloneNode(!0)
if(e){t.out?.after(e)
let n="swapinner"==t.relation
"swapinner"==t.relation&&(e.style.border="none",t.out.replaceChildren()),g(e,"out",t.ops,void 0,t.out,n)}}$?.(t.in,t.out,e,!1,t.ops),g(t.in,"in",t.ops,(()=>{t.in&&("swapouter"==t.relation?t.out?.replaceWith(t.in):t.out?.appendChild(t.in)),m?.(t.in,t.ops)}))}t.done?.(t.in)}for(let t of c)t()
c=[],f=[]}function g(e,n,i,o,r,s=!1){if(e?.nodeType==Node.TEXT_NODE){let t=e.textContent,n=document?.createElement("div")
n.textContent=t,e.replaceWith(n),e=n}if(e){let l=Array.isArray(i.trans?.dur)?i.trans?.dur["in"==n?0:1]||i.trans?.dur[0]:i.trans?.dur||0,a=i?.trans?.class||`${t}trans`
if(e?.classList?.add(a),i.trans?.hooks?.[`${n}-start`]?.(e),"out"==n){if(r||(r=e),!r)return
let t={}
if((i.trans?.smartTransition??1)&&0==s){let e=getComputedStyle(r)
t.w=`calc(${r.clientWidth}px - ${e.paddingLeft} - ${e.paddingRight})`,t.left=`calc(${r.getBoundingClientRect().left}px + ${window.scrollX}px)`,t.top=`calc(${r.getBoundingClientRect().top}px + ${window.scrollY}px)`}h((()=>{if(i.trans?.smartTransition??1){if(s&&r){let e=getComputedStyle(r)
t.w=`calc(${r.clientWidth}px - ${e.paddingLeft} - ${e.paddingRight})`,t.left=`calc(${r.getBoundingClientRect().left}px + ${window.scrollX}px)`,t.top=`calc(${r.getBoundingClientRect().top}px + ${window.scrollY}px)`}e.style.position="fixed",e.style.width=t.w,e.style.left=t.left,e.style.top=t.top,e.style.margin="0"}l&&(e.style.transitionDuration=`${l}ms`),e.classList?.add("out")}))}else e?.classList?.add("in"),l&&(e.style.transitionDuration=`${l}ms`),o?.(),setTimeout((()=>{h((()=>{setTimeout((()=>h((()=>e?.classList?.remove(n)))),0)}))}),i.trans?.swap||0)
setTimeout((()=>{h((()=>{"out"==n&&e?.remove(),e?.classList?.remove(a),i.trans?.hooks?.[`${n}-end`]?.(e)}))}),l+("in"==n&&i.trans?.swap||0))}}function v(t){if(!t)return 0
if("number"==typeof t)return t
if(!0===t)return 1
if(t instanceof Map)return v(Array.from(t.entries()))
if(t instanceof Set)return v(Array.from(t))
let e=0
for(let n of(new TextEncoder).encode("string"==typeof t?t:t?.toString()||""))e=(e<<5)-e+n
return e}globalThis.MfSt||(globalThis.MfSt=new Map),globalThis.MfFn||(globalThis.MfFn=new Map),globalThis.MfMutOb||(globalThis.MfMutOb=new Map)
class y{t=void 0
i=new Map
o=void 0
l=new Set
u=new Set
p
constructor(t,e){return this.h(t,e)}h(t,e){if(this.name=t,this.p=e?.scope||document.currentScript||"global",MfSt.set(t,this),this.p instanceof Element){let t=MfMutOb.get(this.p)
t||(t={},t.toRemove=new Set,t.observer=new MutationObserver((e=>{for(let n of e)if("childList"==n.type)for(let e of n.removedNodes)if(e instanceof Element)for(let n of t.toRemove)if(n.p==e){let e=this.p
M(n),t.observer.disconnect(),t.toRemove.delete(n),MfMutOb.delete(e)}})),t.observer.observe(this.p?.parentElement,{childList:!0})),t.toRemove.add(this),MfMutOb.set(this.p,t)}return e?.upstream?.map((t=>{let e=b(t)
return this.l.add(e),e.u.add(this),e})),this.value=e?.value,this.t=e?.updater,this.$(),this}sub(t,e,i=!0){this.i.set(e||n(),t),i&&t?.(this.value)}async update(t){return new Promise((async e=>{let n="function"==typeof t?(await t)?.(this.value):t,i=v(n)
if(i!==this.o){this.value=n,this.o=i
for(let t of this.u)await t.$()
h((()=>{for(let[t,e]of this?.i||[])e?.(this.value,t)
e(this.value)}))}else e(this.value)}))}async clearHash(){this.o=void 0}async $(){let t=await(this.t?.(Array.from(this.l)?.map((t=>t?.value))||[],this?.value))
await this.update(void 0===t?this.value:t)}}function b(t,e){let n=MfSt.get(t)
return e?n?n.h(t,e):new y(t,e):n||new y(t,e)}function M(t){t.i.clear(),t.l.clear(),t.u.clear(),MfSt.delete(t.name),t=void 0}function T(e,n,i,o,r,s,a){let f=async n=>{n?.preventDefault(),n?.stopPropagation(),r||(r=(n?.target)?.method||"get"),i?.fetch?.externals?.find((t=>o?.startsWith(t.domain)))||!o.match(/^https?:\/\//)||o.includes(location.origin)
let f=Array.isArray(s)?s[0]:"$form"==s?new FormData(e):s
if(a){let t=Array.isArray(s)?s?.map((t=>b(t).value))||[]:[f]
f=a?.(...t)}let u=await fetch(o,{...i?.fetch?.request||{},headers:{...i?.fetch?.request?.headers,"Manifold-App-Fetch":"true"},method:r,body:"$form"==s||"string"==typeof f?f:JSON.stringify(f)}).catch((t=>{i?.fetch?.err?.(t)||console.error("FETCH ERROR",t)})),c=u?.status
if(c&&0==i?.fetch?.onCode?.(c,u))return
let d=await(u?.[i?.fetch?.responseType||"text"]())
for(let n of["append","prepend","swapinner","swapouter"]){let o=e.dataset[`${t}${n}`]
if(void 0===o)continue
let[r,s]=o?.split("->").map((t=>t.trim()))||[],l=(new DOMParser)?.parseFromString?.(d,"text/html")
l&&h({in:l.querySelector(r||"body"),out:s?document.querySelector(s):e,relation:n,ops:i,done:t=>{_(t)}})}void 0!==e.dataset?.[`${t}pushstate`]&&history.pushState({},"",o)
let p=e.dataset?.[`${t}resolve`],$=l(p||"")?.func
$?.(d)}
"$mount"==n?f():e.addEventListener(n,f)}function x(e,r,s,l,a,f){if(a==`${t}bind`){let t=[],a=[]
for(let e of r){let[n,i]=o(e)
t.push(n),a.push(i)}u=n(),c={observeEl:e,func:()=>{let n=[]
for(let e=0;e<t.length;e++)n.push(i(b(t[e])?.value,a[e]))
let o=f?.(...n,e)??n[0]
if(s&&void 0!==o){let t=s.split(":")
if(t.length>1)switch(t[0]){case"style":e.style[t[1]]=o
break
case"attr":e.setAttribute(t[1],o)
break
default:e[s]=o}else e[s]=o}return e.dispatchEvent(new CustomEvent(l)),o}},b(u||"",{upstream:[...t||[]],updater:t=>{u?.startsWith("TEMPL")&&console.log("RUNNING UPDATE",u,b(u||"")?.value)
try{return c?.func?.(...t)||t[0]}catch(t){return void(u?.startsWith("TEMPL")&&console.log("Returning failure",u))}},scope:c?.observeEl})}else if(a==`${t}sync`){let[t,n]=o(s||""),a=()=>{let o=r.map((t=>{let n=(t=t.trim()).split(":")
if(!(n.length>1))return e[t]??void 0
switch(n[0]){case"style":return e.style[t]??void 0
case"attr":return e.getAttribute(t)??void 0
default:return e[t]??void 0}})),s=f?.(...o)??o[0]
t&&void 0!==s&&b(t)?.update?.((t=>n?.length?i(t,n,s):s))}
"$mount"==l?a():e.addEventListener(l,a)}var u,c}let S={},E=/, {0,}/g,N=["bind","sync","templ","if","each","get","head","post","put","delete","patch"].map((e=>`${t}${e}`))
function _(e){if(e&&e.nodeType==Node.TEXT_NODE)return
let n=(e||document.body).querySelectorAll(`[data-${N.join("],[data-")}],a,form`)||[]
for(let e of n){let n=s(S,e)
if(void 0!==e.dataset?.[`${t}promote`]){let[t,i,o,r]="A"==e.tagName?["get",e.href,"","click"]:[e.method.toLowerCase(),e.action,"$form","submit"]
if(i){T(e,r,n,i,t,o)
continue}}for(let n in e.dataset){if(!N.includes(n))continue
let i=![`${t}bind`].includes(n)
for(let t of e.dataset?.[n]?.split(";")||[]){let[o,r]=t?.split("->")?.map((t=>t.trim()))||[],s=i?A(o.slice(0,o.indexOf(")"))):[],a=i?o.slice(o.indexOf(")")+1):o
if(i&&!s?.length){console.error("No trigger",e)
break}let{func:f,valueList:u}=l(a)
a&&(f||console.warn(`"${a}" not registered`,e)),s?.length||(s=[""])
for(let t of s)n.match(/bind|sync/)&&x(e,u,r,t,n,f)}}}}function A(t){if(t?.includes("(")){let e=t.match(/[^\(\)]{1,}/g)
t=e?.[e.length-1]||""}return t?.split(E)?.map((t=>t.trim()))||[]}
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
let O={store:
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
func_name=>MfFn?.get(func_name),funcs:
/**!
 * - Add functions to the Manifold function registry in key-value pairs.
 * - Functions must be registered in order to be accessible to HTML elements via `mfBind`, `mfSync`, and `mfResolve`. 
 * - It may still be beneficial to keep a reference to the original function if you need to preserve type information.
 * @param {{ [key: string]: MfldFunc }} funcs
 */
funcs=>{for(let t in funcs)MfFn.set(t,funcs[t])},config:
/**!
 * - Set Manifold configuration options, including `trans` (DOM transition settings), `fetch` (fetch options), and `profiles` (configuration option overrides that can be set on elements ad-hoc via `mfOverrides`).
 * - Providing the optional `profileName` parameter allows you to save the configuration as a named profile. Otherwise, the profile is saved as the default configuration.
 * @param {MfldOps} new_ops
 * @param {string} [profile_name]
 */
(new_ops,profile_name)=>{return t=new_ops,void((e=profile_name)?S.profiles={...S.profiles,[e]:t}:S={...S,...t})

;/**!
 * @param {Partial<MfldOps>} newops 
 * @param {string} [profileName] 
 */
var t,e},onTick:
/**!
  * - Wait for the next Manifold data update cycle to complete before executing the callback function.
  * @param {()=> void} cb
  */
t=>{var e;(e=t)&&c.push(e)},register:
/**!
 * - Register Manifold subscriptions on the DOM. *Optional:* Pass an `HTMLElement` or selector string to scope the registration to a specific element.
 * @param {HTMLElement | string | null} [parent]
 */
t=>{"string"==typeof t&&(t=document.querySelector(t)),_(t)}}
exports.Mfld=O
