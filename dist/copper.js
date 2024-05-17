function t(e){if("number"==typeof e)return e
if(!0===e)return 1
if("object"==typeof e)return e instanceof Map?t(e.entries()):e instanceof Set?t(Array.from(e)):Date.now()
let o=0
for(const t of(new TextEncoder).encode("string"==typeof e?e:e.toString()))o=(o<<5)-o+t
return o}let e,o=new Map,n=new Map,i=new Map
class r{#t=void 0
t=new Map
o=void 0
i=[]
l=[]
constructor(t,e){this.name=t,o.set(t,this),this.l=e?.upstream||[]
for(let t of this.l)s(t)?.i?.push(this.name||"")
return this.value=e?.value,this.#t=e?.updater,this}u(t,e){this.t.set(t,e),e?.()}sub(t){let e="x".repeat(5).replace(/./g,(t=>"ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"[Math.floor(36*Math.random())]))
this.t.set(e,t),t?.(this.value)}async update(o){return new Promise((n=>{i.set(this.name||"",o),clearTimeout(e),e=setTimeout((async()=>{for(let[t,e]of i){const e=s(t)
e.i.forEach((t=>i.delete(t))),e.l.forEach((e=>!i.has(e)||i.delete(t)))}let e=[]
for(let[o,n]of i){let i=s(o),r="function"==typeof n?n?.(i.value):n,f=Array.from(i.value||[])?.length!==Array.from(r).length,l=""
if(f||(l=t(i.value),f=l!==i.o),f){i.value=r,i.o=l
for(let t of i.i)e.push(t)
for(let[t,e]of i.t)e?.(i.value,t)}}i.clear()
for(let t of e)s(t)&&await s(t).h()
n(this.value)}),0)}))}async h(){await this.update(await(this.#t?.(this.l?.map((t=>s(t)?.value))||[],this?.value)||this.value))}}function s(t,e){return e?new r(t,e):o.get(t)||new r(t,e)}let f=globalThis.smartOutro,l=[],a=!1
function u(t){l.push(t),a||(a=!0,requestAnimationFrame(c))}function c(){a=!1
for(let t of l)if("function"==typeof t)t()
else{if([">","+"].includes(t.relation)){if(">"==t.relation){let e=globalThis.document?.t("div")
for(let o of Array.from(t.out?.childNodes||[]))e.appendChild(o)
t.out?.replaceChildren(e),h(e,"out",t.ops)}f?.space?.(t.in,t.out),h(t.in,"in",t.ops,(()=>{t.in&&t.out?.appendChild(t.in),f?.adjust?.(t.in,t.ops)}))}else h(t.in,"in",t.ops,(()=>{t.out?.after(t.in),f?.space?.(t.in,t.out),f?.adjust?.(t.in,t.ops),"/"===t.relation&&h(t.out,"out",t.ops)}))
t.done?.(t.in)}l=[]}function h(t,e,o,n){if(t?.nodeType==Node.TEXT_NODE){let e=t.textContent,o=globalThis.document?.t("div")
o.textContent=e,t.replaceWith(o),t=o}if(t){let i=Array.isArray(o.trans?.dur)?o.trans?.dur["in"==e?0:1]||o.trans?.dur[0]:o.trans?.dur||0,r=o?.trans?.class||"cu-trans"
t?.classList?.add(r),o.trans?.hooks?.[`${e}-start`]?.(t),"out"==e?u((()=>{f?.size?.(t),i&&(t.style.transitionDuration=`${i}ms`),t.classList?.add(e)})):setTimeout((()=>{u((()=>{i&&(t.style.transitionDuration=`${i}ms`),t?.classList?.add(e),n?.(),u((()=>{t?.classList?.remove(e)}))}))}),o.trans?.swap||0),setTimeout((()=>{u((()=>{"out"==e&&t?.remove(),t?.classList?.remove(r),t?.classList?.remove(e),o.trans?.hooks?.[`${e}-end`]?.(t)}))}),i+("in"==e&&o.trans?.swap||0))}}let d=globalThis.DOMParser?new DOMParser:void 0
let p=/, {0,}/g,y=0
!function(){let t=globalThis.document?.currentScript?.dataset
if(t?.config)try{g(JSON.parse(t?.config))}catch(t){console.warn("Invalid Cu params",t)}t?.init&&function(t){let e=t?.querySelectorAll(`[data-${w.join("],[data-")}]${0!=m.fetch?.auto?",a":""}`)||[]
for(let t of e){t.id||(t.id="cu-"+y++)
for(let e in t.dataset){if(!w.includes(e))continue
let o="bind"!=e,i=`(#${t.id} on ${e})`
t?.dataset?.[e]?.split(";").forEach((r=>{let f,l=r?.split(/(?:(?:\)|->) ?){1,}/g)||[],a=o?M(l.splice(0,1)[0]):[],c=l[0]?.includes("(")&&l[0]?.match(/^[^\(]{1,}/)?.[0]||"",h=M(l.splice("sync"==e?1:0,1)[0]),d=M(l[0])
if(o&&!a?.length)throw`No trigger: ${i}.`
if(c){if(f=globalThis[c]||n.get(c),!f)throw`"${c}" not registered: ${i}`
if(!o&&h.length>1||o&&d.length>1)throw`Multiple sources: ${i}`}let p=h.map((t=>{let[e,...o]=t.split(/[\.\[\]\?]{1,}/g)
return{name:e,path:o.map((t=>isNaN(parseInt(t))?t:parseInt(t))).filter((t=>t))}}))
a?.length||(a=[""])
for(let o of a){"fetch"==e&&T(t,o,h,d,m),d?.length||(d=[""])
for(let n=0;n<d.length;n++)if("bind"==e){let e=()=>{u((()=>{t[d[n]]=f?.(...p.map((t=>b(s(t.name)?.value,t.path))),t)??b(s(p[0].name||"")?.value,p[0].path),t.dispatchEvent(new CustomEvent(o))}))}
for(let o of p)s(o.name)?.u(t.id,e)}else if("sync"==e){if(p.length>1)throw`Only one store supported: ${i}`
let e=()=>{let e=t[d[n].trim()]
f&&(e=f?.(e,t))
const o=s(p[0]?.name)
void 0!==e&&o?.update?.((t=>p[0]?.path?.length?b(t,p[0]?.path,e):e))}
t.addEventListener(o,e)}}}))}}}()}()
let m={},w=["bind","sync","fetch"]

;/**!
 * @param {Partial<CuOps>} newops 
 * @param {string} [profileName] 
 */
function g(t,e){e?m.profiles={...m.profiles,[e]:t}:m={...m,...t}}function b(t,e,o){let n=t
for(let t of e)null==n&&(n="number"==typeof t?[]:{}),null==o||e[e.length-1]!==t?n=n instanceof Map?n?.get(t):n?.[t]:n instanceof Map?n.set(t,o):n[t]=o
return n}function M(t){if(t?.includes("(")){let e=t.match(/[^\(\)]{1,}/g)
t=e?.[e.length-1]||""}return t?.split(p)||[]}function T(t,e,o,n,i){let r=o=>{o?.preventDefault(),o?.stopPropagation()
let n={...i,...i.profiles?.[t.dataset.overrides||""]||JSON.parse(t.dataset.overrides||"{}")||{}},r=o?.target;(["click","submit"].includes(e)||["A","FORM"].includes(r?.nodeName))&&history.pushState({fetchData:n,elId:t.id},"",r?.href||r?.action||""),async function(t,e,o){if(d&&!e.fetch?.externals?.some((e=>t?.href?.startsWith(e.domain)))){let o=e.fetch,n=await fetch(t?.href,{...o?.request||{},method:t?.method,body:o?.request?.body?JSON.stringify(o?.request?.body||{}):void 0}).catch((t=>{o?.err?.(t)})),i=n?.status
if(i&&0==o?.onCode?.(i))return
let r=await(n?.[e.fetch?.type||"text"]())
e.fetch?.cb?.(r),"json"!=e?.fetch?.type&&d.parseFromString(r,"text/html").body}}({method:t.dataset.method?.toLowerCase()||"get",href:r?.href,el:t},n)}
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
 */const $={store:
/**!
* - Create or overwrite a _typed_ global Copper store by passing `store_ops` (`CuOps`) -> *returns `Store\<T\>`* 
* - Retrieve an untyped reference to the store specified by name by omitting `store_ops` -> *returns `Store\<any\>`*
* @template T
* @param {string} store_name
* @param {StoreOptions<T>} [store_ops]
* @return {Store<T>}
*/
(store_name,store_ops)=>s(store_name,store_ops),ustore:
/**!
* - Create or overwrite an untyped global Copper store by passing `store_ops` (`CuOps`) -> *returns `Store\<any\>`* 
* - Retrieve an untyped reference to the store specified by name by omitting `store_ops` -> *returns `Store\<any\>`*
* @param {string} store_name
* @param {StoreOptions<any>} [store_ops]
* @return {Store<any>}
*/
(store_name,store_ops)=>s(store_name,store_ops),getFunc:
/**!
 * - Retrieve a Copper function by name. *val* refers to the store's current value; *el* refers to the element that triggered the update (if applicable). *returns `CuFunc`*
 * - *Note:* Functions retrived using this method cannot infer the type of the store's value and is therefore **not** type-checked. It is preferable to keep a reference to the function if you need to preserve type information.
 * @param {string} func_name
 * @return {CuFunc}
 */
func_name=>n.get(func_name),addFuncs:
/**!
 * - Add functions to the Copper function registry in key-value pairs.
 * - Functions must be registered in order to be accessible to HTML elements via `bind`, `sync`, and `resolve`. 
 * - It may still be beneficial to keep a reference to the original function if you need to preserve type information.
 * @param {{ [key: string]: CuFunc }} funcs
 */
funcs=>{for(let t in funcs)n.set(t,funcs[t])},config:
/**!
 * - Set Copper configuration options, including `trans` (DOM transition settings), `fetch` (fetch options), and `profiles` (configuration option overrides that can be set on elements ad-hoc via `cu-overrides`).
 * - Providing the optional `profileName` parameter allows you to save the configuration as a named profile. Otherwise, the profile is saved as the default configuration.
 * @param {CuOps} new_ops
 * @param {string} [profile_name]
 */
(new_ops,profile_name)=>g(new_ops,profile_name)}
globalThis.Cu=$
