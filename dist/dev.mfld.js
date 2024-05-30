function t(e){if(!e)return 0
if("number"==typeof e)return e
if(!0===e)return 1
if(e instanceof Map)return t(Array.from(e.entries()))
if(e instanceof Set)return t(Array.from(e))
let o=0
for(const t of(new TextEncoder).encode("string"==typeof e?e:e?.toString()||""))o=(o<<5)-o+t
return o}let e=[]
globalThis.Mfld_stores||(globalThis.Mfld_stores=new Map),globalThis.Mfld_funcs||(globalThis.Mfld_funcs=new Map)
let o,i=new Map
class n{#t=void 0
t=new Map
o=void 0
i=[]
l=[]
constructor(t,e){return this.u(t,e)}u(t,e){this.name=t,globalThis.Mfld_stores.set(t,this),this.l=e?.upstream||[]
for(let t of this.l)r(t)?.i?.push(this.name||"")
return this.value=e?.value,this.#t=e?.updater,this}h(t,e){this.t.set(t,e),e?.()}sub(t){let e="x".repeat(5).replace(/./g,(t=>"ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"[Math.floor(36*Math.random())]))
this.t.set(e,t),t?.(this.value)}async update(n){return new Promise((s=>{i.set(this.name||"",n),clearTimeout(o),o=setTimeout((async()=>{for(let[t,e]of i){const e=r(t)
e.i.forEach((t=>i.delete(t))),e.l.forEach((e=>!i.has(e)||i.delete(t)))}let o=[]
for(let[e,n]of i){let i=r(e),s="function"==typeof n?await(n?.(i.value)):n,l=t(s)
if(l!==i.o){i.value=s,i.o=l
for(let t of i.i)o.push(t)
for(let[t,e]of i.t)e?.(i.value,t)}}i.clear()
for(let t of o)r(t)&&await r(t).p()
e.forEach((t=>t())),e=[],s(this.value)}),0)}))}async p(){await this.update(await(this.#t?.(this.l?.map((t=>r(t)?.value))||[],this?.value)||this.value))}}function r(t,e){let o=globalThis.Mfld_stores.get(t)
return e?o?o.u(t,e):new n(t,e):o||new n(t,e)}let s=globalThis.smartOutro,l=[],f=!1
function a(t){l.push(t),f||(f=!0,globalThis.requestAnimationFrame?.(u))}function u(){f=!1
for(let t of l)if("function"==typeof t)t()
else{if([">","+"].includes(t.relation)){if(">"==t.relation){let e=globalThis.document?.createElement("div")
for(let o of Array.from(t.out?.childNodes||[]))e.appendChild(o)
t.out?.replaceChildren(e),h(e,"out",t.ops)}s?.space?.(t.in,t.out),h(t.in,"in",t.ops,(()=>{t.in&&t.out?.appendChild(t.in),s?.adjust?.(t.in,t.ops)}))}else h(t.in,"in",t.ops,(()=>{t.out?.after(t.in),s?.space?.(t.in,t.out),s?.adjust?.(t.in,t.ops),"/"===t.relation&&h(t.out,"out",t.ops)}))
t.done?.(t.in)}l=[]}function h(t,e,o,i){if(t?.nodeType==Node.TEXT_NODE){let e=t.textContent,o=globalThis.document?.createElement("div")
o.textContent=e,t.replaceWith(o),t=o}if(t){let n=Array.isArray(o.trans?.dur)?o.trans?.dur["in"==e?0:1]||o.trans?.dur[0]:o.trans?.dur||0,r=o?.trans?.class||"cu-trans"
t?.classList?.add(r),o.trans?.hooks?.[`${e}-start`]?.(t),"out"==e?a((()=>{s?.size?.(t),n&&(t.style.transitionDuration=`${n}ms`),t.classList?.add(e)})):setTimeout((()=>{a((()=>{n&&(t.style.transitionDuration=`${n}ms`),t?.classList?.add(e),i?.(),a((()=>{t?.classList?.remove(e)}))}))}),o.trans?.swap||0),setTimeout((()=>{a((()=>{"out"==e&&t?.remove(),t?.classList?.remove(r),t?.classList?.remove(e),o.trans?.hooks?.[`${e}-end`]?.(t)}))}),n+("in"==e&&o.trans?.swap||0))}}let c=globalThis.DOMParser?new DOMParser:void 0
let d=/, {0,}/g,g=0,p={},b=["bind","sync","fetch"]
function T(t,e,o){let i=t
for(let t of e)null==i&&(i="number"==typeof t?[]:{}),null==o||e[e.length-1]!==t?i=i instanceof Map?i?.get(t):i?.[t]:i instanceof Map?i.set(t,o):i[t]=o
return i}function m(t){if(t?.includes("(")){let e=t.match(/[^\(\)]{1,}/g)
t=e?.[e.length-1]||""}return t?.split(d)?.map((t=>t.trim()))||[]}function w(t,e,o,i,n){let r=o=>{o?.preventDefault(),o?.stopPropagation()
let i={...n,...n.profiles?.[t.dataset.overrides||""]||JSON.parse(t.dataset.overrides||"{}")||{}},r=o?.target;(["click","submit"].includes(e)||["A","FORM"].includes(r?.nodeName))&&history.pushState({fetchData:i,elId:t.id},"",r?.href||r?.action||""),async function(t,e,o){if(c&&!e.fetch?.externals?.some((e=>t?.href?.startsWith(e.domain)))){let o=e.fetch,i=await fetch(t?.href,{...o?.request||{},method:t?.method,body:o?.request?.body?JSON.stringify(o?.request?.body||{}):void 0}).catch((t=>{o?.err?.(t)})),n=i?.status
if(n&&0==o?.onCode?.(n))return
let r=await(i?.[e.fetch?.type||"text"]())
e.fetch?.cb?.(r),"json"!=e?.fetch?.type&&c.parseFromString(r,"text/html").body}}({method:t.dataset.method?.toLowerCase()||"get",href:r?.href,el:t},i)}
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
 * @prop {function(function(T):void):void} sub - Add a subscription function to the store
 */
/**!
 * @typedef {Function} MfldFunc
 * @param {any} val
 * @param {HTMLElement} [el]
 */
/**!
 * The global Manifold interface.
 */const y={store:
/**!
* - Create or overwrite a _typed_ global Manifold store by passing `store_ops` (`MfldOps`) -> *returns `Store\<T\>`* 
* - Retrieve an untyped reference to the store specified by name by omitting `store_ops` -> *returns `Store\<any\>`*
* @template T
* @param {string} store_name
* @param {StoreOptions<T> | T} store_ops
* @return {Store<T>}
*/
(store_name,store_ops)=>(store_ops?.hasOwnProperty("value")||store_ops?.hasOwnProperty("updater")||(store_ops={value:store_ops}),r(store_name,store_ops)),ustore:
/**!
* - Create or overwrite an untyped global Manifold store by passing `store_ops` (`MfldOps`) -> *returns `Store\<any\>`* 
* - Retrieve an untyped reference to the store specified by name by omitting `store_ops` -> *returns `Store\<any\>`*
* @param {string} store_name
* @param {StoreOptions<any> | any} store_ops
* @return {Store<any>}
*/
(store_name,store_ops)=>r(store_name,store_ops),get:
/**!
 * - Retrieve a Manifold store by name. *returns `Store\<any\>`*
 * @param {string} store_name
 * @return {Store<any>}
 */
store_name=>r(store_name),func:
/**!
 * - Retrieve a Manifold function by name. *val* refers to the store's current value; *el* refers to the element that triggered the update (if applicable). *returns `MfldFunc`*
 * - *Note:* Functions retrived using this method cannot infer the type of the store's value and is therefore **not** type-checked. It is preferable to keep a reference to the function if you need to preserve type information.
 * @param {string} func_name
 * @return {MfldFunc}
 */
func_name=>globalThis.Mfld_funcs?.get(func_name),funcs:
/**!
 * - Add functions to the Manifold function registry in key-value pairs.
 * - Functions must be registered in order to be accessible to HTML elements via `bind`, `sync`, and `resolve`. 
 * - It may still be beneficial to keep a reference to the original function if you need to preserve type information.
 * @param {{ [key: string]: MfldFunc }} funcs
 */
funcs=>{for(let t in funcs)globalThis.Mfld_funcs.set(t,funcs[t])},config:
/**!
 * - Set Manifold configuration options, including `trans` (DOM transition settings), `fetch` (fetch options), and `profiles` (configuration option overrides that can be set on elements ad-hoc via `cu-overrides`).
 * - Providing the optional `profileName` parameter allows you to save the configuration as a named profile. Otherwise, the profile is saved as the default configuration.
 * @param {MfldOps} new_ops
 * @param {string} [profile_name]
 */
(new_ops,profile_name)=>{return t=new_ops,void((e=profile_name)?p.profiles={...p.profiles,[e]:t}:p={...p,...t})

;/**!
 * @param {Partial<MfldOps>} newops 
 * @param {string} [profileName] 
 */
var t,e},onTick:
/**!
  * - Wait for the next Manifold data update cycle to complete before executing the callback function.
  * @param {()=> void} cb
  */
t=>{var o;(o=t)&&e.push(o)},register:
/**!
   * - Register Manifold subscriptions on the DOM. *Optional:* Pass an `HTMLElement` or selector string to scope the registration to a specific element.
   * @param {HTMLElement | string | null} [parent]
   */
t=>{"string"==typeof t&&(t=document.querySelector(t)),function(t){let e=(t||document.body).querySelectorAll(`[data-${b.join("],[data-")}]${0!=p.fetch?.auto?",a":""}`)||[]
for(let t of e){t.id||(t.id="cu-"+g++)
for(let e in t.dataset){if(!b.includes(e))continue
let o="bind"!=e,i=`(#${t.id} on ${e})`
t?.dataset?.[e]?.split(";").forEach((n=>{let s,l=n?.split(/(?:(?:\)|->) ?){1,}/g)||[],f=o?m(l.splice(0,1)[0]):[],u=l[0]?.includes("(")&&l[0]?.match(/^[^\(]{1,}/)?.[0]||"",h=m(l.splice("sync"==e?1:0,1)[0]),c=m(l[0])
if(o&&!f?.length)throw`No trigger: ${i}.`
if(u){if(s=globalThis[u]||globalThis.Mfld_funcs?.get(u),!s)throw`"${u}" not registered: ${i}`
if(!o&&h.length>1||o&&c.length>1)throw`Multiple sources: ${i}`}let d=h.map((t=>{let[e,...o]=t.split(/[\.\[\]\?]{1,}/g)
return{name:e,path:o.map((t=>isNaN(parseInt(t))?t:parseInt(t))).filter((t=>t))}}))
f?.length||(f=[""])
for(let o of f){"fetch"==e&&w(t,o,0,0,p),c?.length||(c=[""])
for(let n=0;n<c.length;n++)if("bind"==e){let e=()=>{a((()=>{t[c[n]]=s?.(...d.map((t=>T(r(t.name)?.value,t.path))),t)??T(r(d[0].name||"")?.value,d[0].path),t.dispatchEvent(new CustomEvent(o))}))}
for(let o of d)r(o.name)?.h(t.id,e)}else if("sync"==e){if(d.length>1)throw`Only one store supported: ${i}`
let e=()=>{let e=t[c[n].trim()]
s&&(e=s?.(e,t))
const o=r(d[0]?.name)
void 0!==e&&o?.update?.((t=>d[0]?.path?.length?T(t,d[0]?.path,e):e))}
t.addEventListener(o,e)}}}))}}}(t)}}
export{y as Mfld}
//# sourceMappingURL=dev.mfld.js.map
