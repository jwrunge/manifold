let t=globalThis.smartOutro,e=[],o=!1
function i(t){e.push(t),o||(o=!0,globalThis.requestAnimationFrame?.(n))}function n(){o=!1
for(let o of e)if("function"==typeof o)o()
else{if([">","+"].includes(o.relation)){if(">"==o.relation){let t=globalThis.document?.createElement("div")
for(let e of Array.from(o.out?.childNodes||[]))t.appendChild(e)
o.out?.replaceChildren(t),r(t,"out",o.ops)}t?.space?.(o.in,o.out),r(o.in,"in",o.ops,(()=>{o.in&&o.out?.appendChild(o.in),t?.adjust?.(o.in,o.ops)}))}else r(o.in,"in",o.ops,(()=>{o.out?.after(o.in),t?.space?.(o.in,o.out),t?.adjust?.(o.in,o.ops),"/"===o.relation&&r(o.out,"out",o.ops)}))
o.done?.(o.in)}e=[]}function r(e,o,n,r){if(e?.nodeType==Node.TEXT_NODE){let t=e.textContent,o=globalThis.document?.createElement("div")
o.textContent=t,e.replaceWith(o),e=o}if(e){let s=Array.isArray(n.trans?.dur)?n.trans?.dur["in"==o?0:1]||n.trans?.dur[0]:n.trans?.dur||0,l=n?.trans?.class||"mf-trans"
e?.classList?.add(l),n.trans?.hooks?.[`${o}-start`]?.(e),"out"==o?i((()=>{t?.size?.(e),s&&(e.style.transitionDuration=`${s}ms`),e.classList?.add(o)})):setTimeout((()=>{i((()=>{s&&(e.style.transitionDuration=`${s}ms`),e?.classList?.add(o),r?.(),i((()=>{e?.classList?.remove(o)}))}))}),n.trans?.swap||0),setTimeout((()=>{i((()=>{"out"==o&&e?.remove(),e?.classList?.remove(l),e?.classList?.remove(o),n.trans?.hooks?.[`${o}-end`]?.(e)}))}),s+("in"==o&&n.trans?.swap||0))}}function s(t){if(!t)return 0
if("number"==typeof t)return t
if(!0===t)return 1
if(t instanceof Map)return s(Array.from(t.entries()))
if(t instanceof Set)return s(Array.from(t))
let e=0
for(const o of(new TextEncoder).encode("string"==typeof t?t:t?.toString()||""))e=(e<<5)-e+o
return e}let l=[]
globalThis.Mfld_stores||(globalThis.Mfld_stores=new Map),globalThis.Mfld_funcs||(globalThis.Mfld_funcs=new Map)
let a,f=new Map
class u{#t=void 0
t=new Map
o=void 0
i=[]
l=[]
constructor(t,e){return this.u(t,e)}u(t,e){this.name=t,globalThis.Mfld_stores.set(t,this),this.l=e?.upstream||[]
for(let t of this.l)h(t)?.i?.push(this.name||"")
return this.value=e?.value,this.#t=e?.updater,this}h(t,e){this.t.set(t,e),e?.()}sub(t){let e="x".repeat(5).replace(/./g,(t=>"ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"[Math.floor(36*Math.random())]))
this.t.set(e,t),t?.(this.value)}async update(t){return new Promise((e=>{f.set(this.name||"",t),clearTimeout(a),a=setTimeout((async()=>{for(let[t,e]of f){const e=h(t)
e.i.forEach((t=>f.delete(t))),e.l.forEach((e=>!f.has(e)||f.delete(t)))}let t=[]
for(let[e,o]of f){let n=h(e),r="function"==typeof o?await(o?.(n.value)):o,l=s(r)
if(l!==n.o){n.value=r,n.o=l
for(let e of n.i)t.push(e)
i((()=>{for(let[t,e]of n.t)e?.(n.value,t)}))}}f.clear()
for(let e of t)h(e)&&await h(e).p()
l.forEach((t=>t())),l=[],e(this.value)}),0)}))}async p(){await this.update(await(this.#t?.(this.l?.map((t=>h(t)?.value))||[],this?.value)||this.value))}}function h(t,e){let o=globalThis.Mfld_stores.get(t)
return e?o?o.u(t,e):new u(t,e):o||new u(t,e)}globalThis.DOMParser&&new DOMParser
let c={}
const d="mf",g=[`${d}bind`,`${d}sync`,...["get","head","post","put","delete","patch"].map((t=>`${d}${t}`))]
let p=/, {0,}/g,b=0
function T(t,e,o){let i=t
for(let t of e)null==i&&(i="number"==typeof t?[]:{}),null==o||e[e.length-1]!==t?i=i instanceof Map?i?.get(t):i?.[t]:i instanceof Map?i.set(t,o):i[t]=o
return i}function w(t){if(t?.includes("(")){let e=t.match(/[^\(\)]{1,}/g)
t=e?.[e.length-1]||""}return t?.split(p)?.map((t=>t.trim()))||[]}function m(t,e){let o=async e=>{e?.preventDefault(),e?.stopPropagation()
const o={...c,...c.profiles?.[t.dataset.overrides||""]||JSON.parse(t.dataset.overrides||"{}")||{}}
let i=e?.target
if(!o?.fetch?.externals?.some((t=>i?.href?.startsWith(t.domain)))){let t=o.fetch,e=await fetch(i?.href,{...t?.request||{},method:i?.method,body:t?.request?.body?JSON.stringify(t?.request?.body||{}):void 0}).catch((e=>{t?.err?.(e)})),n=e?.status
if(n&&0==t?.onCode?.(n))return
let r=await(e?.[o.fetch?.type||"text"]())
o.fetch?.cb?.(r),"json"!=o?.fetch?.type&&globalThis.DOMParser&&(new DOMParser).parseFromString(text,"text/html").body}}
"mount"==e?o():t.addEventListener(e,o)}
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
(store_name,store_ops)=>(store_ops?.hasOwnProperty("value")||store_ops?.hasOwnProperty("updater")||(store_ops={value:store_ops}),h(store_name,store_ops)),ustore:
/**!
* - Create or overwrite an untyped global Manifold store by passing `store_ops` (`MfldOps`) -> *returns `Store\<any\>`* 
* - Retrieve an untyped reference to the store specified by name by omitting `store_ops` -> *returns `Store\<any\>`*
* @param {string} store_name
* @param {StoreOptions<any> | any} store_ops
* @return {Store<any>}
*/
(store_name,store_ops)=>h(store_name,store_ops),get:
/**!
 * - Retrieve a Manifold store by name. *returns `Store\<any\>`*
 * @param {string} store_name
 * @return {Store<any>}
 */
store_name=>h(store_name),func:
/**!
 * - Retrieve a Manifold function by name. *val* refers to the store's current value; *el* refers to the element that triggered the update (if applicable). *returns `MfldFunc`*
 * - *Note:* Functions retrived using this method cannot infer the type of the store's value and is therefore **not** type-checked. It is preferable to keep a reference to the function if you need to preserve type information.
 * @param {string} func_name
 * @return {MfldFunc}
 */
func_name=>globalThis.Mfld_funcs?.get(func_name),funcs:
/**!
 * - Add functions to the Manifold function registry in key-value pairs.
 * - Functions must be registered in order to be accessible to HTML elements via `mf-bind`, `mf-sync`, and `mf-resolve`. 
 * - It may still be beneficial to keep a reference to the original function if you need to preserve type information.
 * @param {{ [key: string]: MfldFunc }} funcs
 */
funcs=>{for(let t in funcs)globalThis.Mfld_funcs.set(t,funcs[t])},config:
/**!
 * - Set Manifold configuration options, including `trans` (DOM transition settings), `fetch` (fetch options), and `profiles` (configuration option overrides that can be set on elements ad-hoc via `mf-overrides`).
 * - Providing the optional `profileName` parameter allows you to save the configuration as a named profile. Otherwise, the profile is saved as the default configuration.
 * @param {MfldOps} new_ops
 * @param {string} [profile_name]
 */
(new_ops,profile_name)=>{return t=new_ops,void((e=profile_name)?c.profiles={...c.profiles,[e]:t}:c={...c,...t})

;/**!
 * @param {Partial<MfldOps>} newops 
 * @param {string} [profileName] 
 */
var t,e},onTick:
/**!
  * - Wait for the next Manifold data update cycle to complete before executing the callback function.
  * @param {()=> void} cb
  */
t=>{var e;(e=t)&&l.push(e)},register:
/**!
 * - Register Manifold subscriptions on the DOM. *Optional:* Pass an `HTMLElement` or selector string to scope the registration to a specific element.
 * @param {HTMLElement | string | null} [parent]
 */
t=>{"string"==typeof t&&(t=document.querySelector(t)),function(t){let e=(t||document.body).querySelectorAll(`[data-${g.join("],[data-")}]${0!=c.fetch?.auto?",a":""}`)||[]
for(let t of e){t.id||(t.id=""+b++)
for(let e in t.dataset){let o=e!=`${d}bind`,n=`(#${t.id} on ${e})`
t.dataset?.[e]?.split(";").forEach((r=>{let s,l=r?.split(/(?:(?:\)|->) ?){1,}/g)||[],a=o?w(l.splice(0,1)[0]):[],f=l[0]?.includes("(")&&l[0]?.match(/^[^\(]{1,}/)?.[0]||"",u=w(l.splice(e==`${d}sync`?1:0,1)[0]),c=w(l[0])
if(o&&!a?.length)throw`No trigger: ${n}.`
if(f){if(s=globalThis[f]||globalThis.Mfld_funcs?.get(f),!s)throw`"${f}" not registered: ${n}`
if(!o&&u.length>1||o&&c.length>1)throw`Multiple sources: ${n}`}let g=u.map((t=>{let[e,...o]=t.split(/[\.\[\]\?]{1,}/g)
return{name:e,path:o.map((t=>isNaN(parseInt(t))?t:parseInt(t))).filter((t=>t))}}))
a?.length||(a=[""])
for(let o of a){["bind","sync"].includes(e)&&m(t,o),c?.length||(c=[""])
for(let r=0;r<c.length;r++)if(e==`${d}bind`){let e=()=>{i((()=>{const e=s?.(...g.map((t=>T(h(t.name)?.value,t.path))),t)??T(h(g[0].name||"")?.value,g[0].path)
void 0!==e&&(t[c[r]]=e),t.dispatchEvent(new CustomEvent(o))}))}
for(let o of g)h(o.name)?.h(t.id,e)}else if(e==`${d}sync`){if(g.length>1)throw`Only one store supported: ${n}`
let e=()=>{let e=t[c[r].trim()]
s&&(e=s?.(e,t))
const o=h(g[0]?.name)
void 0!==e&&o?.update?.((t=>g[0]?.path?.length?T(t,g[0]?.path,e):e))}
t.addEventListener(o,e)}}}))}}}(t)}}
export{y as Mfld}
//# sourceMappingURL=mfld.mod.js.map
