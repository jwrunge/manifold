let t,e=[],n=!1,i=[],o="",r=globalThis?.requestAnimationFrame||(t=>setTimeout(t,0))
function s(t){e.push(t),n||(n=!0,r(f))}function a(e,n,i){t=document.createElement("div")
let{paddingTop:r,paddingBottom:s}=n instanceof Element?window.getComputedStyle(n):{paddingTop:0,paddingBottom:0}
o=t.style.height=`calc(${Math.abs(i-(e?.clientHeight||0))}px - ${r} - ${s})`,n?.after(t)}function l(e){s((()=>{t?.remove(),e?.animate?.([{height:o},{height:`${e.clientHeight||0}px`}],300)}))}function f(){n=!1
for(let t of e)if("function"==typeof t)t()
else{let e=t.out?t.out.clientHeight:0
if(["swapinner","append"].includes(t.relation)){if("swapinner"==t.relation){let e=document?.createElement("div")
for(let n of Array.from(t.out?.childNodes||[]))e.appendChild(n)
t.out?.replaceChildren(e),u(e,"out",t.ops)}a?.(t.in,t.out,e),u(t.in,"in",t.ops,(()=>{t.in&&t.out?.appendChild(t.in),l?.(t.in)}))}else"prepend"==t.relation?(a?.(t.in,t.out,e),u(t.in,"in",t.ops,(()=>{t.in&&t.out?.prepend(t.in),l?.(t.in)}))):(u(t.in,"in",t.ops,(()=>{t.out?.after(t.in),a?.(t.in,t.out,e),l?.(t.in)})),u(t.out,"out",t.ops))
t.done?.(t.in)}i.forEach((t=>t())),i=[],e=[]}function u(t,e,n,i){if(t?.nodeType==Node.TEXT_NODE){let e=t.textContent,n=document?.createElement("div")
n.textContent=e,t.replaceWith(n),t=n}if(t){let o=Array.isArray(n.trans?.dur)?n.trans?.dur["in"==e?0:1]||n.trans?.dur[0]:n.trans?.dur||0,r=n?.trans?.class||"mf-trans"
t?.classList?.add(r),n.trans?.hooks?.[`${e}-start`]?.(t),"out"==e?s((()=>{t.style.width=`${t.clientWidth}px`,t.style.height=`${t.clientHeight}px`,t.style.position="absolute",o&&(t.style.transitionDuration=`${o}ms`),t.classList?.add("out")})):(t?.classList?.add("in"),o&&(t.style.transitionDuration=`${o}ms`),i?.(),setTimeout((()=>{s((()=>{setTimeout((()=>s((()=>t?.classList?.remove(e)))),0)}))}),n.trans?.swap||0)),setTimeout((()=>{s((()=>{"out"==e&&t?.remove(),t?.classList?.remove(r),n.trans?.hooks?.[`${e}-end`]?.(t)}))}),o+("in"==e&&n.trans?.swap||0))}}function d(t){if(!t)return 0
if("number"==typeof t)return t
if(!0===t)return 1
if(t instanceof Map)return d(Array.from(t.entries()))
if(t instanceof Set)return d(Array.from(t))
let e=0
for(let n of(new TextEncoder).encode("string"==typeof t?t:t?.toString()||""))e=(e<<5)-e+n
return e}globalThis.MfSt||(globalThis.MfSt=new Map),globalThis.MfFn||(globalThis.MfFn=new Map)
class p{t=void 0
i=new Map
o=void 0
l
u=new Set
constructor(t,e){return this.p(t,e)}p(t,e){return this.name=t,MfSt.set(t,this),this.l=new Set(e?.upstream?.map((t=>c(t)))||[]),this.l.forEach((t=>t?.u?.add(this))),this.value=e?.value,this.t=e?.updater,this}sub(t,e,n=!0){this.i.set(e||String(Date.now()+Math.random()),t),n&&t?.(this.value)}async update(t){return new Promise((async e=>{let n="function"==typeof t?(await t)?.(this.value):t,i=d(n)
if(i!==this.o){this.value=n,this.o=i
for(let t of this.u)await t.h()
s((()=>{for(let[t,e]of this?.i||[])e?.(this.value,t)
e(this.value)}))}else e(this.value)}))}async h(){let t=await(this.t?.(Array.from(this.l)?.map((t=>t?.value))||[],this?.value))
await this.update(void 0===t?this.value:t)}}function c(t,e){let n=MfSt.get(t)
return e?n?n.p(t,e):new p(t,e):n||new p(t,e)}globalThis.DOMParser&&new DOMParser
let h="mf"
function $(t,e,n,i,o,r){let a=async e=>{e?.preventDefault(),e?.stopPropagation()
let a=t.dataset[`${h}overrides`]||"{}",l=n.profiles?.[a]?.fetch||JSON.parse(a),f=l?{...n,...l}:n
r||(r="string"==typeof o?structuredClone(o):(e?.target)?.href,o=f?.fetch?.request?.body),i||(i=(e?.target)?.method||"get"),f?.fetch?.externals?.find((t=>r?.startsWith(t.domain)))||!r.match(/^https?:\/\//)||r.includes(location.origin)
let u=await fetch(r,{...f?.fetch?.request||{},method:i,body:"string"==typeof o?o:JSON.stringify(o)}).catch((t=>{f?.fetch?.err?.(t)})),d=u?.status
if(d&&0==f?.fetch?.onCode?.(d,u))return
let p=await(u?.[f?.fetch?.type||"text"]())
f?.fetch?.cb?.(p)
for(let e of["append","prepend","swapinner","swapouter"]){let n=t.dataset[`${h}${e}`]
if(void 0===n)continue
let[i,o]=n?.split("->").map((t=>t.trim()))||[],r=(new DOMParser)?.parseFromString?.(p,"text/html")
r&&s({in:r.querySelector(i||"body"),out:o?document.querySelector(o):t,relation:e,ops:f,done:()=>!0})}t.dataset?.[`${h}resolve`]&&alert("RESOLVING")}
"$mount"==e?a():t.addEventListener(e,a)}let g={},m=/, {0,}/g,w=0,y=["bind","sync","if","get","head","post","put","delete","patch"].map((t=>`${h}${t}`))
function b(t,e,n){let i=t
for(let t of e)null==i&&(i="number"==typeof t?[]:{}),null==n||e[e.length-1]!==t?i=i instanceof Map?i?.get(t):i?.[t]:i instanceof Map?i.set(t,n):i[t]=n
return i}function v(t){if(t?.includes("(")){let e=t.match(/[^\(\)]{1,}/g)
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
(new_ops,profile_name)=>{return t=new_ops,void((e=profile_name)?g.profiles={...g.profiles,[e]:t}:g={...g,...t})

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
t=>{"string"==typeof t&&(t=document.querySelector(t)),function(t){let e=(t||document.body).querySelectorAll(`[data-${y.join("],[data-")}]${0!=g.fetch?.auto?",a":""}`)||[]
for(let t of e){t.id||(t.id=""+w++)
for(let e in t.dataset){if(!y.includes(e))continue
let n=![`${h}bind`,`${h}if`,`${h}each`].includes(e),i=`(#${t.id} on ${e})`
if([`${h}if`,`${h}each`].includes(e)){let[n,i]=t?.dataset?.[e]?.split("=>").map((t=>t.trim()))||["",""]
i||(i=n.slice(),n="")
let o=n.split(",").map((t=>t.replace(/[()]/g,"").trim())),r=globalThis[i]||MfFn?.get(i)||new Function(...o,i),s=c(t?.dataset?.[e]||"",{upstream:o,updater:t=>r(...t)})
return void(e==`${h}if`?s?.sub((t=>t)):alert("FOUND EACH!"))}t.dataset?.[e]?.split(";").forEach((o=>{let r,a=o?.split(/(?:(?:\)|->) ?){1,}/g)||[],l=n?v(a.splice(0,1)[0]):[],f=a[0]?.includes("(")&&a[0]?.match(/^[^\(]{1,}/)?.[0]||"",u=v(a.splice(e==`${h}sync`?1:0,1)[0]),d=v(a[0])
if(n&&!l?.length)throw`No trigger: ${i}.`
if(f&&(r=globalThis[f]||MfFn?.get(f),r||console.warn(`"${f}" not registered: ${i}`),!n&&u.length>1||n&&d.length>1))throw`Multiple sources: ${i}`
let p=u.map((t=>{let[e,...n]=t.split(/[\.\[\]\?]{1,}/g)
return{name:e,path:n.map((t=>isNaN(parseInt(t))?t:parseInt(t))).filter((t=>t))}}))
l?.length||(l=[""])
for(let n of l)if(e.match(/bind|sync/)){d?.length||(d=[""])
for(let o=0;o<d.length;o++)if(e==`${h}bind`){let e=()=>{s((()=>{let e=r?.(...p.map((t=>b(c(t.name)?.value,t.path))),t)??b(c(p[0].name||"")?.value,p[0].path)
void 0!==e&&(t[d[o]]=e),t.dispatchEvent(new CustomEvent(n))}))}
for(let n of p)c(n.name)?.sub(e,t.id)}else if(e==`${h}sync`){if(p.length>1)throw`Only one store supported: ${i}`
let e=()=>{let e=d[o].trim(),n=t[e]??t.getAttribute(e)??t.dataset[e]??void 0
r&&(n=r?.(n,t))
let i=c(p[0]?.name)
void 0!==n&&i?.update?.((t=>p[0]?.path?.length?b(t,p[0]?.path,n):n))}
"$mount"==n?e():t.addEventListener(n,e)}}else{if(d.length>1||u.length>1)throw`Multiple sources: ${i}`
$(t,n,g,e.replace(h,""),d[0],u[0])}}))}}}(t)}}
exports.Mfld=M
