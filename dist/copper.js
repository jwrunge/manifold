function t(e){if("number"==typeof e)return e
if(!0===e)return 1
if("object"==typeof e)return e instanceof Map?t(e.entries()):e instanceof Set?t(Array.from(e)):Date.now()
let o=0
for(const t of(new TextEncoder).encode("string"==typeof e?e:e.toString()))o=(o<<5)-o+t
return o}let e=[]
let o,n=new Map,i=new Map,r=new Map
class s{#t=void 0
t=new Map
o=void 0
i=[]
l=[]
constructor(t,e){this.name=t,n.set(t,this),this.l=e?.upstream||[]
for(let t of this.l)f(t)?.i?.push(this.name||"")
return this.value=e?.value,this.#t=e?.updater,this}u(t,e){this.t.set(t,e),e?.()}sub(t){let e="x".repeat(5).replace(/./g,(t=>"ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"[Math.floor(36*Math.random())]))
this.t.set(e,t),t?.(this.value)}async update(n){return new Promise((i=>{r.set(this.name||"",n),clearTimeout(o),o=setTimeout((async()=>{for(let[t,e]of r){const e=f(t)
e.i.forEach((t=>r.delete(t))),e.l.forEach((e=>!r.has(e)||r.delete(t)))}let o=[]
for(let[e,n]of r){let i=f(e),r="function"==typeof n?n?.(i.value):n,s=Array.from(i.value||[])?.length!==Array.from(r).length,l=""
if(s||(l=t(i.value),s=l!==i.o),s){i.value=r,i.o=l
for(let t of i.i)o.push(t)
for(let[t,e]of i.t)e?.(i.value,t)}}r.clear()
for(let t of o)f(t)&&await f(t).h()
e.forEach((t=>t())),e=[],i(this.value)}),0)}))}async h(){await this.update(await(this.#t?.(this.l?.map((t=>f(t)?.value))||[],this?.value)||this.value))}}function f(t,e){return e?new s(t,e):n.get(t)||new s(t,e)}let l=globalThis.smartOutro,a=[],u=!1
function c(t){a.push(t),u||(u=!0,globalThis.requestAnimationFrame?.(h))}function h(){u=!1
for(let t of a)if("function"==typeof t)t()
else{if([">","+"].includes(t.relation)){if(">"==t.relation){let e=globalThis.document?.createElement("div")
for(let o of Array.from(t.out?.childNodes||[]))e.appendChild(o)
t.out?.replaceChildren(e),d(e,"out",t.ops)}l?.space?.(t.in,t.out),d(t.in,"in",t.ops,(()=>{t.in&&t.out?.appendChild(t.in),l?.adjust?.(t.in,t.ops)}))}else d(t.in,"in",t.ops,(()=>{t.out?.after(t.in),l?.space?.(t.in,t.out),l?.adjust?.(t.in,t.ops),"/"===t.relation&&d(t.out,"out",t.ops)}))
t.done?.(t.in)}a=[]}function d(t,e,o,n){if(t?.nodeType==Node.TEXT_NODE){let e=t.textContent,o=globalThis.document?.createElement("div")
o.textContent=e,t.replaceWith(o),t=o}if(t){let i=Array.isArray(o.trans?.dur)?o.trans?.dur["in"==e?0:1]||o.trans?.dur[0]:o.trans?.dur||0,r=o?.trans?.class||"cu-trans"
t?.classList?.add(r),o.trans?.hooks?.[`${e}-start`]?.(t),"out"==e?c((()=>{l?.size?.(t),i&&(t.style.transitionDuration=`${i}ms`),t.classList?.add(e)})):setTimeout((()=>{c((()=>{i&&(t.style.transitionDuration=`${i}ms`),t?.classList?.add(e),n?.(),c((()=>{t?.classList?.remove(e)}))}))}),o.trans?.swap||0),setTimeout((()=>{c((()=>{"out"==e&&t?.remove(),t?.classList?.remove(r),t?.classList?.remove(e),o.trans?.hooks?.[`${e}-end`]?.(t)}))}),i+("in"==e&&o.trans?.swap||0))}}let p=globalThis.DOMParser?new DOMParser:void 0
let y=/, {0,}/g,g=0
!function(){let t=globalThis.document?.currentScript?.dataset
if(t?.config)try{m(JSON.parse(t?.config))}catch(t){console.warn("Invalid Cu params",t)}t?.init&&function(t){let e=t?.querySelectorAll(`[data-${b.join("],[data-")}]${0!=w.fetch?.auto?",a":""}`)||[]
for(let t of e){t.id||(t.id="cu-"+g++)
for(let e in t.dataset){if(!b.includes(e))continue
let o="bind"!=e,n=`(#${t.id} on ${e})`
t?.dataset?.[e]?.split(";").forEach((r=>{let s,l=r?.split(/(?:(?:\)|->) ?){1,}/g)||[],a=o?M(l.splice(0,1)[0]):[],u=l[0]?.includes("(")&&l[0]?.match(/^[^\(]{1,}/)?.[0]||"",h=M(l.splice("sync"==e?1:0,1)[0]),d=M(l[0])
if(o&&!a?.length)throw`No trigger: ${n}.`
if(u){if(s=globalThis[u]||i.get(u),!s)throw`"${u}" not registered: ${n}`
if(!o&&h.length>1||o&&d.length>1)throw`Multiple sources: ${n}`}let p=h.map((t=>{let[e,...o]=t.split(/[\.\[\]\?]{1,}/g)
return{name:e,path:o.map((t=>isNaN(parseInt(t))?t:parseInt(t))).filter((t=>t))}}))
a?.length||(a=[""])
for(let o of a){"fetch"==e&&$(t,o,h,d,w),d?.length||(d=[""])
for(let i=0;i<d.length;i++)if("bind"==e){let e=()=>{c((()=>{t[d[i]]=s?.(...p.map((t=>T(f(t.name)?.value,t.path))),t)??T(f(p[0].name||"")?.value,p[0].path),t.dispatchEvent(new CustomEvent(o))}))}
for(let o of p)f(o.name)?.u(t.id,e)}else if("sync"==e){if(p.length>1)throw`Only one store supported: ${n}`
let e=()=>{let e=t[d[i].trim()]
s&&(e=s?.(e,t))
const o=f(p[0]?.name)
void 0!==e&&o?.update?.((t=>p[0]?.path?.length?T(t,p[0]?.path,e):e))}
t.addEventListener(o,e)}}}))}}}()}()
let w={},b=["bind","sync","fetch"]

;/**!
 * @param {Partial<CuOps>} newops 
 * @param {string} [profileName] 
 */
function m(t,e){e?w.profiles={...w.profiles,[e]:t}:w={...w,...t}}function T(t,e,o){let n=t
for(let t of e)null==n&&(n="number"==typeof t?[]:{}),null==o||e[e.length-1]!==t?n=n instanceof Map?n?.get(t):n?.[t]:n instanceof Map?n.set(t,o):n[t]=o
return n}function M(t){if(t?.includes("(")){let e=t.match(/[^\(\)]{1,}/g)
t=e?.[e.length-1]||""}return t?.split(y)||[]}function $(t,e,o,n,i){let r=o=>{o?.preventDefault(),o?.stopPropagation()
let n={...i,...i.profiles?.[t.dataset.overrides||""]||JSON.parse(t.dataset.overrides||"{}")||{}},r=o?.target;(["click","submit"].includes(e)||["A","FORM"].includes(r?.nodeName))&&history.pushState({fetchData:n,elId:t.id},"",r?.href||r?.action||""),async function(t,e,o){if(p&&!e.fetch?.externals?.some((e=>t?.href?.startsWith(e.domain)))){let o=e.fetch,n=await fetch(t?.href,{...o?.request||{},method:t?.method,body:o?.request?.body?JSON.stringify(o?.request?.body||{}):void 0}).catch((t=>{o?.err?.(t)})),i=n?.status
if(i&&0==o?.onCode?.(i))return
let r=await(n?.[e.fetch?.type||"text"]())
e.fetch?.cb?.(r),"json"!=e?.fetch?.type&&p.parseFromString(r,"text/html").body}}({method:t.dataset.method?.toLowerCase()||"get",href:r?.href,el:t},n)}
"mount"==e?r():t.addEventListener(e,r)}
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
 * @property {string} [class] - CSS class applied to transitions (default: `cu-trans`)
 * @property {[number, number] | number} [dur] - Transition duration: [in, out] or single value (in ms); default: 300
 * @property {number} [swap] - Swap delay (in ms) - applied between one element's outro start and the replacement's intro start; default: 0
 * @property {{ [key in HookKey]?: (el: HTMLElement)=> void }} [hooks] - Transition hooks
 */
/**!
 * Copper options for `fetch`, `trans`, and `profiles`.
 * @typedef {Object} CuOps
 * @property {{ [ key: string ]: Partial<CuOps> }} [profiles] - Fetch profiles assignable to elements
 * @property {FetchOptions} [fetch] - Fetch options - see https://google.com
 * @property {TransitionOptions} [trans] - Transition settings - see https://google.com
 */
/**!
 * @template T
 * @callback UpdaterFunction
 * @param {Array<any>} upstreamValues
 * @param {T} value
 * @returns {T}
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
 * @prop {function(T):Promise<T|undefined>} update - Update the store's current value
 * @prop {function(function(T):void):void} sub - Add a subscription function to the store
 */
/**!
 * @typedef {Function} CuFunc
 * @param {any} val
 * @param {HTMLElement} [el]
 */
/**!
 * The global Copper interface.
 */const v={store:
/**!
* - Create or overwrite a _typed_ global Copper store by passing `store_ops` (`CuOps`) -> *returns `Store\<T\>`* 
* - Retrieve an untyped reference to the store specified by name by omitting `store_ops` -> *returns `Store\<any\>`*
* @template T
* @param {string} store_name
* @param {StoreOptions<T>} [store_ops]
* @return {Store<T>}
*/
(store_name,store_ops)=>f(store_name,store_ops),ustore:
/**!
* - Create or overwrite an untyped global Copper store by passing `store_ops` (`CuOps`) -> *returns `Store\<any\>`* 
* - Retrieve an untyped reference to the store specified by name by omitting `store_ops` -> *returns `Store\<any\>`*
* @param {string} store_name
* @param {StoreOptions<any>} [store_ops]
* @return {Store<any>}
*/
(store_name,store_ops)=>f(store_name,store_ops),getFunc:
/**!
 * - Retrieve a Copper function by name. *val* refers to the store's current value; *el* refers to the element that triggered the update (if applicable). *returns `CuFunc`*
 * - *Note:* Functions retrived using this method cannot infer the type of the store's value and is therefore **not** type-checked. It is preferable to keep a reference to the function if you need to preserve type information.
 * @param {string} func_name
 * @return {CuFunc}
 */
func_name=>i.get(func_name),addFuncs:
/**!
 * - Add functions to the Copper function registry in key-value pairs.
 * - Functions must be registered in order to be accessible to HTML elements via `bind`, `sync`, and `resolve`. 
 * - It may still be beneficial to keep a reference to the original function if you need to preserve type information.
 * @param {{ [key: string]: CuFunc }} funcs
 */
funcs=>{for(let t in funcs)i.set(t,funcs[t])},config:
/**!
 * - Set Copper configuration options, including `trans` (DOM transition settings), `fetch` (fetch options), and `profiles` (configuration option overrides that can be set on elements ad-hoc via `cu-overrides`).
 * - Providing the optional `profileName` parameter allows you to save the configuration as a named profile. Otherwise, the profile is saved as the default configuration.
 * @param {CuOps} new_ops
 * @param {string} [profile_name]
 */
(new_ops,profile_name)=>m(new_ops,profile_name),onTick:
/**!
  * - Wait for the next Copper data update cycle to complete before executing the callback function.
  * @param {()=> void} cb
  */
t=>{var o;(o=t)&&e.push(o)}}
globalThis.Cu=v
