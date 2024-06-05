let t,e=[],n=!1,o=[],i="",r=globalThis?.requestAnimationFrame||(t=>setTimeout(t,0))
function l(t){e.push(t),n||(n=!0,r(a))}function s(e,n,o,r=!1,l){if(!l.trans?.smartTransition??1)return
t=document.createElement("div")
let{paddingTop:s,paddingBottom:f}=n instanceof Element?window.getComputedStyle(n):{paddingTop:0,paddingBottom:0}
i=t.style.height=`calc(${Math.abs(o-(e?.clientHeight||0))}px - ${s} - ${f})`,n?.after(t)}function f(e,n){if(!n.trans?.smartTransition??1)return
let o=(n?.trans?.dur?.[0]||n?.trans?.dur||600)/2
l((()=>{t?.remove(),e?.animate?.([{height:i},{height:`${e.clientHeight||0}px`}],o)}))}function a(){n=!1
for(let t of e)if("function"==typeof t)t()
else{let e=t.out?t.out.clientHeight:0
if("prepend"==t.relation)s?.(t.in,t.out,e,!1,t.ops),u(t.in,"in",t.ops,(()=>{t.in&&t.out?.prepend(t.in),f?.(t.in,t.ops)}))
else{if(["swapinner","swapouter"].includes(t.relation)){let e=t.out?.cloneNode(!0)
t.out?.after(e)
let n="swapinner"==t.relation
"swapinner"==t.relation&&(e.style.border="none",t.out.replaceChildren()),u(e,"out",t.ops,void 0,t.out,n)}s?.(t.in,t.out,e,!1,t.ops),u(t.in,"in",t.ops,(()=>{t.in&&("swapouter"==t.relation?t.out?.replaceWith(t.in):t.out?.appendChild(t.in)),f?.(t.in,t.ops)}))}t.done?.(t.in)}o.forEach((t=>t())),o=[],e=[]}function u(t,e,n,o,i,r=!1){if(t?.nodeType==Node.TEXT_NODE){let e=t.textContent,n=document?.createElement("div")
n.textContent=e,t.replaceWith(n),t=n}if(t){let s=Array.isArray(n.trans?.dur)?n.trans?.dur["in"==e?0:1]||n.trans?.dur[0]:n.trans?.dur||0,f=n?.trans?.class||"mf-trans"
if(t?.classList?.add(f),n.trans?.hooks?.[`${e}-start`]?.(t),"out"==e){if(i||(i=t),!i)return
let e={}
if((n.trans?.smartTransition??1)&&0==r){let t=getComputedStyle(i)
e.w=`calc(${i.clientWidth}px - ${t.paddingLeft} - ${t.paddingRight})`,e.left=`calc(${i.getBoundingClientRect().left}px + ${window.scrollX}px)`,e.top=`calc(${i.getBoundingClientRect().top}px + ${window.scrollY}px)`}l((()=>{if(n.trans?.smartTransition??1){if(r&&i){let t=getComputedStyle(i)
e.w=`calc(${i.clientWidth}px - ${t.paddingLeft} - ${t.paddingRight})`,e.left=`calc(${i.getBoundingClientRect().left}px + ${window.scrollX}px)`,e.top=`calc(${i.getBoundingClientRect().top}px + ${window.scrollY}px)`}t.style.position="fixed",t.style.width=e.w,t.style.left=e.left,t.style.top=e.top,t.style.margin="0"}s&&(t.style.transitionDuration=`${s}ms`),t.classList?.add("out")}))}else t?.classList?.add("in"),s&&(t.style.transitionDuration=`${s}ms`),o?.(),setTimeout((()=>{l((()=>{setTimeout((()=>l((()=>t?.classList?.remove(e)))),0)}))}),n.trans?.swap||0)
setTimeout((()=>{l((()=>{"out"==e&&t?.remove(),t?.classList?.remove(f),n.trans?.hooks?.[`${e}-end`]?.(t)}))}),s+("in"==e&&n.trans?.swap||0))}}function c(t){if(!t)return 0
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
l((()=>{for(let[t,e]of this?.o||[])e?.(this.value,t)
e(this.value)}))}else e(this.value)}))}async h(){let t=await(this.t?.(Array.from(this.l)?.map((t=>t?.value))||[],this?.value))
await this.update(void 0===t?this.value:t)}}function p(t,e){let n=MfSt.get(t)
return e?n?n.p(t,e):new d(t,e):n||new d(t,e)}let h="mf"
function $(t,e,n){let o=t
for(let t of e)null==o&&(o="number"==typeof t?[]:{}),null==n||e[e.length-1]!==t?o=o instanceof Map?o?.get(t):o?.[t]:o instanceof Map?o.set(t,n):o[t]=n
return o}function w(t,e){let n=e.dataset[`${h}overrides`]||"{}",o=t.profiles?.[n]?.fetch||JSON.parse(n)
return o?{...t,...o}:t}function m(t){let e="",n=""
if("string"==typeof t?e=t:(e=t?.el?.dataset?.[t?.datakey]||"",n=e,e||void 0===t?.el?.dataset?.[`${h}else`]||(e="return true",n=`ELSE:${t?.el?.dataset?.[t?.datakey]||""}`)),!e)return{}
let[o,i]=e?.split("=>")?.map((t=>t.trim()))||["",""]
i||(i=o.slice(),o="")
let r=o?.split(",")?.map((t=>t.replace(/[()]/g,"").trim()))
return{storeList:r,func:globalThis[i]||MfFn?.get(i)||new Function(...r,i),storeName:n}}function g(t,e,n,o,i,r){let s=async e=>{e?.preventDefault(),e?.stopPropagation()
let s=w(n,t)
r||(r="string"==typeof i?structuredClone(i):(e?.target)?.href,i=s?.fetch?.request?.body),o||(o=(e?.target)?.method||"get"),s?.fetch?.externals?.find((t=>r?.startsWith(t.domain)))||!r.match(/^https?:\/\//)||r.includes(location.origin)
let f=await fetch(r,{...s?.fetch?.request||{},method:o,body:"string"==typeof i?i:JSON.stringify(i)}).catch((t=>{s?.fetch?.err?.(t)})),a=f?.status
if(a&&0==s?.fetch?.onCode?.(a,f))return
let u=await(f?.[s?.fetch?.type||"text"]())
s?.fetch?.cb?.(u)
for(let e of["append","prepend","swapinner","swapouter"]){let n=t.dataset[`${h}${e}`]
if(void 0===n)continue
let[o,i]=n?.split("->").map((t=>t.trim()))||[],r=(new DOMParser)?.parseFromString?.(u,"text/html")
r&&l({in:r.querySelector(o||"body"),out:i?document.querySelector(i):t,relation:e,ops:s,done:t=>{N(t)}})}t.dataset?.[`${h}resolve`]&&alert("RESOLVING")}
"$mount"==e?s():t.addEventListener(e,s)}function y(t,e,n,o,i,r,s){e?.length||(e=[""])
for(let f=0;f<e.length;f++)if(i==`${h}bind`){let i=()=>{l((()=>{console.log("STORE1 FUNC",e,r)
let i=r?.(...n.map((t=>$(p(t.name)?.value,t.path))),t)??$(p(n[0].name||"")?.value,n[0].path)
void 0!==i&&(t[e[f]]=i),t.dispatchEvent(new CustomEvent(o))}))}
for(let e of n)p(e.name)?.sub(i,t.id)}else if(i==`${h}sync`){if(n.length>1)throw`Only one store supported: ${s}`
let i=()=>{let o=e[f].trim(),i=t[o]??t.getAttribute(o)??t.dataset[o]??void 0
console.log("FUNC",r,i),r&&(i=r?.(i,t))
let l=p(n[0]?.name)
void 0!==i&&l?.update?.((t=>n[0]?.path?.length?$(t,n[0]?.path,i):i))}
"$mount"==o?i():t.addEventListener(o,i)}}function v(t,e,n){if(e==`${h}if`){let o=w(n,t),i=document.createElement("div")
i.classList.add("mfld-active-condition"),t.before(i)
let r=t,s=[]
for(;r&&r;){let{storeList:t,func:n,storeName:f}=m({el:r,datakey:s.length?`${h}elseif`:e})
if(!t&&!n)break
if("TEMPLATE"!=r.tagName){let t=document.createElement("template")
t.innerHTML=r.innerHTML
for(let e of r.attributes)t.setAttribute(e.name,e.value)
r.replaceWith(t),r=t,i.innerHTML=r.innerHTML}let a=s.length,u=p(f||"",{upstream:[...t||[],...s],updater:t=>{if(a)for(let e of t.slice(-a)||[])if(e)return!1
return n?.(...t.slice(0,-1))}})
s.push(u.name)
let c=r.cloneNode(!0)
u?.sub((t=>{if(!t)return
let e=document.createElement("div")
e.innerHTML=c.innerHTML,"TEMPLATE"==c?.tagName&&l({in:e,out:i,relation:"swapinner",ops:o,done:t=>N(t)})})),r=r?.nextElementSibling}}else alert("Not set up for loops yet")}let T={},b=/, {0,}/g,M=0,x=["bind","sync","if","get","head","post","put","delete","patch"].map((t=>`${h}${t}`))

;/**!
 * @param {Partial<MfldOps>} newops 
 * @param {string} [profileName] 
 */
function S(t,e){e?T.profiles={...T.profiles,[e]:t}:T={...T,...t}}function N(t){let e=(t||document.body).querySelectorAll(`[data-${x.join("],[data-")}]${0!=T.fetch?.auto?",a":""}`)||[]
for(let t of e){t.id||(t.id=""+M++)
for(let e in t.dataset){if([`${h}if`,`${h}each`].includes(e)){v(t,e,T)
continue}if(!x.includes(e))continue
let n=![`${h}bind`].includes(e),o=`(#${t.id} on ${e})`
t.dataset?.[e]?.split(";").forEach((i=>{let r=i?.match(/\([\w ,]{0,}\)\s{0,}=>\s{0,}[\w ,]{0,}/)?.[0]||""
r&&(i=i.replace(r,r.match(/\([\w ,]+\)/)?.[0]||""))
let l=i?.split(/(?:(?:\)|->) ?){1,}/g)||[]
console.log(l)
let s=n?E(l.splice(0,1)[0]):[],f=r||(l[0]?.includes("(")&&l[0]?.match(/^[^\(]{1,}/)?.[0]||""),a=E(l.splice(e==`${h}sync`?1:0,1)[0]),u=E(l[0])
if(n&&!s?.length)return void console.error(`No trigger: ${o}.`)
let c=m(f)?.func
if(f&&(c||console.warn(`"${f}" not registered: ${o}`),!n&&a.length>1))return void console.error(`Multiple sources: ${o}`)
let d=a.map((t=>{let[e,...n]=t.split(/[\.\[\]\?]{1,}/g)
return{name:e,path:n.map((t=>isNaN(parseInt(t))?t:parseInt(t))).filter((t=>t))}}))
s?.length||(s=[""])
for(let n of s)e.match(/bind|sync/)?y(t,u,d,n,e,c,o):g(t,n,T,e.replace(h,""),u[0],a[0])}))}}}function E(t){if(t?.includes("(")){let e=t.match(/[^\(\)]{1,}/g)
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
 */let _={store:
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
(new_ops,profile_name)=>S(new_ops,profile_name),onTick:
/**!
  * - Wait for the next Manifold data update cycle to complete before executing the callback function.
  * @param {()=> void} cb
  */
t=>{var e;(e=t)&&o.push(e)},register:
/**!
 * - Register Manifold subscriptions on the DOM. *Optional:* Pass an `HTMLElement` or selector string to scope the registration to a specific element.
 * @param {HTMLElement | string | null} [parent]
 */
t=>{"string"==typeof t&&(t=document.querySelector(t)),N(t)}}
globalThis.Mfld=_
let O=globalThis.document?.currentScript?.dataset||{}
if(O?.config)try{S(JSON.parse(O?.config))}catch(t){console.warn("Invalid Mfld params",t)}O?.init&&N(document.querySelector(O.init))
