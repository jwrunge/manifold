let t=globalThis.smartOutro,e=[],n=!1,o=[],i=globalThis?.requestAnimationFrame||(t=>setTimeout(t,0))
function r(t){e.push(t),n||(n=!0,i(l))}function l(){n=!1
let i=new Set
for(let[t]of a){let e=c(t)
for(let[t,n]of e?.t||[])n?.(e.value,t)
for(let[e,n]of MfSt)n.o?.has(t)&&i.add(n)}for(let t of i)t.update(t.i?.(Array.from(t.o)?.map((t=>c(t)?.value))||[],t?.value)||t.value)
a.clear()
for(let n of e)if("function"==typeof n)n()
else{if([">","+"].includes(n.relation)){if(">"==n.relation){let t=document?.createElement("div")
for(let e of Array.from(n.out?.childNodes||[]))t.appendChild(e)
n.out?.replaceChildren(t),f(t,"out",n.ops)}t?.space?.(n.in,n.out),f(n.in,"in",n.ops,(()=>{n.in&&n.out?.appendChild(n.in),t?.adjust?.(n.in,n.ops)}))}else f(n.in,"in",n.ops,(()=>{n.out?.after(n.in),t?.space?.(n.in,n.out),t?.adjust?.(n.in,n.ops),"/"===n.relation&&f(n.out,"out",n.ops)}))
n.done?.(n.in)}o.forEach((t=>t())),o=[],e=[]}function f(e,n,o,i){if(e?.nodeType==Node.TEXT_NODE){let t=e.textContent,n=document?.createElement("div")
n.textContent=t,e.replaceWith(n),e=n}if(e){let l=Array.isArray(o.trans?.dur)?o.trans?.dur["in"==n?0:1]||o.trans?.dur[0]:o.trans?.dur||0,f=o?.trans?.class||"mf-trans"
e?.classList?.add(f),o.trans?.hooks?.[`${n}-start`]?.(e),"out"==n?r((()=>{t?.size?.(e),l&&(e.style.transitionDuration=`${l}ms`),e.classList?.add(n)})):setTimeout((()=>{r((()=>{l&&(e.style.transitionDuration=`${l}ms`),e?.classList?.add(n),i?.(),r((()=>{e?.classList?.remove(n)}))}))}),o.trans?.swap||0),setTimeout((()=>{r((()=>{"out"==n&&e?.remove(),e?.classList?.remove(f),e?.classList?.remove(n),o.trans?.hooks?.[`${n}-end`]?.(e)}))}),l+("in"==n&&o.trans?.swap||0))}}function s(t){if(!t)return 0
if("number"==typeof t)return t
if(!0===t)return 1
if(t instanceof Map)return s(Array.from(t.entries()))
if(t instanceof Set)return s(Array.from(t))
let e=0
for(let n of(new TextEncoder).encode("string"==typeof t?t:t?.toString()||""))e=(e<<5)-e+n
return e}globalThis.MfSt||(globalThis.MfSt=new Map),globalThis.MfFn||(globalThis.MfFn=new Map)
let a=new Map
class u{i=void 0
t=new Map
l=void 0
o
constructor(t,e){return this.u(t,e)}u(t,e){return this.name=t,MfSt.set(t,this),this.o=new Set(e?.upstream||[]),this.value=e?.value,this.i=e?.updater,this}sub(t,e){this.t.set(e||String(Date.now()+Math.random()),t),t?.(this.value)}async update(t){return new Promise((async e=>{let n=new Set
for(let t of a.keys()){if(this.o.has(t))return
c(t)?.o.has(this.name||"")&&n.add(t)}let o="function"==typeof t?(await t)?.(this.value):t,i=s(o)
i!==this.l&&(this.value=o,this.l=i,n.forEach((t=>a.delete(t))),a.set(this.name||"",await t),r((()=>{e(this.value)})))}))}}function c(t,e){let n=MfSt.get(t)
return e?n?n.u(t,e):new u(t,e):n||new u(t,e)}globalThis.DOMParser&&new DOMParser
let h={},d="mf",p=[`${d}bind`,`${d}sync`,...["get","head","post","put","delete","patch"].map((t=>`${d}${t}`))],g=/, {0,}/g,m=0

;/**!
 * @param {Partial<MfldOps>} newops 
 * @param {string} [profileName] 
 */
function $(t,e){e?h.profiles={...h.profiles,[e]:t}:h={...h,...t}}function y(t){let e=(t||document.body).querySelectorAll(`[data-${p.join("],[data-")}]${0!=h.fetch?.auto?",a":""}`)||[]
for(let t of e){t.id||(t.id=""+m++)
for(let e in t.dataset){let n=e!=`${d}bind`,o=`(#${t.id} on ${e})`
t.dataset?.[e]?.split(";").forEach((i=>{let l,f=i?.split(/(?:(?:\)|->) ?){1,}/g)||[],s=n?b(f.splice(0,1)[0]):[],a=f[0]?.includes("(")&&f[0]?.match(/^[^\(]{1,}/)?.[0]||"",u=b(f.splice(e==`${d}sync`?1:0,1)[0]),h=b(f[0])
if(n&&!s?.length)throw`No trigger: ${o}.`
if(a&&(l=globalThis[a]||MfFn?.get(a),l||console.warn(`"${a}" not registered: ${o}`),!n&&u.length>1||n&&h.length>1))throw`Multiple sources: ${o}`
let p=u.map((t=>{let[e,...n]=t.split(/[\.\[\]\?]{1,}/g)
return{name:e,path:n.map((t=>isNaN(parseInt(t))?t:parseInt(t))).filter((t=>t))}}))
s?.length||(s=[""])
for(let n of s){["bind","sync"].includes(e)&&M(t,n),h?.length||(h=[""])
for(let i=0;i<h.length;i++)if(e==`${d}bind`){let e=()=>{r((()=>{let e=l?.(...p.map((t=>w(c(t.name)?.value,t.path))),t)??w(c(p[0].name||"")?.value,p[0].path)
void 0!==e&&(t[h[i]]=e),t.dispatchEvent(new CustomEvent(n))}))}
for(let n of p)c(n.name)?.sub(e,t.id)}else if(e==`${d}sync`){if(p.length>1)throw`Only one store supported: ${o}`
let e=()=>{let e=t[h[i].trim()]
l&&(e=l?.(e,t))
let n=c(p[0]?.name)
void 0!==e&&n?.update?.((t=>p[0]?.path?.length?w(t,p[0]?.path,e):e))}
t.addEventListener(n,e)}}}))}}}function w(t,e,n){let o=t
for(let t of e)null==o&&(o="number"==typeof t?[]:{}),null==n||e[e.length-1]!==t?o=o instanceof Map?o?.get(t):o?.[t]:o instanceof Map?o.set(t,n):o[t]=n
return o}function b(t){if(t?.includes("(")){let e=t.match(/[^\(\)]{1,}/g)
t=e?.[e.length-1]||""}return t?.split(g)?.map((t=>t.trim()))||[]}function M(t,e){let n=async e=>{e?.preventDefault(),e?.stopPropagation()
let n={...h,...h.profiles?.[t.dataset.overrides||""]||JSON.parse(t.dataset.overrides||"{}")||{}},o=e?.target
if(!n?.fetch?.externals?.some((t=>o?.href?.startsWith(t.domain)))){let e=n.fetch,i=await fetch(o?.href,{...e?.request||{},method:o?.method,body:e?.request?.body?JSON.stringify(e?.request?.body||{}):void 0}).catch((t=>{e?.err?.(t)})),r=i?.status
if(r&&0==e?.onCode?.(r))return
let l=await(i?.[n.fetch?.type||"text"]())
n.fetch?.cb?.(l)
let f=t.getAttribute("mf-resolve");["$append","$prepend","$replace"].includes(f||"")&&globalThis.DOMParser&&(new DOMParser)?.parseFromString?.(l,"text/html")}}
"mount"==e?n():t.addEventListener(e,n)}
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
 * @property {(code: number)=> boolean | void} [onCode] - Callback function - run on fetch response code; return `false` to prevent further processing
 * @property {boolean} [auto] - Automatically fetch content on page load
 * @property {ExternalOptions[]} [externals] - External domain fetch settings
 */
/**!
 * @typedef {object} TransitionOptions
 * @property {string} [class] - CSS class applied to transitions (default: `mf-trans`)
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
 */let T={store:
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
 * - Functions must be registered in order to be accessible to HTML elements via `mf-bind`, `mf-sync`, and `mf-resolve`. 
 * - It may still be beneficial to keep a reference to the original function if you need to preserve type information.
 * @param {{ [key: string]: MfldFunc }} funcs
 */
funcs=>{for(let t in funcs)MfFn.set(t,funcs[t])},config:
/**!
 * - Set Manifold configuration options, including `trans` (DOM transition settings), `fetch` (fetch options), and `profiles` (configuration option overrides that can be set on elements ad-hoc via `mf-overrides`).
 * - Providing the optional `profileName` parameter allows you to save the configuration as a named profile. Otherwise, the profile is saved as the default configuration.
 * @param {MfldOps} new_ops
 * @param {string} [profile_name]
 */
(new_ops,profile_name)=>$(new_ops,profile_name),onTick:
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
globalThis.Mfld=T
let v=globalThis.document?.currentScript?.dataset||{}
if(v?.config)try{$(JSON.parse(v?.config))}catch(t){console.warn("Invalid Mfld params",t)}v?.init&&y(document.querySelector(v.init))
