let t,e=[],n=!1,o=[],i="",r=globalThis?.requestAnimationFrame||(t=>setTimeout(t,0))
function s(t){e.push(t),n||(n=!0,r(f))}function l(e,n,o,r=!1,s){if(!s.trans?.smartTransition??1)return
t=document.createElement("div")
let{paddingTop:l,paddingBottom:a}=n instanceof Element?window.getComputedStyle(n):{paddingTop:0,paddingBottom:0}
i=t.style.height=`calc(${Math.abs(o-(e?.clientHeight||0))}px - ${l} - ${a})`,n?.after(t)}function a(e,n){if(!n.trans?.smartTransition??1)return
let o=(n?.trans?.dur?.[0]||n?.trans?.dur||600)/2
s((()=>{t?.remove(),e?.animate?.([{height:i},{height:`${e.clientHeight||0}px`}],o)}))}function f(){n=!1
for(let t of e)if("function"==typeof t)t()
else{let e=t.out?t.out.clientHeight:0
if("prepend"==t.relation)l?.(t.in,t.out,e,!1,t.ops),u(t.in,"in",t.ops,(()=>{t.in&&t.out?.prepend(t.in),a?.(t.in,t.ops)}))
else{if(["swapinner","swapouter"].includes(t.relation)){let e=t.out?.cloneNode(!0)
t.out?.after(e)
let n="swapinner"==t.relation
"swapinner"==t.relation&&(e.style.border="none",t.out.replaceChildren()),u(e,"out",t.ops,void 0,t.out,n)}l?.(t.in,t.out,e,!1,t.ops),u(t.in,"in",t.ops,(()=>{t.in&&("swapouter"==t.relation?t.out?.replaceWith(t.in):t.out?.appendChild(t.in)),a?.(t.in,t.ops)}))}t.done?.(t.in)}o.forEach((t=>t())),o=[],e=[]}function u(t,e,n,o,i,r=!1){if(t?.nodeType==Node.TEXT_NODE){let e=t.textContent,n=document?.createElement("div")
n.textContent=e,t.replaceWith(n),t=n}if(t){let l=Array.isArray(n.trans?.dur)?n.trans?.dur["in"==e?0:1]||n.trans?.dur[0]:n.trans?.dur||0,a=n?.trans?.class||"mf-trans"
if(t?.classList?.add(a),n.trans?.hooks?.[`${e}-start`]?.(t),"out"==e){if(i||(i=t),!i)return
let e={}
if((n.trans?.smartTransition??1)&&0==r){let t=getComputedStyle(i)
e.w=`calc(${i.clientWidth}px - ${t.paddingLeft} - ${t.paddingRight})`,e.left=`calc(${i.getBoundingClientRect().left}px + ${window.scrollX}px)`,e.top=`calc(${i.getBoundingClientRect().top}px + ${window.scrollY}px)`}s((()=>{if(n.trans?.smartTransition??1){if(r&&i){let t=getComputedStyle(i)
e.w=`calc(${i.clientWidth}px - ${t.paddingLeft} - ${t.paddingRight})`,e.left=`calc(${i.getBoundingClientRect().left}px + ${window.scrollX}px)`,e.top=`calc(${i.getBoundingClientRect().top}px + ${window.scrollY}px)`}t.style.position="fixed",t.style.width=e.w,t.style.left=e.left,t.style.top=e.top,t.style.margin="0"}l&&(t.style.transitionDuration=`${l}ms`),t.classList?.add("out")}))}else t?.classList?.add("in"),l&&(t.style.transitionDuration=`${l}ms`),o?.(),setTimeout((()=>{s((()=>{setTimeout((()=>s((()=>t?.classList?.remove(e)))),0)}))}),n.trans?.swap||0)
setTimeout((()=>{s((()=>{"out"==e&&t?.remove(),t?.classList?.remove(a),n.trans?.hooks?.[`${e}-end`]?.(t)}))}),l+("in"==e&&n.trans?.swap||0))}}function c(t){if(!t)return 0
if("number"==typeof t)return t
if(!0===t)return 1
if(t instanceof Map)return c(Array.from(t.entries()))
if(t instanceof Set)return c(Array.from(t))
let e=0
for(let n of(new TextEncoder).encode("string"==typeof t?t:t?.toString()||""))e=(e<<5)-e+n
return e}globalThis.MfSt||(globalThis.MfSt=new Map),globalThis.MfFn||(globalThis.MfFn=new Map)
class d{t=void 0
o=new Map
i=void 0
l
u=new Set
constructor(t,e){return this.p(t,e)}p(t,e){return this.name=t,MfSt.set(t,this),this.l=new Set(e?.upstream?.map((t=>p(t)))||[]),this.l.forEach((t=>t?.u?.add(this))),this.value=e?.value,this.t=e?.updater,this}sub(t,e,n=!0){this.o.set(e||String(Date.now()+Math.random()),t),n&&t?.(this.value)}async update(t){return new Promise((async e=>{let n="function"==typeof t?(await t)?.(this.value):t,o=c(n)
if(o!==this.i){this.value=n,this.i=o
for(let t of this.u)await t.h()
s((()=>{for(let[t,e]of this?.o||[])e?.(this.value,t)
e(this.value)}))}else e(this.value)}))}async h(){let t=await(this.t?.(Array.from(this.l)?.map((t=>t?.value))||[],this?.value))
await this.update(void 0===t?this.value:t)}}function p(t,e){let n=MfSt.get(t)
return e?n?n.p(t,e):new d(t,e):n||new d(t,e)}let h="mf",$=/[\.\[\]\?]{1,}/g
function m(t,e,n){let o=t
for(let t of e)null==o&&(o="number"==typeof t?[]:{}),null==n||e[e.length-1]!==t?o=o instanceof Map?o?.get(t):o?.[t]:o instanceof Map?o.set(t,n):o[t]=n
return o}function w(t){let[e,...n]=t?.split($)
return[e,n?.map((t=>isNaN(parseInt(t))?t:parseInt(t))).filter((t=>t))||[]]}function g(t,e,n,o=!0,i="{}",r){let s=e.dataset[`${h}${t}`]
if(s)return"overrides"==t?n.profiles?.[s||""]?.fetch||JSON.parse(s||"{}"):o?JSON.parse(s||i):"num"==r?parseInt(s)||void 0:"bool"==r?"true"==s||"false"!=s&&void 0:s}function y(t,e){let n=g("overrides",e,t)
return{profiles:t.profiles,fetch:{...t.fetch,responseType:g("responsetype",e,t,!1)||t.fetch?.responseType,...n?.fetch||{},...g("fetch",e,t)||{}},trans:{...t.trans,dur:g("transdur",e,t,!0,"[]","num")||t.trans?.dur,swap:g("transswap",e,t,!1,"","num")||t.trans?.swap,class:g("transclass",e,t,!1)||t.trans?.class,smartTransition:g("transsmart",e,t,!1,void 0,"bool")||t.trans?.smartTransition,...n?.trans||{},...g("trans",e,t)||{}}}}function v(t){let e="",n=""
if("string"==typeof t?(e=t,n=t):(e=t?.el?.dataset?.[t?.datakey]||"",n=e,e||void 0===t?.el?.dataset?.[`${h}else`]||(e="return true",n=`ELSE:${t?.el?.dataset?.[t?.datakey]||""}`)),!e)return{}
let[o,i]=e?.split("=>")?.map((t=>t.trim()))||["",""]
i||(i=o.slice(),o="")
let r=o?.split(",")?.map((t=>t.replace(/[()]/g,"").trim())),s=globalThis[i]||MfFn?.get(i)
return s||(i.match(/^\s{0,}\{/)||i.includes("return")||(i=i.replace(/^\s{0,}/,"return ")),s=new Function(...r,i)),{storeList:r,func:s,storeName:n}}function T(t,e,n,o,i,r,l){let a=async e=>{e?.preventDefault(),e?.stopPropagation()
let a=y(n,t)
i||(i=(e?.target)?.method||"get"),a?.fetch?.externals?.find((t=>o?.startsWith(t.domain)))||!o.match(/^https?:\/\//)||o.includes(location.origin)
let f=r
console.log("FETCH PROCESS FUNC",l),l&&(f=l?.(...r?.map((t=>p(t).value))||[]))
let u=await fetch(o,{...a?.fetch?.request||{},headers:{...a?.fetch?.request?.headers,"Manifold-App-Fetch":"true"},method:i,body:"string"==typeof f?f:JSON.stringify(f)}).catch((t=>{a?.fetch?.err?.(t)||console.error("FETCH ERROR",t)})),c=u?.status
if(c&&0==a?.fetch?.onCode?.(c,u))return
let d=await(u?.[a?.fetch?.responseType||"text"]())
console.log("RESP",u,d,a?.fetch?.responseType||"text")
for(let e of["append","prepend","swapinner","swapouter"]){let n=t.dataset[`${h}${e}`]
if(void 0===n)continue
let[o,i]=n?.split("->").map((t=>t.trim()))||[],r=(new DOMParser)?.parseFromString?.(d,"text/html")
r&&s({in:r.querySelector(o||"body"),out:i?document.querySelector(i):t,relation:e,ops:a,done:t=>{_(t)}})}let $=t.dataset?.[`${h}resolve`],m=v($||"")?.func
m?.(d)}
"$mount"==e?a():t.addEventListener(e,a)}function b(t,e,n,o,i,r){if(i==`${h}bind`){let i=e.map(w),l=()=>{s((()=>{let e=i.map((t=>m(p(t[0])?.value,t[1]))),s=r?.(...e,t)??e[0]
n&&void 0!==s&&(t[n]=s),t.dispatchEvent(new CustomEvent(o))}))}
for(let e of i)p(e?.[0]||"")?.sub(l,t.id)}else if(i==`${h}sync`){let[i,s]=w(n||""),l=()=>{let n=e.map((e=>(e=e.trim(),t[e]??t.getAttribute(e)??t.dataset[e]??void 0))),o=r?.(...n)??n[0]
i&&void 0!==o&&p(i)?.update?.((t=>s?.length?m(t,s,o):o))}
"$mount"==o?l():t.addEventListener(o,l)}}function M(t,e){if("TEMPLATE"!=t.tagName){let n=document.createElement("template")
n.innerHTML=t.innerHTML
for(let e of t.attributes)n.setAttribute(e.name,e.value)
return t.replaceWith(n),e.innerHTML=t.innerHTML,n}return t}function S(t,e,n,o,i){return p(t||"",{upstream:[...e||[],...n||[]],updater:t=>{if(o)for(let e of t.slice(-o)||[])if(e)return!1
return i?.(...t)}})}function x(t,e,n){let o=y(n,t),i=document.createElement("div")
if(t.before(i),e==`${h}if`){i.classList.add("mfld-active-condition")
let n=t,r=[]
for(;n&&n;){let{storeList:t,func:l,storeName:a}=v({el:n,datakey:r.length?`${h}elseif`:e})
if(!t&&!l)break
n=M(n,i)
let f=S(a,t,r,r.length,l)
r.push(f.name)
let u=n.cloneNode(!0)
f?.sub((t=>{if(!t)return
let e=document.createElement("div")
e.innerHTML=u.innerHTML,"TEMPLATE"==u?.tagName&&s({in:e,out:i,relation:"swapinner",ops:o,done:t=>_(t)})})),n=n?.nextElementSibling}}if(e==`${h}each`){i.classList.add("mfld-loop-result")
let[e,n]=t.dataset[`${h}each`]?.split("as")?.map((t=>t.trim()))||[],[r,l]=n.split(/\s{0,},\s{0,}/)?.map((t=>t.trim()))||["value","key"],{storeList:a,func:f,storeName:u}=v(e)
t=M(t,i)
let c=S(`LOOP:${u}`,a,[],0,f)
c?.sub((e=>{i.replaceChildren(),function(t,e){if(t instanceof Map)for(const[n,o]of t.entries())e(n,o)
else try{let n=Array.from(t)
if(n?.length)n.forEach(e)
else for(let n in t)e(n,t[n])}catch(e){console.error(`${t} is not iterable`)}}(e||[],((e,n)=>{let a=t.innerHTML,f=t.innerHTML.match(/\${[^}]*}/g)||[]
for(let t of f){let o=t.replace(/^\$\{|\}$/g,"")
try{let i=v(`(${l}, ${r})=> ${o}`)?.func
a=a.replace(t,i?.(n,e)||"")}catch(t){console.error("Syntax error in loop function",t)}}let u=document.createElement("div")
u.innerHTML=a,s({in:u,out:i,relation:"append",ops:o,done:t=>_(t)})}))}))}}let E={},N=/, {0,}/g,O=0,A=["bind","sync","if","each","get","head","post","put","delete","patch"].map((t=>`${h}${t}`))

;/**!
 * @param {Partial<MfldOps>} newops 
 * @param {string} [profileName] 
 */
function F(t,e){e?E.profiles={...E.profiles,[e]:t}:E={...E,...t}}function _(t){let e=(t||document.body).querySelectorAll(`[data-${A.join("],[data-")}]${0!=E.fetch?.auto?",a":""}`)||[]
for(let t of e){t.id||(t.id=""+O++)
for(let e in t.dataset){if([`${h}if`,`${h}each`].includes(e)){x(t,e,E)
continue}if(!A.includes(e))continue
let n=![`${h}bind`].includes(e),o=`(#${t.id} on ${e})`
t.dataset?.[e]?.split(";").forEach((i=>{let[r,s]=i?.split("->")?.map((t=>t.trim()))||[],l=n?C(r.slice(0,r.indexOf(")"))):[],a=n?r.slice(r.indexOf(")")+1):r,f=a.includes("=>")?a:a.includes("(")&&a.match(/^[^\(]{1,}/)?.[0]||"",u=f?C(a.slice(0,(a.indexOf(")")||-2)+1)):a.split(N)?.map((t=>t.trim()))
if(n&&!l?.length)return console.error(`No trigger: ${o}.`)
let c=v(f)?.func
f?c||console.warn(`"${f}" not registered: ${o}`):u.length>1&&console.warn(`Multiple inputs without function: ${o}`),l?.length||(l=[""])
for(let n of l)e.match(/bind|sync/)?b(t,u,s,n,e,c):(s||(s=u[0],u=[]),console.log("Sending func",c),T(t,n,E,s,e.replace(h,""),u,c))}))}}}function C(t){if(t?.includes("(")){let e=t.match(/[^\(\)]{1,}/g)
t=e?.[e.length-1]||""}return t?.split(N)?.map((t=>t.trim()))||[]}
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
 * @property {boolean} [auto] - Automatically fetch content on page load
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
 * @typedef {Object} StoreOptions
 * @property {T} [value]
 * @property {Array<string>} [upstream]
 * @property {UpdaterFunction<T>} [updater]
 */
/**!
 * @template T
 * @typedef Store
 * @prop {T} value - The store's current value (read only)
 * @prop {function(T | function(T):T|Promise<T>|undefined):T|Promise<T>|undefined} update - Update the store's current value
 * @prop {function(function(T):void,string):void} sub - Add a subscription function to the store
 */
/**!
 * @typedef {Function} MfldFunc
 * @param {any} val
 * @param {HTMLElement} [el]
 */
/**!
 * The global Manifold interface.
 */let L={store:
/**!
* - Create or overwrite a _typed_ global Manifold store by passing `store_ops` (`MfldOps`) -> *returns `Store\<T\>`* 
* - Retrieve an untyped reference to the store specified by name by omitting `store_ops` -> *returns `Store\<any\>`*
* @template T
* @param {string} store_name
* @param {StoreOptions<T> | T} store_ops
* @return {Store<T>}
*/
(store_name,store_ops)=>(store_ops?.hasOwnProperty("value")||store_ops?.hasOwnProperty("updater")||(store_ops={value:store_ops}),p(store_name,store_ops)),ustore:
/**!
* - Create or overwrite an untyped global Manifold store by passing `store_ops` (`MfldOps`) -> *returns `Store\<any\>`* 
* - Retrieve an untyped reference to the store specified by name by omitting `store_ops` -> *returns `Store\<any\>`*
* @param {string} store_name
* @param {StoreOptions<any> | any} store_ops
* @return {Store<any>}
*/
(store_name,store_ops)=>p(store_name,store_ops),get:
/**!
 * - Retrieve a Manifold store by name. *returns `Store\<any\>`*
 * @param {string} store_name
 * @return {Store<any>}
 */
store_name=>p(store_name),func:
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
(new_ops,profile_name)=>F(new_ops,profile_name),onTick:
/**!
  * - Wait for the next Manifold data update cycle to complete before executing the callback function.
  * @param {()=> void} cb
  */
t=>{var e;(e=t)&&o.push(e)},register:
/**!
 * - Register Manifold subscriptions on the DOM. *Optional:* Pass an `HTMLElement` or selector string to scope the registration to a specific element.
 * @param {HTMLElement | string | null} [parent]
 */
t=>{"string"==typeof t&&(t=document.querySelector(t)),_(t)}}
globalThis.Mfld=L
let P=globalThis.document?.currentScript?.dataset||{}
if(P?.config)try{F(JSON.parse(P?.config))}catch(t){console.warn("Invalid Mfld params",t)}P?.init&&_(document.querySelector(P.init))
