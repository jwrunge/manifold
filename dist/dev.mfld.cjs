let t="mf_",e=/[\.\[\]\?]{1,}/g,n=/, {0,}/g
function o(){return`${Date.now()}.${Math.floor(1e5*Math.random())}`}function i(e,n,o,i=!0,r="{}",s){let l=n.dataset[`${t}${e}`]
if(l)return"overrides"==e?o.profiles?.[l]?.fetch||JSON.parse(l||r):i?JSON.parse(l||r):"num"==s?parseInt(l):"bool"==s?"true"==l:l}function r(t,e){let n=i("overrides",e,t)
return{profiles:t.profiles,fetch:{...t.fetch,responseType:i("responsetype",e,t,!1)||t.fetch?.responseType,...n?.fetch,...i("fetch",e,t)},trans:{...t.trans,dur:i("transdur",e,t,!0,"[]","num")||t.trans?.dur,swap:i("transswap",e,t,!1,"","num")||t.trans?.swap,class:i("transclass",e,t,!1)||t.trans?.class,smartTransition:i("transsmart",e,t,!1,void 0,"bool")||t.trans?.smartTransition,...n?.trans,...i("trans",e,t)}}}function s(o){"string"!=typeof o&&((o=o?.el?.dataset?.[o?.datakey]||"")||null==o?.el?.dataset?.[`${t}else`]||(o="return true"))
let[i,r]=o?.split("=>")?.map((t=>t.trim()))?.reverse()||["",""],[s,l]=i?.split(/\s{1,}as\s{1,}/)||[i,"value"],a=l?.split?.(n)?.map?.((t=>t.trim()))||["value"],f=r?.split(",")?.map((t=>t.replace(/[()]/g,"").trim()))||[],u=globalThis[s]||MfFn[s]
if(!u){f?.length||s.includes("=>")||(s.match(/\(|\)/)?f=s.match(/\([^\)]{1,}\)/)?.[0]?.replace(/[\(\) ]/g,"").split(",").filter((t=>!t.match(/[\"\'\`]/)))||[]:(f=[s],s=`return ${s}`)),f=("string"==typeof f?f.split(/\s*,\s*/):f).map((t=>t.split(e)[0])),s.match(/^\s{0,}\{/)||s.includes("return")||(s=s.replace(/^\s{0,}/,"return "))
try{u=new Function(...f,s)}catch(t){console.error(t)}}return{valueList:f,func:u,as:a}}let l=[],a=!1,f=[],u=""
function c(t){l.push(t),a||(a=requestAnimationFrame(h))}function p(t,e,n,o=!1,i){if(!(i.trans?.smartTransition??1))return
let{paddingTop:r,paddingBottom:s}=e instanceof Element?window.getComputedStyle(e):{paddingTop:0,paddingBottom:0},l=document.createElement("div")
l.style.height=`calc(${Math.abs(n-(t?.clientHeight||0))}px - ${r} - ${s})`,e?.after(l)}function d(t,e){if(!e.trans?.smartTransition??1)return
let n=(e?.trans?.dur?.[0]||e?.trans?.dur||600)/2
c((()=>{t?.animate?.([{height:u},{height:`${t.clientHeight||0}px`}],n)}))}function h(){a=!1
for(let t of l){if("function"==typeof t){t()
continue}let e=t.out?t.out.clientHeight:0,n="swapinner"==t.relation
if("prepend"==t.relation)p?.(t.in,t.out,e,!1,t.ops),m(t.in,"in",t.ops,(()=>{t.out?.prepend(t.in),d?.(t.in,t.ops)}))
else{if(["swapinner","swapouter"].includes(t.relation)){let e=t.out?.cloneNode(!0)
e&&(t.out?.after(e),n&&(e.style.border="none",t.out.replaceChildren()),m(e,"out",t.ops,void 0,t.out,n))}p?.(t.in,t.out,e,!1,t.ops),m(t.in,"in",t.ops,(()=>{"swapouter"==t.relation?t.out?.replaceWith(t.in):t.out?.appendChild(t.in),d?.(t.in,t.ops)}))}t.done?.(t.in)}f.forEach((t=>t())),f=[],l=[]}function m(e,n,o,i,r,s=!1){if(e?.nodeType==Node.TEXT_NODE&&(e=e.replaceWith(document?.createElement("div")).textContent=e.textContent),e){const l=Array.isArray(o.trans?.dur)?o.trans?.dur["in"==n?0:1]||o.trans?.dur[0]:o.trans?.dur||0,a=o?.trans?.class||`${t}trans`
if(e?.classList?.add(a),o.trans?.hooks?.[`${n}-start`]?.(e),"out"==n){if(!(r=r||e))return
let t={};(o.trans?.smartTransition??1)&&!s&&(t=$(r)),c((()=>{(o.trans?.smartTransition??1)&&s&&r&&(t=$(r)),(o.trans?.smartTransition??1)&&(e.style.position="fixed",e.style.width=t.w,e.style.left=t.left,e.style.top=t.top,e.style.margin="0"),l&&(e.style.transitionDuration=`${l}ms`),e.classList?.add("out")}))}else e?.classList?.add("in"),l&&(e.style.transitionDuration=`${l}ms`),i?.(),setTimeout((()=>{c((()=>{setTimeout((()=>c((()=>e?.classList?.remove(n)))),0)}))}),o.trans?.swap||0)
setTimeout((()=>{c((()=>{"out"==n&&e?.remove(),e?.classList?.remove(a),o.trans?.hooks?.[`${n}-end`]?.(e)}))}),l+("in"==n&&o.trans?.swap||0))}}function $(t){let e=getComputedStyle(t)
return{w:`calc(${t.clientWidth}px - ${e.paddingLeft} - ${e.paddingRight})`,left:`calc(${t.getBoundingClientRect().left}px + ${window.scrollX}px)`,top:`calc(${t.getBoundingClientRect().top}px + ${window.scrollY}px)`}}function g(t){if(!t)return 0
if("number"==typeof t||!0===t)return t
if(t instanceof Map||t instanceof Set)return g(Array.from(t.entries()||t))
let e=0
for(let n of(new TextEncoder).encode(t?.toString()||""))e=(e<<5)-e+n
return e}globalThis.MfSt||(globalThis.MfSt=new Map),globalThis.MfFn||(globalThis.MfFn={}),globalThis.MfMutOb||(globalThis.MfMutOb=new Map)
class w{t=void 0
o=new Map
i=void 0
l=new Set
u=new Set
p
h
constructor(t,e){return this.m(t,e)}m(t,e){if(this.name=t,this.p=e?.scope||document.currentScript||"global",MfSt.set(t,this),this.p instanceof Element){let t=MfMutOb.get(this.p)||{toRemove:new Set}
t.observer||(t.observer=new MutationObserver((e=>{for(let n of e)if("childList"==n.type)for(let e of n.removedNodes)if(e instanceof Element)for(let n of t.toRemove)if(n.p==e){let e=this.p
b(n),t.observer.disconnect(),t.toRemove.delete(n),MfMutOb.delete(e)}})),t.observer.observe(this.p?.parentElement,{childList:!0})),t.toRemove.add(this),MfMutOb.set(this.p,t)}return e?.upstream?.map((t=>{let e=y(t)
return this.l.add(e),e.u.add(this),e})),this.value=e?.value,this.t=e?.updater,this.$(),this}sub(t,e,n=!0){this.o.set(e||o(),t),n&&t?.(this.value)}async update(t){return new Promise((async e=>{this.h&&clearTimeout(this.h),this.h=setTimeout((()=>{c((async()=>{let n="function"==typeof t?(await t)?.(this.value):t,o=g(n)
if(o!==this.i){this.value=n,this.i=o
for(let t of this.u)await t.$()
for(let[t,e]of this?.o||[])e?.(this.value,t)
e(this.value)}else e(this.value)}))}),0)}))}async $(){let t=await(this.t?.(Array.from(this.l)?.map((t=>t?.value))||[],this?.value))
await this.update(void 0===t?this.value:t)}}function y(t,e){let n=MfSt.get(t)
return e?n?n.m(t,e):new w(t,e):n||new w(t,e)}function b(t){MfSt.delete(t.name),t=void 0}function v(e,n,o,i,r,l,a){let f=async n=>{n?.preventDefault(),n?.stopPropagation(),r||(r=(n?.target)?.method||"get"),o?.fetch?.externals?.find((t=>i?.startsWith(t.domain)))||!i.match(/^https?:\/\//)||i.includes(location.origin)
let f=a?.(...l||[])||l,u=Array.isArray(f)?f[0]:"$form"==f?new FormData(e):f
if(a){let t=Array.isArray(f)?f?.map((t=>y(t).value))||[]:[u]
u=a?.(...t)}let p=await fetch(i,{...o?.fetch?.request||{},headers:{...o?.fetch?.request?.headers,"Manifold-App-Fetch":"true"},method:r,body:"$form"==f||"string"==typeof u?u:JSON.stringify(u)}).catch((t=>{o?.fetch?.err?.(t)||console.error("FETCH ERROR",t)})),d=p?.status
if(d&&0==o?.fetch?.onCode?.(d,p))return
let h=await(p?.[o?.fetch?.responseType||"text"]())
for(let n of["append","prepend","swapinner","swapouter"]){let i=e.dataset[`${t}${n}`]
if(void 0===i)continue
let[r,s]=i?.split("->").map((t=>t.trim()))||[],l=(new DOMParser)?.parseFromString?.(h,"text/html")
l&&c({in:l.querySelector(r||"body"),out:s?document.querySelector(s):e,relation:n,ops:o,done:t=>{O(t)}})}void 0!==e.dataset?.[`${t}pushstate`]&&history.pushState({},"",i)
let m=e.dataset?.[`${t}resolve`],$=s(m||"")?.func
$?.(h)}
"$mount"==n?f():e.addEventListener(n,f)}function M(t,e,n=[],o=[]){if(t.tagName==e)return t
let i=document.createElement(e)
return i.innerHTML=t.innerHTML,[...t.attributes].filter((t=>!n.includes(t.name))).forEach((t=>i.setAttribute(t.name,t.value))),o.forEach((t=>i.classList.remove(t))),t.replaceWith(i),i}function T(t,e){if(t instanceof Map)for(const[n,o]of t.entries())e(n,o)
else try{let n=Array.from(t||[])
if(n?.length)n.forEach(e)
else for(let n in t)e(n,t[n])}catch(e){console.error(`${t} is not iterable`)}}function S(t,e,n){return e?.(t)?t:S(n?.(t)||t?.nextElementSibling,e,n)}function x(t="",e=[],n){return y(t,{upstream:[...e],updater:t=>{try{return n?.func?.(...t)||t[0]}catch(t){return}},scope:n?.observeEl})}function E(t,e,n,i,r,s){if(r.match("bind"))x(o(),e,{observeEl:t,func:()=>{let o=s?.(...e.map((t=>MfSt.get(t).value||globalThis.value)),t)
if(n&&null!=o){let[e,i]=n.split(":")
"style"==e?t.style[i]=o:"attr"==e?t.setAttribute(i,o):t[n]=o}return t.dispatchEvent(new CustomEvent(i)),o}})
else{let o=()=>{e.length>1&&console.warn("Multiple sync props",t)
let[o,i]=e?.[0].trim().split(":"),r="style"==o?t.style[i]:"attr"==o?t.getAttribute(i):t[o],l=parseFloat(r)
isNaN(l)||(r=l)
let a=s?.(r,t)
n&&void 0!==a&&y(n)?.update?.(a)}
"$mount"==i?o():t.addEventListener(i,o)}}function _(e,n,i,r,l,a){let f=document.createElement("template"),u=M(e.cloneNode(!0),"TEMPLATE")
f.classList.add(`${n}-start`),u.classList.add(`${n}-end`),u.dataset.nodeName=e.nodeName,e.before(f),e.after(u),e.remove(),x(o(),l,{func:r,observeEl:u}).sub((e=>{c((()=>{S(f?.nextElementSibling,(t=>t?.classList?.contains(`${n}-end`)),(t=>m(t,"out",a,(()=>t?.remove())))),(n.match(/each/)?T:(t,e)=>e(t||""))(e,((e,o)=>{if(null==e)return
let r,l=u?.innerHTML||u?.textContent?.replace(/^\n{0,}|\n{0,}$/,"")||"",f=l.match(/\${[^}]*}/g)||[]
for(let t of f)try{let n=s(`(${i.join(",")})=> ${t.slice(2,t.length-1)}`)?.func
l=l.replace(t,n?.(e,o)||"")}catch(t){l="Error in template. Check console for details.",console.error(t)}if(n.match(/each/)){let t=u.cloneNode(!0)
t.innerHTML=l||e,r=t.content.children}else{let o=M(u.cloneNode(!0),u.dataset.nodeName,["data-node-name",`data-${t}`],[`${n}-end`])
o.innerHTML=l||e,r=[o]}for(let t of r)u.before(t),m(t,"in",a,(()=>O(t)))}))}))}))}let A={},F=["bind","sync","templ","if","each","get","head","post","put","delete","patch"].map((e=>`${t}${e}`))
function O(e){if(e&&e.nodeType==Node.TEXT_NODE)return
let o=(e||document.body).querySelectorAll(`[data-${F.join("],[data-")}],a,form`)||[]
for(let e of o){let o=r(A,e)
if(void 0!==e.dataset?.[`${t}promote`]){let[t,n,i,r]="A"==e.tagName?["get",e.href,[],"click"]:[e.method.toLowerCase(),e.action,"$form","submit"]
if(n){v(e,r,o,n,t,i)
continue}}for(let i in e.dataset){if(!F.includes(i))continue
let r=!i.match(/bind|templ|if|each/)
for(let l of e.dataset?.[i]?.split(";;")||[]){let[a,f]=l?.split("->")?.map((t=>t.trim()))||[],u=r&&a.slice(0,a.indexOf(")"))?.match(/[^\(\)]{1,}/g)?.pop()?.split(n)?.map((t=>t.trim()))||[]
!f&&i.match(/get|head|post|put|delete|patch/)&&(f=a.slice(a.indexOf(")")+1),a="")
let c=r?a?.slice(a.indexOf(")")+1):a
if(r&&!u?.length){console.error("No trigger",e)
break}let{func:p,valueList:d,as:h}=s(c)
if(c&&!p&&console.warn(`"${c}" not registered`,e),i.match(/if|each|templ/))_(e,i,h||[],p,d||[],o)
else{u?.length||(u=[""])
for(let n of u)i.match(/bind|sync/)?E(e,d,f,n,i,p):v(e,n,o,f,i.replace(t,""),d,p)}}}}}
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
let N={store:
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
(new_ops,profile_name)=>{return t=new_ops,void((e=profile_name)?A.profiles={...A.profiles,[e]:t}:A={...A,...t})

;/**!
 * @param {Partial<MfldOps>} newops 
 * @param {string} [profileName] 
 */
var t,e},onTick:
/**!
  * - Wait for the next Manifold data update cycle to complete before executing the callback function.
  * @param {()=> void} cb
  */
t=>{var e;(e=t)&&f.push(e)},register:
/**!
 * - Register Manifold subscriptions on the DOM. *Optional:* Pass an `HTMLElement` or selector string to scope the registration to a specific element.
 * @param {HTMLElement | string | null} [parent]
 */
t=>{"string"==typeof t&&(t=document.querySelector(t)),O(t)}}
exports.Mfld=N
