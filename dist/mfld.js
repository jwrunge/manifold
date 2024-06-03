let t,e=[],n=!1,o=[],i="",r=globalThis?.requestAnimationFrame||(t=>setTimeout(t,0))
function s(t){e.push(t),n||(n=!0,r(f))}function l(e,n,o){t=document.createElement("div")
let{paddingTop:r,paddingBottom:s}=n instanceof Element?window.getComputedStyle(n):{paddingTop:0,paddingBottom:0}
i=t.style.height=`calc(${Math.abs(o-(e?.clientHeight||0))}px - ${r} - ${s})`,n?.after(t)}function a(e){s((()=>{t?.remove(),e?.animate?.([{height:i},{height:`${e.clientHeight||0}px`}],300)}))}function f(){n=!1
for(let t of e)if("function"==typeof t)t()
else{let e=t.out?t.out.clientHeight:0
if(["swapinner","append"].includes(t.relation)){if("swapinner"==t.relation){let e=document?.createElement("div")
for(let n of Array.from(t.out?.childNodes||[]))e.appendChild(n)
t.out?.replaceChildren(e),u(e,"out",t.ops)}l?.(t.in,t.out,e),u(t.in,"in",t.ops,(()=>{t.in&&t.out?.appendChild(t.in),a?.(t.in)}))}else"prepend"==t.relation?(l?.(t.in,t.out,e),u(t.in,"in",t.ops,(()=>{t.in&&t.out?.prepend(t.in),a?.(t.in)}))):(u(t.in,"in",t.ops,(()=>{t.out?.after(t.in),l?.(t.in,t.out,e),a?.(t.in)})),u(t.out,"out",t.ops))
t.done?.(t.in)}o.forEach((t=>t())),o=[],e=[]}function u(t,e,n,o){if(t?.nodeType==Node.TEXT_NODE){let e=t.textContent,n=document?.createElement("div")
n.textContent=e,t.replaceWith(n),t=n}if(t){let i=Array.isArray(n.trans?.dur)?n.trans?.dur["in"==e?0:1]||n.trans?.dur[0]:n.trans?.dur||0,r=n?.trans?.class||"mf-trans"
t?.classList?.add(r),n.trans?.hooks?.[`${e}-start`]?.(t),"out"==e?s((()=>{t.style.width=`${t.clientWidth}px`,t.style.height=`${t.clientHeight}px`,t.style.position="absolute",i&&(t.style.transitionDuration=`${i}ms`),t.classList?.add("out")})):(t?.classList?.add("in"),i&&(t.style.transitionDuration=`${i}ms`),o?.(),setTimeout((()=>{s((()=>{setTimeout((()=>s((()=>t?.classList?.remove(e)))),0)}))}),n.trans?.swap||0)),setTimeout((()=>{s((()=>{"out"==e&&t?.remove(),t?.classList?.remove(r),n.trans?.hooks?.[`${e}-end`]?.(t)}))}),i+("in"==e&&n.trans?.swap||0))}}function c(t){if(!t)return 0
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
constructor(t,e){return this.h(t,e)}h(t,e){return this.name=t,MfSt.set(t,this),this.l=new Set(e?.upstream?.map((t=>h(t)))||[]),this.l.forEach((t=>t?.u?.add(this))),this.value=e?.value,this.t=e?.updater,this}sub(t,e,n=!0){this.o.set(e||String(Date.now()+Math.random()),t),n&&t?.(this.value)}async update(t){return"(store1, store3)=> return store1 == 'Last one' || store3 == 'three' "===this.name&&console.log("UPDATING WITH VALUE",t),new Promise((async e=>{let n="function"==typeof t?(await t)?.(this.value):t,o=c(n)
if(o!==this.i){this.value=n,this.i=o
for(let t of this.u)await t.p()
s((()=>{for(let[t,e]of this?.o||[])e?.(this.value,t)
e(this.value)}))}else e(this.value)}))}async p(){"(store1, store3)=> return store1 == 'Last one' || store3 == 'three' "===this.name&&console.log("UPDATING AUTO")
let t=await(this.t?.(Array.from(this.l)?.map((t=>t?.value))||[],this?.value))
await this.update(void 0===t?this.value:t)}}function h(t,e){let n=MfSt.get(t)
return e?n?n.h(t,e):new d(t,e):n||new d(t,e)}globalThis.DOMParser&&new DOMParser
let p="mf"
function $(t,e,n,o,i,r){let l=async e=>{e?.preventDefault(),e?.stopPropagation()
let l=t.dataset[`${p}overrides`]||"{}",a=n.profiles?.[l]?.fetch||JSON.parse(l),f=a?{...n,...a}:n
r||(r="string"==typeof i?structuredClone(i):(e?.target)?.href,i=f?.fetch?.request?.body),o||(o=(e?.target)?.method||"get"),f?.fetch?.externals?.find((t=>r?.startsWith(t.domain)))||!r.match(/^https?:\/\//)||r.includes(location.origin)
let u=await fetch(r,{...f?.fetch?.request||{},method:o,body:"string"==typeof i?i:JSON.stringify(i)}).catch((t=>{f?.fetch?.err?.(t)})),c=u?.status
if(c&&0==f?.fetch?.onCode?.(c,u))return
let d=await(u?.[f?.fetch?.type||"text"]())
f?.fetch?.cb?.(d)
for(let e of["append","prepend","swapinner","swapouter"]){let n=t.dataset[`${p}${e}`]
if(void 0===n)continue
let[o,i]=n?.split("->").map((t=>t.trim()))||[],r=(new DOMParser)?.parseFromString?.(d,"text/html")
r&&s({in:r.querySelector(o||"body"),out:i?document.querySelector(i):t,relation:e,ops:f,done:()=>!0})}t.dataset?.[`${p}resolve`]&&alert("RESOLVING")}
"$mount"==e?l():t.addEventListener(e,l)}let g={},m=/, {0,}/g,w=0,y=["bind","sync","if","get","head","post","put","delete","patch"].map((t=>`${p}${t}`))

;/**!
 * @param {Partial<MfldOps>} newops 
 * @param {string} [profileName] 
 */
function T(t,e){e?g.profiles={...g.profiles,[e]:t}:g={...g,...t}}function b(t){let e=(t||document.body).querySelectorAll(`[data-${y.join("],[data-")}]${0!=g.fetch?.auto?",a":""}`)||[]
for(let t of e){t.id||(t.id=""+w++)
for(let e in t.dataset){if(!y.includes(e))continue
let n=![`${p}bind`,`${p}if`,`${p}each`].includes(e),o=`(#${t.id} on ${e})`
if([`${p}if`,`${p}each`].includes(e)){let[n,o]=t?.dataset?.[e]?.split("=>").map((t=>t.trim()))||["",""]
o||(o=n.slice(),n="")
let i=n.split(",").map((t=>t.replace(/[()]/g,"").trim())),r=globalThis[o]||MfFn?.get(o)||new Function(...i,o),s=h(t?.dataset?.[e]||"",{upstream:i,updater:(t,e)=>(console.log("Calling updater with value",r(...t)),r(...t))})
return void(e==`${p}if`?s?.sub((t=>t)):alert("FOUND EACH!"))}t.dataset?.[e]?.split(";").forEach((i=>{let r,l=i?.split(/(?:(?:\)|->) ?){1,}/g)||[],a=n?M(l.splice(0,1)[0]):[],f=l[0]?.includes("(")&&l[0]?.match(/^[^\(]{1,}/)?.[0]||"",u=M(l.splice(e==`${p}sync`?1:0,1)[0]),c=M(l[0])
if(n&&!a?.length)throw`No trigger: ${o}.`
if(f&&(r=globalThis[f]||MfFn?.get(f),r||console.warn(`"${f}" not registered: ${o}`),!n&&u.length>1||n&&c.length>1))throw`Multiple sources: ${o}`
let d=u.map((t=>{let[e,...n]=t.split(/[\.\[\]\?]{1,}/g)
return{name:e,path:n.map((t=>isNaN(parseInt(t))?t:parseInt(t))).filter((t=>t))}}))
a?.length||(a=[""])
for(let n of a)if(e.match(/bind|sync/)){c?.length||(c=[""])
for(let i=0;i<c.length;i++)if(e==`${p}bind`){let e=()=>{s((()=>{let e=r?.(...d.map((t=>v(h(t.name)?.value,t.path))),t)??v(h(d[0].name||"")?.value,d[0].path)
void 0!==e&&(t[c[i]]=e),t.dispatchEvent(new CustomEvent(n))}))}
for(let n of d)h(n.name)?.sub(e,t.id)}else if(e==`${p}sync`){if(d.length>1)throw`Only one store supported: ${o}`
let e=()=>{let e=c[i].trim(),n=t[e]??t.getAttribute(e)??t.dataset[e]??void 0
r&&(n=r?.(n,t))
let o=h(d[0]?.name)
void 0!==n&&o?.update?.((t=>d[0]?.path?.length?v(t,d[0]?.path,n):n))}
"$mount"==n?e():t.addEventListener(n,e)}}else{if(c.length>1||u.length>1)throw`Multiple sources: ${o}`
$(t,n,g,e.replace(p,""),c[0],u[0])}}))}}}function v(t,e,n){let o=t
for(let t of e)null==o&&(o="number"==typeof t?[]:{}),null==n||e[e.length-1]!==t?o=o instanceof Map?o?.get(t):o?.[t]:o instanceof Map?o.set(t,n):o[t]=n
return o}function M(t){if(t?.includes("(")){let e=t.match(/[^\(\)]{1,}/g)
t=e?.[e.length-1]||""}return t?.split(m)?.map((t=>t.trim()))||[]}
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
 */let S={store:
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
(new_ops,profile_name)=>T(new_ops,profile_name),onTick:
/**!
  * - Wait for the next Manifold data update cycle to complete before executing the callback function.
  * @param {()=> void} cb
  */
t=>{var e;(e=t)&&o.push(e)},register:
/**!
 * - Register Manifold subscriptions on the DOM. *Optional:* Pass an `HTMLElement` or selector string to scope the registration to a specific element.
 * @param {HTMLElement | string | null} [parent]
 */
t=>{"string"==typeof t&&(t=document.querySelector(t)),b(t)}}
globalThis.Mfld=S
let N=globalThis.document?.currentScript?.dataset||{}
if(N?.config)try{T(JSON.parse(N?.config))}catch(t){console.warn("Invalid Mfld params",t)}N?.init&&b(document.querySelector(N.init))
