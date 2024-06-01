let t=globalThis.smartOutro,e=[],n=!1,o=[],i=globalThis?.requestAnimationFrame||(t=>setTimeout(t,0)),r=new Map
function s(t){e.push(t),n||(n=!0,i(l))}function l(){n=!1
for(let[t]of r)for(let[e,n]of t?.t||[])n?.(t.value,e)
r.clear()
for(let n of e)if("function"==typeof n)n()
else{if(["swapinner","append"].includes(n.relation)){if("swapinner"==n.relation){let t=document?.createElement("div")
for(let e of Array.from(n.out?.childNodes||[]))t.appendChild(e)
n.out?.replaceChildren(t),a(t,"out",n.ops)}t?.space?.(n.in,n.out),a(n.in,"in",n.ops,(()=>{n.in&&n.out?.appendChild(n.in),t?.adjust?.(n.in,n.ops)}))}else"prepend"==n.relation?(t?.space?.(n.in,n.out),a(n.in,"in",n.ops,(()=>{n.in&&n.out?.prepend(n.in),t?.adjust?.(n.in,n.ops)}))):a(n.in,"in",n.ops,(()=>{n.out?.after(n.in),t?.space?.(n.in,n.out),t?.adjust?.(n.in,n.ops),"swapouter"==n.relation&&a(n.out,"out",n.ops)}))
n.done?.(n.in)}o.forEach((t=>t())),o=[],e=[]}function a(e,n,o,i){if(console.log("Applying transition",e,n,o,i),e?.nodeType==Node.TEXT_NODE){let t=e.textContent,n=document?.createElement("div")
n.textContent=t,e.replaceWith(n),e=n}if(e){let r=Array.isArray(o.trans?.dur)?o.trans?.dur["in"==n?0:1]||o.trans?.dur[0]:o.trans?.dur||0,l=o?.trans?.class||"mf-trans"
e?.classList?.add(l),o.trans?.hooks?.[`${n}-start`]?.(e),"out"==n?s((()=>{t?.size?.(e),r&&(e.style.transitionDuration=`${r}ms`),e.classList?.add(n)})):setTimeout((()=>{s((()=>{r&&(e.style.transitionDuration=`${r}ms`),e?.classList?.add(n),i?.(),s((()=>{e?.classList?.remove(n)}))}))}),o.trans?.swap||0),setTimeout((()=>{s((()=>{"out"==n&&e?.remove(),e?.classList?.remove(l),e?.classList?.remove(n),o.trans?.hooks?.[`${n}-end`]?.(e)}))}),r+("in"==n&&o.trans?.swap||0))}}function f(t){if(!t)return 0
if("number"==typeof t)return t
if(!0===t)return 1
if(t instanceof Map)return f(Array.from(t.entries()))
if(t instanceof Set)return f(Array.from(t))
let e=0
for(let n of(new TextEncoder).encode("string"==typeof t?t:t?.toString()||""))e=(e<<5)-e+n
return e}globalThis.MfSt||(globalThis.MfSt=new Map),globalThis.MfFn||(globalThis.MfFn=new Map)
class u{o=void 0
t=new Map
i=void 0
l
u=new Set
constructor(t,e){return this.p(t,e)}p(t,e){return this.name=t,MfSt.set(t,this),this.l=new Set(e?.upstream?.map((t=>c(t)))||[]),this.l.forEach((t=>t?.u?.add(this))),this.value=e?.value,this.o=e?.updater,this}sub(t,e){this.t.set(e||String(Date.now()+Math.random()),t),t?.(this.value)}async update(t){return new Promise((async e=>{let n="function"==typeof t?(await t)?.(this.value):t,o=f(n)
if(o!==this.i){this.value=n,this.i=o,r.set(this,await t)
for(let t of this.u)r.set(t,await t.h())
s((()=>{e(this.value)}))}else e(this.value)}))}async h(){await this.update(await(this.o?.(Array.from(this.l)?.map((t=>t?.value))||[],this?.value))||this.value)}}function c(t,e){let n=MfSt.get(t)
return e?n?n.p(t,e):new u(t,e):n||new u(t,e)}globalThis.DOMParser&&new DOMParser
let p={},h="mf",d=/, {0,}/g,w=0

;/**!
 * @param {Partial<MfldOps>} newops 
 * @param {string} [profileName] 
 */
function g(t,e){e?p.profiles={...p.profiles,[e]:t}:p={...p,...t}}function y(t){let e=(t||document.body).querySelectorAll(`[data-${h}${["bind","sync","get","head","post","put","delete","patch"].join(`],[data-${h}`)}]${0!=p.fetch?.auto?",a":""}`)||[]
for(let t of e){t.id||(t.id=""+w++)
for(let e in t.dataset){let n=e!=`${h}bind`,o=`(#${t.id} on ${e})`
t.dataset?.[e]?.split(";").forEach((i=>{let r,l=i?.split(/(?:(?:\)|->) ?){1,}/g)||[],a=n?$(l.splice(0,1)[0]):[],f=l[0]?.includes("(")&&l[0]?.match(/^[^\(]{1,}/)?.[0]||"",u=$(l.splice(e==`${h}sync`?1:0,1)[0]),p=$(l[0])
if(n&&!a?.length)throw`No trigger: ${o}.`
if(f&&(r=globalThis[f]||MfFn?.get(f),r||console.warn(`"${f}" not registered: ${o}`),!n&&u.length>1||n&&p.length>1))throw`Multiple sources: ${o}`
let d=u.map((t=>{let[e,...n]=t.split(/[\.\[\]\?]{1,}/g)
return{name:e,path:n.map((t=>isNaN(parseInt(t))?t:parseInt(t))).filter((t=>t))}}))
a?.length||(a=[""])
for(let n of a){if(!e.match(/bind|sync/)){if(p.length>1||u.length>1)throw`Multiple sources: ${o}`
return void b(t,n,e.replace(h,""),p[0],u[0])}p?.length||(p=[""])
for(let i=0;i<p.length;i++)if(e==`${h}bind`){let e=()=>{s((()=>{let e=r?.(...d.map((t=>m(c(t.name)?.value,t.path))),t)??m(c(d[0].name||"")?.value,d[0].path)
void 0!==e&&(t[p[i]]=e),t.dispatchEvent(new CustomEvent(n))}))}
for(let n of d)c(n.name)?.sub(e,t.id)}else if(e==`${h}sync`){if(d.length>1)throw`Only one store supported: ${o}`
let e=()=>{let e=p[i].trim(),n=t[e]??t.getAttribute(e)??t.dataset[e]??void 0
r&&(n=r?.(n,t))
let o=c(d[0]?.name)
void 0!==n&&o?.update?.((t=>d[0]?.path?.length?m(t,d[0]?.path,n):n))}
"$mount"==n?e():t.addEventListener(n,e)}}}))}}}function m(t,e,n){let o=t
for(let t of e)null==o&&(o="number"==typeof t?[]:{}),null==n||e[e.length-1]!==t?o=o instanceof Map?o?.get(t):o?.[t]:o instanceof Map?o.set(t,n):o[t]=n
return o}function $(t){if(t?.includes("(")){let e=t.match(/[^\(\)]{1,}/g)
t=e?.[e.length-1]||""}return t?.split(d)?.map((t=>t.trim()))||[]}function b(t,e,n,o,i){let r=async e=>{e?.preventDefault(),e?.stopPropagation()
let r=t.dataset[`${h}overrides`]||"{}",l=p.profiles?.[r]?.fetch||JSON.parse(r),a=l?{...p,...l}:p
i||(i="string"==typeof o?structuredClone(o):(e?.target)?.href,o=a?.fetch?.request?.body),n||(n=(e?.target)?.method||"get"),a?.fetch?.externals?.find((t=>i?.startsWith(t.domain)))||!i.match(/^https?:\/\//)||i.includes(location.origin)
let f=await fetch(i,{...a?.fetch?.request||{},method:n,body:"string"==typeof o?o:JSON.stringify(o)}).catch((t=>{a?.fetch?.err?.(t)})),u=f?.status
if(u&&0==a?.fetch?.onCode?.(u,f))return
let c=await(f?.[a?.fetch?.type||"text"]())
a?.fetch?.cb?.(c)
for(let e of["append","prepend","swapinner","swapouter"]){let[n,o]=t.dataset[`${h}${e}`]?.split("->").map((t=>t.trim()))||[],i=(new DOMParser)?.parseFromString?.(c,"text/html")
i&&s({in:i.querySelector(n||"body"),out:o?document.querySelector(o):t,relation:e,ops:a,done:()=>!0})}t.dataset?.[`${h}resolve`]&&alert("RESOLVING")}
"$mount"==e?r():t.addEventListener(e,r)}
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
 */let M={store:
/**!
* - Create or overwrite a _typed_ global Manifold store by passing `store_ops` (`MfldOps`) -> *returns `Store\<T\>`* 
* - Retrieve an untyped reference to the store specified by name by omitting `store_ops` -> *returns `Store\<any\>`*
* @template T
* @param {string} store_name
* @param {StoreOptions<T> | T} store_ops
* @return {Store<T>}
*/
(store_name,store_ops)=>(store_ops?.hasOwnProperty("value")||store_ops?.hasOwnProperty("updater")||(store_ops={value:store_ops}),c(store_name,store_ops)),ustore:
/**!
* - Create or overwrite an untyped global Manifold store by passing `store_ops` (`MfldOps`) -> *returns `Store\<any\>`* 
* - Retrieve an untyped reference to the store specified by name by omitting `store_ops` -> *returns `Store\<any\>`*
* @param {string} store_name
* @param {StoreOptions<any> | any} store_ops
* @return {Store<any>}
*/
(store_name,store_ops)=>c(store_name,store_ops),get:
/**!
 * - Retrieve a Manifold store by name. *returns `Store\<any\>`*
 * @param {string} store_name
 * @return {Store<any>}
 */
store_name=>c(store_name),func:
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
(new_ops,profile_name)=>g(new_ops,profile_name),onTick:
/**!
  * - Wait for the next Manifold data update cycle to complete before executing the callback function.
  * @param {()=> void} cb
  */
t=>{var e;(e=t)&&o.push(e)},register:
/**!
 * - Register Manifold subscriptions on the DOM. *Optional:* Pass an `HTMLElement` or selector string to scope the registration to a specific element.
 * @param {HTMLElement | string | null} [parent]
 */
t=>{"string"==typeof t&&(t=document.querySelector(t)),y(t)}}
globalThis.Mfld=M
let v=globalThis.document?.currentScript?.dataset||{}
if(v?.config)try{g(JSON.parse(v?.config))}catch(t){console.warn("Invalid Mfld params",t)}v?.init&&y(document.querySelector(v.init))
