let t,e=[],n=!1,o=[],i="",r=globalThis?.requestAnimationFrame||(t=>setTimeout(t,0))
function s(t){e.push(t),n||(n=!0,r(u))}function l(e,n,o,r=!1,s){if(!s.trans?.smartTransition??1)return
t=document.createElement("div")
let{paddingTop:l,paddingBottom:f}=n instanceof Element?window.getComputedStyle(n):{paddingTop:0,paddingBottom:0}
i=t.style.height=`calc(${Math.abs(o-(e?.clientHeight||0))}px - ${l} - ${f})`,n?.after(t)}function f(e,n){if(!n.trans?.smartTransition??1)return
let o=(n?.trans?.dur?.[0]||n?.trans?.dur||600)/2
s((()=>{t?.remove(),e?.animate?.([{height:i},{height:`${e.clientHeight||0}px`}],o)}))}function u(){n=!1
for(let t of e)if("function"==typeof t)t()
else{let e=t.out?t.out.clientHeight:0
if("prepend"==t.relation)l?.(t.in,t.out,e,!1,t.ops),a(t.in,"in",t.ops,(()=>{t.in&&t.out?.prepend(t.in),f?.(t.in,t.ops)}))
else{if(["swapinner","swapouter"].includes(t.relation)){let e=t.out?.cloneNode(!0)
t.out?.after(e)
let n="swapinner"==t.relation
"swapinner"==t.relation&&(e.style.border="none",t.out.replaceChildren()),a(e,"out",t.ops,void 0,t.out,n)}l?.(t.in,t.out,e,!1,t.ops),a(t.in,"in",t.ops,(()=>{t.in&&("swapouter"==t.relation?t.out?.replaceWith(t.in):t.out?.appendChild(t.in)),f?.(t.in,t.ops)}))}t.done?.(t.in)}o.forEach((t=>t())),o=[],e=[]}function a(t,e,n,o,i,r=!1){if(t?.nodeType==Node.TEXT_NODE){let e=t.textContent,n=document?.createElement("div")
n.textContent=e,t.replaceWith(n),t=n}if(t){let l=Array.isArray(n.trans?.dur)?n.trans?.dur["in"==e?0:1]||n.trans?.dur[0]:n.trans?.dur||0,f=n?.trans?.class||"mf-trans"
if(t?.classList?.add(f),n.trans?.hooks?.[`${e}-start`]?.(t),"out"==e){if(i||(i=t),!i)return
let e={}
if((n.trans?.smartTransition??1)&&0==r){let t=getComputedStyle(i)
e.w=`calc(${i.clientWidth}px - ${t.paddingLeft} - ${t.paddingRight})`,e.left=`calc(${i.getBoundingClientRect().left}px + ${window.scrollX}px)`,e.top=`calc(${i.getBoundingClientRect().top}px + ${window.scrollY}px)`}s((()=>{if(n.trans?.smartTransition??1){if(r&&i){let t=getComputedStyle(i)
e.w=`calc(${i.clientWidth}px - ${t.paddingLeft} - ${t.paddingRight})`,e.left=`calc(${i.getBoundingClientRect().left}px + ${window.scrollX}px)`,e.top=`calc(${i.getBoundingClientRect().top}px + ${window.scrollY}px)`}t.style.position="fixed",t.style.width=e.w,t.style.left=e.left,t.style.top=e.top,t.style.margin="0"}l&&(t.style.transitionDuration=`${l}ms`),t.classList?.add("out")}))}else t?.classList?.add("in"),l&&(t.style.transitionDuration=`${l}ms`),o?.(),setTimeout((()=>{s((()=>{setTimeout((()=>s((()=>t?.classList?.remove(e)))),0)}))}),n.trans?.swap||0)
setTimeout((()=>{s((()=>{"out"==e&&t?.remove(),t?.classList?.remove(f),n.trans?.hooks?.[`${e}-end`]?.(t)}))}),l+("in"==e&&n.trans?.swap||0))}}function c(t){if(!t)return 0
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
for(let t of this.u)await t.$()
s((()=>{for(let[t,e]of this?.o||[])e?.(this.value,t)
e(this.value)}))}else e(this.value)}))}async $(){let t=await(this.t?.(Array.from(this.l)?.map((t=>t?.value))||[],this?.value))
await this.update(void 0===t?this.value:t)}}function p(t,e){let n=MfSt.get(t)
return e?n?n.p(t,e):new d(t,e):n||new d(t,e)}let $="mf"
function h(t,e,n){let o=t
for(let t of e)null==o&&(o="number"==typeof t?[]:{}),null==n||e[e.length-1]!==t?o=o instanceof Map?o?.get(t):o?.[t]:o instanceof Map?o.set(t,n):o[t]=n
return o}function w(t,e){let n=e.dataset[`${$}overrides`]||"{}",o=t.profiles?.[n]?.fetch||JSON.parse(n)
return o?{...t,...o}:t}function m(t){let e="",n=""
if("string"==typeof t?e=t:(e=t?.el?.dataset?.[t?.datakey]||"",n=e,e||void 0===t?.el?.dataset?.[`${$}else`]||(e="return true",n=`ELSE:${t?.el?.dataset?.[t?.datakey]||""}`)),!e)return{}
let[o,i]=e?.split("=>")?.map((t=>t.trim()))||["",""]
i||(i=o.slice(),o="")
let r=o?.split(",")?.map((t=>t.replace(/[()]/g,"").trim()))
return{storeList:r,func:globalThis[i]||MfFn?.get(i)||new Function(...r,i),storeName:n}}function g(t,e,n,o,i,r){let l=async e=>{e?.preventDefault(),e?.stopPropagation()
let l=w(n,t)
r||(r="string"==typeof i?structuredClone(i):(e?.target)?.href,i=l?.fetch?.request?.body),o||(o=(e?.target)?.method||"get"),l?.fetch?.externals?.find((t=>r?.startsWith(t.domain)))||!r.match(/^https?:\/\//)||r.includes(location.origin)
let f=await fetch(r,{...l?.fetch?.request||{},method:o,body:"string"==typeof i?i:JSON.stringify(i)}).catch((t=>{l?.fetch?.err?.(t)})),u=f?.status
if(u&&0==l?.fetch?.onCode?.(u,f))return
let a=await(f?.[l?.fetch?.type||"text"]())
l?.fetch?.cb?.(a)
for(let e of["append","prepend","swapinner","swapouter"]){let n=t.dataset[`${$}${e}`]
if(void 0===n)continue
let[o,i]=n?.split("->").map((t=>t.trim()))||[],r=(new DOMParser)?.parseFromString?.(a,"text/html")
r&&s({in:r.querySelector(o||"body"),out:i?document.querySelector(i):t,relation:e,ops:l,done:t=>{S(t)}})}t.dataset?.[`${$}resolve`]&&alert("RESOLVING")}
"$mount"==e?l():t.addEventListener(e,l)}function y(t,e,n,o,i,r,l){e?.length||(e=[""])
for(let f=0;f<e.length;f++)if(i==`${$}bind`){let i=()=>{s((()=>{console.log("STORE1 FUNC",e,r)
let i=r?.(...n.map((t=>h(p(t.name)?.value,t.path))),t)??h(p(n[0].name||"")?.value,n[0].path)
void 0!==i&&(t[e[f]]=i),t.dispatchEvent(new CustomEvent(o))}))}
for(let e of n)p(e.name)?.sub(i,t.id)}else if(i==`${$}sync`){if(n.length>1)throw`Only one store supported: ${l}`
let i=()=>{let o=e[f].trim(),i=t[o]??t.getAttribute(o)??t.dataset[o]??void 0
console.log("FUNC",r,i),r&&(i=r?.(i,t))
let s=p(n[0]?.name)
void 0!==i&&s?.update?.((t=>n[0]?.path?.length?h(t,n[0]?.path,i):i))}
"$mount"==o?i():t.addEventListener(o,i)}}function v(t,e,n){if(e==`${$}if`){let o=w(n,t),i=document.createElement("div")
i.classList.add("mfld-active-condition"),t.before(i)
let r=t,l=[]
for(;r&&r;){let{storeList:t,func:n,storeName:f}=m({el:r,datakey:l.length?`${$}elseif`:e})
if(!t&&!n)break
if("TEMPLATE"!=r.tagName){let t=document.createElement("template")
t.innerHTML=r.innerHTML
for(let e of r.attributes)t.setAttribute(e.name,e.value)
r.replaceWith(t),r=t,i.innerHTML=r.innerHTML}let u=l.length,a=p(f||"",{upstream:[...t||[],...l],updater:t=>{if(u)for(let e of t.slice(-u)||[])if(e)return!1
return n?.(...t.slice(0,-1))}})
l.push(a.name)
let c=r.cloneNode(!0)
a?.sub((t=>{if(!t)return
let e=document.createElement("div")
e.innerHTML=c.innerHTML,"TEMPLATE"==c?.tagName&&s({in:e,out:i,relation:"swapinner",ops:o,done:t=>S(t)})})),r=r?.nextElementSibling}}else alert("Not set up for loops yet")}let T={},b=/, {0,}/g,x=0,M=["bind","sync","if","get","head","post","put","delete","patch"].map((t=>`${$}${t}`))
function S(t){let e=(t||document.body).querySelectorAll(`[data-${M.join("],[data-")}]${0!=T.fetch?.auto?",a":""}`)||[]
for(let t of e){t.id||(t.id=""+x++)
for(let e in t.dataset){if([`${$}if`,`${$}each`].includes(e)){v(t,e,T)
continue}if(!M.includes(e))continue
let n=![`${$}bind`].includes(e),o=`(#${t.id} on ${e})`
t.dataset?.[e]?.split(";").forEach((i=>{let r=i?.match(/\([\w ,]{0,}\)\s{0,}=>\s{0,}[\w ,]{0,}/)?.[0]||""
r&&(i=i.replace(r,r.match(/\([\w ,]+\)/)?.[0]||""))
let s=i?.split(/(?:(?:\)|->) ?){1,}/g)||[]
console.log(s)
let l=n?N(s.splice(0,1)[0]):[],f=r||(s[0]?.includes("(")&&s[0]?.match(/^[^\(]{1,}/)?.[0]||""),u=N(s.splice(e==`${$}sync`?1:0,1)[0]),a=N(s[0])
if(n&&!l?.length)return void console.error(`No trigger: ${o}.`)
let c=m(f)?.func
if(f&&(c||console.warn(`"${f}" not registered: ${o}`),!n&&u.length>1))return void console.error(`Multiple sources: ${o}`)
let d=u.map((t=>{let[e,...n]=t.split(/[\.\[\]\?]{1,}/g)
return{name:e,path:n.map((t=>isNaN(parseInt(t))?t:parseInt(t))).filter((t=>t))}}))
l?.length||(l=[""])
for(let n of l)e.match(/bind|sync/)?y(t,a,d,n,e,c,o):g(t,n,T,e.replace($,""),a[0],u[0])}))}}}function N(t){if(t?.includes("(")){let e=t.match(/[^\(\)]{1,}/g)
t=e?.[e.length-1]||""}return t?.split(b)?.map((t=>t.trim()))||[]}
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
 * @property {"json"|"text"} [type] - Response type (default: "text")
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
 */let E={store:
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
(new_ops,profile_name)=>{return t=new_ops,void((e=profile_name)?T.profiles={...T.profiles,[e]:t}:T={...T,...t})

;/**!
 * @param {Partial<MfldOps>} newops 
 * @param {string} [profileName] 
 */
var t,e},onTick:
/**!
  * - Wait for the next Manifold data update cycle to complete before executing the callback function.
  * @param {()=> void} cb
  */
t=>{var e;(e=t)&&o.push(e)},register:
/**!
 * - Register Manifold subscriptions on the DOM. *Optional:* Pass an `HTMLElement` or selector string to scope the registration to a specific element.
 * @param {HTMLElement | string | null} [parent]
 */
t=>{"string"==typeof t&&(t=document.querySelector(t)),S(t)}}
export{E as Mfld}
//# sourceMappingURL=mfld.mod.js.map
