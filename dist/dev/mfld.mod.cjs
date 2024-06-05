let t,e=[],n=!1,i=[],o="",r=globalThis?.requestAnimationFrame||(t=>setTimeout(t,0))
function s(t){e.push(t),n||(n=!0,r(f))}function l(e,n,i,r=!1,s){if(!s.trans?.smartTransition??1)return
t=document.createElement("div")
let{paddingTop:l,paddingBottom:a}=n instanceof Element?window.getComputedStyle(n):{paddingTop:0,paddingBottom:0}
o=t.style.height=`calc(${Math.abs(i-(e?.clientHeight||0))}px - ${l} - ${a})`,n?.after(t)}function a(e,n){if(!n.trans?.smartTransition??1)return
let i=(n?.trans?.dur?.[0]||n?.trans?.dur||600)/2
s((()=>{t?.remove(),e?.animate?.([{height:o},{height:`${e.clientHeight||0}px`}],i)}))}function f(){n=!1
for(let t of e)if("function"==typeof t)t()
else{let e=t.out?t.out.clientHeight:0
if("prepend"==t.relation)l?.(t.in,t.out,e,!1,t.ops),u(t.in,"in",t.ops,(()=>{t.in&&t.out?.prepend(t.in),a?.(t.in,t.ops)}))
else{if(["swapinner","swapouter"].includes(t.relation)){let e=t.out?.cloneNode(!0)
t.out?.after(e)
let n="swapinner"==t.relation
"swapinner"==t.relation&&(e.style.border="none",t.out.replaceChildren()),u(e,"out",t.ops,void 0,t.out,n)}l?.(t.in,t.out,e,!1,t.ops),u(t.in,"in",t.ops,(()=>{t.in&&("swapouter"==t.relation?t.out?.replaceWith(t.in):t.out?.appendChild(t.in)),a?.(t.in,t.ops)}))}t.done?.(t.in)}i.forEach((t=>t())),i=[],e=[]}function u(t,e,n,i,o,r=!1){if(t?.nodeType==Node.TEXT_NODE){let e=t.textContent,n=document?.createElement("div")
n.textContent=e,t.replaceWith(n),t=n}if(t){let l=Array.isArray(n.trans?.dur)?n.trans?.dur["in"==e?0:1]||n.trans?.dur[0]:n.trans?.dur||0,a=n?.trans?.class||"mf-trans"
if(t?.classList?.add(a),n.trans?.hooks?.[`${e}-start`]?.(t),"out"==e){if(o||(o=t),!o)return
let e={}
if((n.trans?.smartTransition??1)&&0==r){let t=getComputedStyle(o)
e.w=`calc(${o.clientWidth}px - ${t.paddingLeft} - ${t.paddingRight})`,e.left=`calc(${o.getBoundingClientRect().left}px + ${window.scrollX}px)`,e.top=`calc(${o.getBoundingClientRect().top}px + ${window.scrollY}px)`}s((()=>{if(n.trans?.smartTransition??1){if(r&&o){let t=getComputedStyle(o)
e.w=`calc(${o.clientWidth}px - ${t.paddingLeft} - ${t.paddingRight})`,e.left=`calc(${o.getBoundingClientRect().left}px + ${window.scrollX}px)`,e.top=`calc(${o.getBoundingClientRect().top}px + ${window.scrollY}px)`}t.style.position="fixed",t.style.width=e.w,t.style.left=e.left,t.style.top=e.top,t.style.margin="0"}l&&(t.style.transitionDuration=`${l}ms`),t.classList?.add("out")}))}else t?.classList?.add("in"),l&&(t.style.transitionDuration=`${l}ms`),i?.(),setTimeout((()=>{s((()=>{setTimeout((()=>s((()=>t?.classList?.remove(e)))),0)}))}),n.trans?.swap||0)
setTimeout((()=>{s((()=>{"out"==e&&t?.remove(),t?.classList?.remove(a),n.trans?.hooks?.[`${e}-end`]?.(t)}))}),l+("in"==e&&n.trans?.swap||0))}}function c(t){if(!t)return 0
if("number"==typeof t)return t
if(!0===t)return 1
if(t instanceof Map)return c(Array.from(t.entries()))
if(t instanceof Set)return c(Array.from(t))
let e=0
for(let n of(new TextEncoder).encode("string"==typeof t?t:t?.toString()||""))e=(e<<5)-e+n
return e}globalThis.MfSt||(globalThis.MfSt=new Map),globalThis.MfFn||(globalThis.MfFn=new Map)
class d{t=void 0
i=new Map
o=void 0
l
u=new Set
constructor(t,e){return this.p(t,e)}p(t,e){return this.name=t,MfSt.set(t,this),this.l=new Set(e?.upstream?.map((t=>p(t)))||[]),this.l.forEach((t=>t?.u?.add(this))),this.value=e?.value,this.t=e?.updater,this}sub(t,e,n=!0){this.i.set(e||String(Date.now()+Math.random()),t),n&&t?.(this.value)}async update(t){return new Promise((async e=>{let n="function"==typeof t?(await t)?.(this.value):t,i=c(n)
if(i!==this.o){this.value=n,this.o=i
for(let t of this.u)await t.$()
s((()=>{for(let[t,e]of this?.i||[])e?.(this.value,t)
e(this.value)}))}else e(this.value)}))}async $(){let t=await(this.t?.(Array.from(this.l)?.map((t=>t?.value))||[],this?.value))
await this.update(void 0===t?this.value:t)}}function p(t,e){let n=MfSt.get(t)
return e?n?n.p(t,e):new d(t,e):n||new d(t,e)}let $="mf",h=/[\.\[\]\?]{1,}/g
function m(t,e,n){let i=t
for(let t of e)null==i&&(i="number"==typeof t?[]:{}),null==n||e[e.length-1]!==t?i=i instanceof Map?i?.get(t):i?.[t]:i instanceof Map?i.set(t,n):i[t]=n
return i}function w(t){let[e,...n]=t?.split(h)
return[e,n?.map((t=>isNaN(parseInt(t))?t:parseInt(t))).filter((t=>t))||[]]}function g(t,e){let n=["overrides","fetch","trans","transdur","transswap","transclass","responseType"].map((i=>"overrides"==i?t.profiles?.[n]?.fetch||JSON.parse(n):JSON.parse(e.dataset[`${$}${i}`]||"{}")))
return{profiles:t.profiles,fetch:{...t.fetch,responseType:n?.[6],...n?.[0]?.fetch||{},...n?.[1]||{}},trans:{...t.trans,duration:n?.[3],swap:n?.[4],class:n?.[5],...n?.[0]?.trans||{},...n?.[2]||{}}}}function y(t){let e="",n=""
if("string"==typeof t?(e=t,n=t):(e=t?.el?.dataset?.[t?.datakey]||"",n=e,e||void 0===t?.el?.dataset?.[`${$}else`]||(e="return true",n=`ELSE:${t?.el?.dataset?.[t?.datakey]||""}`)),!e)return{}
let[i,o]=e?.split("=>")?.map((t=>t.trim()))||["",""]
o||(o=i.slice(),i="")
let r=i?.split(",")?.map((t=>t.replace(/[()]/g,"").trim())),s=globalThis[o]||MfFn?.get(o)
return s||(o.match(/^\s{0,}\{/)||o.includes("return")||(o=o.replace(/^\s{0,}/,"return ")),s=new Function(...r,o)),console.log(s),{storeList:r,func:s,storeName:n}}function v(t,e,n,i,o,r){let l=async e=>{e?.preventDefault(),e?.stopPropagation()
let l=g(n,t)
o||(o=(e?.target)?.method||"get"),l?.fetch?.externals?.find((t=>i?.startsWith(t.domain)))||!i.match(/^https?:\/\//)||i.includes(location.origin)
let a=await fetch(i,{...l?.fetch?.request||{},method:o,body:"string"==typeof r?r:JSON.stringify(r)}).catch((t=>{l?.fetch?.err?.(t)})),f=a?.status
if(f&&0==l?.fetch?.onCode?.(f,a))return
let u=await(a?.[l?.fetch?.responseType||"text"]())
l?.fetch?.cb?.(u)
for(let e of["append","prepend","swapinner","swapouter"]){let n=t.dataset[`${$}${e}`]
if(void 0===n)continue
let[i,o]=n?.split("->").map((t=>t.trim()))||[],r=(new DOMParser)?.parseFromString?.(u,"text/html")
r&&s({in:r.querySelector(i||"body"),out:o?document.querySelector(o):t,relation:e,ops:l,done:t=>{_(t)}})}t.dataset?.[`${$}resolve`]&&alert("RESOLVING")}
"$mount"==e?l():t.addEventListener(e,l)}function T(t,e,n,i,o,r){if(o==`${$}bind`){let o=e.map(w),l=()=>{s((()=>{let e=o.map((t=>m(p(t[0])?.value,t[1]))),s=r?.(...e,t)??e[0]
n&&void 0!==s&&(t[n]=s),t.dispatchEvent(new CustomEvent(i))}))}
for(let e of o)p(e?.[0]||"")?.sub(l,t.id)}else if(o==`${$}sync`){let[o,s]=w(n||""),l=()=>{let n=e.map((e=>(e=e.trim(),t[e]??t.getAttribute(e)??t.dataset[e]??void 0))),i=r?.(...n)??n[0]
o&&void 0!==i&&p(o)?.update?.((t=>s?.length?m(t,s,i):i))}
"$mount"==i?l():t.addEventListener(i,l)}}function b(t,e){if("TEMPLATE"!=t.tagName){let n=document.createElement("template")
n.innerHTML=t.innerHTML
for(let e of t.attributes)n.setAttribute(e.name,e.value)
return t.replaceWith(n),e.innerHTML=t.innerHTML,n}return t}function M(t,e,n,i,o){return p(t||"",{upstream:[...e||[],...n||[]],updater:t=>{if(i)for(let e of t.slice(-i)||[])if(e)return!1
return o?.(...t)}})}function x(t,e,n){let i=g(n,t),o=document.createElement("div")
if(t.before(o),e==`${$}if`){o.classList.add("mfld-active-condition")
let n=t,r=[]
for(;n&&n;){let{storeList:t,func:l,storeName:a}=y({el:n,datakey:r.length?`${$}elseif`:e})
if(!t&&!l)break
n=b(n,o)
let f=M(a,t,r,r.length,l)
r.push(f.name)
let u=n.cloneNode(!0)
f?.sub((t=>{if(!t)return
let e=document.createElement("div")
e.innerHTML=u.innerHTML,"TEMPLATE"==u?.tagName&&s({in:e,out:o,relation:"swapinner",ops:i,done:t=>_(t)})})),n=n?.nextElementSibling}}if(e==`${$}each`){o.classList.add("mfld-loop-result")
let[e,n]=t.dataset[`${$}each`]?.split("as")?.map((t=>t.trim()))||[],[r,l]=n.split(/\s{0,},\s{0,}/)?.map((t=>t.trim()))||["value","key"],{storeList:a,func:f,storeName:u}=y(e)
t=b(t,o)
let c=M(`LOOP:${u}`,a,[],0,f)
c?.sub((e=>{o.replaceChildren(),function(t,e){if(t instanceof Map)for(const[n,i]of t.entries())e(n,i)
else try{let n=Array.from(t)
if(n?.length)n.forEach(e)
else for(let n in t)e(n,t[n])}catch(e){console.error(`${t} is not iterable`)}}(e||[],((e,n)=>{let a=document.createElement("div")
a.innerHTML=t.innerHTML.replace(`\${${l}}`,e).replace(`\${${r}}`,n),s({in:a,out:o,relation:"append",ops:i,done:t=>_(t)})}))}))}}let S={},N=/, {0,}/g,E=0,L=["bind","sync","if","each","get","head","post","put","delete","patch"].map((t=>`${$}${t}`))
function _(t){let e=(t||document.body).querySelectorAll(`[data-${L.join("],[data-")}]${0!=S.fetch?.auto?",a":""}`)||[]
for(let t of e){t.id||(t.id=""+E++)
for(let e in t.dataset){if([`${$}if`,`${$}each`].includes(e)){console.log("Handling conditionals",e),x(t,e,S)
continue}if(!L.includes(e))continue
let n=![`${$}bind`].includes(e),i=`(#${t.id} on ${e})`
t.dataset?.[e]?.split(";").forEach((o=>{let[r,s]=o?.split("->")?.map((t=>t.trim()))||[],l=n?A(r.slice(0,r.indexOf(")"))):[],a=n?r.slice(r.indexOf(")")+1):r,f=a.includes("=>")?a:a.includes("(")&&a.match(/^[^\(]{1,}/)?.[0]||"",u=f?A(a.slice(0,(a.indexOf(")")||-2)+1)):a.split(N)?.map((t=>t.trim()))
if(console.log(o,f),n&&!l?.length)return console.error(`No trigger: ${i}.`)
let c=y(f)?.func
f?c||console.warn(`"${f}" not registered: ${i}`):u.length>1&&console.warn(`Multiple inputs without function: ${i}`),l?.length||(l=[""])
for(let n of l)e.match(/bind|sync/)?T(t,u,s,n,e,c):v(t,n,S,u[0],e.replace($,""),s)}))}}}function A(t){if(t?.includes("(")){let e=t.match(/[^\(\)]{1,}/g)
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
 * @property {(val: any)=> void} [cb] - Callback function - run on successful fetch; *val* is the un-parsed response body
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
 */let O={store:
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
t=>{var e;(e=t)&&i.push(e)},register:
/**!
 * - Register Manifold subscriptions on the DOM. *Optional:* Pass an `HTMLElement` or selector string to scope the registration to a specific element.
 * @param {HTMLElement | string | null} [parent]
 */
t=>{"string"==typeof t&&(t=document.querySelector(t)),_(t)}}
exports.Mfld=O
