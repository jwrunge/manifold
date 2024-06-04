let t,e=[],n=!1,i=[],o="",r=globalThis?.requestAnimationFrame||(t=>setTimeout(t,0))
function s(t){e.push(t),n||(n=!0,r(a))}function l(e,n,i,r=!1){t=document.createElement("div")
let{paddingTop:s,paddingBottom:l}=n instanceof Element?window.getComputedStyle(n):{paddingTop:0,paddingBottom:0}
o=t.style.height=`calc(${Math.abs(i-(e?.clientHeight||0))}px - ${s} - ${l})`,n?.after(t)}function f(e,n){let i=(n?.trans?.dur?.[0]||n?.trans?.dur||600)/2
s((()=>{t?.remove(),e?.animate?.([{height:o},{height:`${e.clientHeight||0}px`}],i)}))}function a(){n=!1
for(let t of e)if("function"==typeof t)t()
else{let e=t.out?t.out.clientHeight:0
if("prepend"==t.relation)l?.(t.in,t.out,e),u(t.in,"in",t.ops,(()=>{t.in&&t.out?.prepend(t.in),f?.(t.in,t.ops)}))
else{if(["swapinner","swapouter"].includes(t.relation)){let e=t.out?.cloneNode(!0)
t.out?.after(e)
let n="swapinner"==t.relation
"swapinner"==t.relation&&(e.style.border="none",t.out.replaceChildren()),u(e,"out",t.ops,void 0,t.out,n)}l?.(t.in,t.out,e),u(t.in,"in",t.ops,(()=>{t.in&&("swapouter"==t.relation?t.out?.replaceWith(t.in):t.out?.appendChild(t.in)),f?.(t.in,t.ops)}))}t.done?.(t.in)}i.forEach((t=>t())),i=[],e=[]}function u(t,e,n,i,o,r=!1){if(t?.nodeType==Node.TEXT_NODE){let e=t.textContent,n=document?.createElement("div")
n.textContent=e,t.replaceWith(n),t=n}if(t){let l=Array.isArray(n.trans?.dur)?n.trans?.dur["in"==e?0:1]||n.trans?.dur[0]:n.trans?.dur||0,f=n?.trans?.class||"mf-trans"
if(t?.classList?.add(f),n.trans?.hooks?.[`${e}-start`]?.(t),"out"==e){if(o||(o=t),!o)return
let e={}
if(0==r){let t=getComputedStyle(o)
e.w=`calc(${o.clientWidth}px - ${t.paddingLeft} - ${t.paddingRight})`,e.left=`calc(${o.getBoundingClientRect().left}px + ${window.scrollX}px)`,e.top=`calc(${o.getBoundingClientRect().top}px + ${window.scrollY}px)`}s((()=>{if(r&&o){let t=getComputedStyle(o)
e.w=`calc(${o.clientWidth}px - ${t.paddingLeft} - ${t.paddingRight})`,e.left=`calc(${o.getBoundingClientRect().left}px + ${window.scrollX}px)`,e.top=`calc(${o.getBoundingClientRect().top}px + ${window.scrollY}px)`}t.style.position="fixed",t.style.width=e.w,t.style.left=e.left,t.style.top=e.top,t.style.margin="0",l&&(t.style.transitionDuration=`${l}ms`),t.classList?.add("out")}))}else t?.classList?.add("in"),l&&(t.style.transitionDuration=`${l}ms`),i?.(),setTimeout((()=>{s((()=>{setTimeout((()=>s((()=>t?.classList?.remove(e)))),0)}))}),n.trans?.swap||0)
setTimeout((()=>{s((()=>{"out"==e&&t?.remove(),t?.classList?.remove(f),n.trans?.hooks?.[`${e}-end`]?.(t)}))}),l+("in"==e&&n.trans?.swap||0))}}function c(t){if(!t)return 0
if("number"==typeof t)return t
if(!0===t)return 1
if(t instanceof Map)return c(Array.from(t.entries()))
if(t instanceof Set)return c(Array.from(t))
let e=0
for(let n of(new TextEncoder).encode("string"==typeof t?t:t?.toString()||""))e=(e<<5)-e+n
return e}globalThis.MfSt||(globalThis.MfSt=new Map),globalThis.MfFn||(globalThis.MfFn=new Map)
class p{t=void 0
i=new Map
o=void 0
l
u=new Set
constructor(t,e){return this.p(t,e)}p(t,e){return this.name=t,MfSt.set(t,this),this.l=new Set(e?.upstream?.map((t=>d(t)))||[]),this.l.forEach((t=>t?.u?.add(this))),this.value=e?.value,this.t=e?.updater,this}sub(t,e,n=!0){this.i.set(e||String(Date.now()+Math.random()),t),n&&t?.(this.value)}async update(t){return new Promise((async e=>{let n="function"==typeof t?(await t)?.(this.value):t,i=c(n)
if(i!==this.o){this.value=n,this.o=i
for(let t of this.u)await t.h()
s((()=>{for(let[t,e]of this?.i||[])e?.(this.value,t)
e(this.value)}))}else e(this.value)}))}async h(){let t=await(this.t?.(Array.from(this.l)?.map((t=>t?.value))||[],this?.value))
await this.update(void 0===t?this.value:t)}}function d(t,e){let n=MfSt.get(t)
return e?n?n.p(t,e):new p(t,e):n||new p(t,e)}globalThis.DOMParser&&new DOMParser
let h="mf"
function $(t,e,n){let i=t
for(let t of e)null==i&&(i="number"==typeof t?[]:{}),null==n||e[e.length-1]!==t?i=i instanceof Map?i?.get(t):i?.[t]:i instanceof Map?i.set(t,n):i[t]=n
return i}function w(t,e,n,i,o,r){let l=async e=>{e?.preventDefault(),e?.stopPropagation()
let l=t.dataset[`${h}overrides`]||"{}",f=n.profiles?.[l]?.fetch||JSON.parse(l),a=f?{...n,...f}:n
r||(r="string"==typeof o?structuredClone(o):(e?.target)?.href,o=a?.fetch?.request?.body),i||(i=(e?.target)?.method||"get"),a?.fetch?.externals?.find((t=>r?.startsWith(t.domain)))||!r.match(/^https?:\/\//)||r.includes(location.origin)
let u=await fetch(r,{...a?.fetch?.request||{},method:i,body:"string"==typeof o?o:JSON.stringify(o)}).catch((t=>{a?.fetch?.err?.(t)})),c=u?.status
if(c&&0==a?.fetch?.onCode?.(c,u))return
let p=await(u?.[a?.fetch?.type||"text"]())
a?.fetch?.cb?.(p)
for(let e of["append","prepend","swapinner","swapouter"]){let n=t.dataset[`${h}${e}`]
if(void 0===n)continue
let[i,o]=n?.split("->").map((t=>t.trim()))||[],r=(new DOMParser)?.parseFromString?.(p,"text/html")
r&&s({in:r.querySelector(i||"body"),out:o?document.querySelector(o):t,relation:e,ops:a,done:()=>!0})}t.dataset?.[`${h}resolve`]&&alert("RESOLVING")}
"$mount"==e?l():t.addEventListener(e,l)}function m(t,e,n,i,o,r,l){e?.length||(e=[""])
for(let f=0;f<e.length;f++)if(o==`${h}bind`){let o=()=>{s((()=>{let o=r?.(...n.map((t=>$(d(t.name)?.value,t.path))),t)??$(d(n[0].name||"")?.value,n[0].path)
void 0!==o&&(t[e[f]]=o),t.dispatchEvent(new CustomEvent(i))}))}
for(let e of n)d(e.name)?.sub(o,t.id)}else if(o==`${h}sync`){if(n.length>1)throw`Only one store supported: ${l}`
let o=()=>{let i=e[f].trim(),o=t[i]??t.getAttribute(i)??t.dataset[i]??void 0
r&&(o=r?.(o,t))
let s=d(n[0]?.name)
void 0!==o&&s?.update?.((t=>n[0]?.path?.length?$(t,n[0]?.path,o):o))}
"$mount"==i?o():t.addEventListener(i,o)}}function g(t,e){let n=t?.dataset?.[e],i=n
if(n||void 0===t?.dataset?.[`${h}else`]||(n="return true",i=`ELSE:${t?.dataset?.[e]||""}`),!n)return{}
let[o,r]=n?.split("=>")?.map((t=>t.trim()))||["",""]
r||(r=o.slice(),o="")
let s=o?.split(",")?.map((t=>t.replace(/[()]/g,"").trim()))
return{storeList:s,execFunc:globalThis[r]||MfFn?.get(r)||new Function(...s,r),storeName:i}}function y(t,e,n){if(e==`${h}if`){let i=document.createElement("div")
i.classList.add("mfld-active-condition"),t.before(i)
let o=t,r=[]
for(;o&&o;){let{storeList:t,execFunc:l,storeName:f}=g(o,r.length?`${h}elseif`:e)
if(!t&&!l)break
if("TEMPLATE"!=o.tagName){let t=document.createElement("template")
t.innerHTML=o.innerHTML
for(let e of o.attributes)t.setAttribute(e.name,e.value)
o.replaceWith(t),o=t,i.innerHTML=o.innerHTML}let a=r.length,u=d(f||"",{upstream:[...t,...r],updater:t=>{if(a)for(let e of t.slice(-a)||[])if(e)return!1
return l(...t.slice(0,-1))}})
r.push(u.name)
let c=o.cloneNode(!0)
u?.sub((t=>{if(!t)return
let e=document.createElement("div")
e.innerHTML=c.innerHTML,"TEMPLATE"==c?.tagName&&s({in:e,out:i,relation:"swapinner",ops:n,done:t=>!0})})),o=o?.nextElementSibling}}else alert("Not set up for loops yet")}let v={},M=/, {0,}/g,T=0,b=["bind","sync","if","get","head","post","put","delete","patch"].map((t=>`${h}${t}`))
function x(t){if(t?.includes("(")){let e=t.match(/[^\(\)]{1,}/g)
t=e?.[e.length-1]||""}return t?.split(M)?.map((t=>t.trim()))||[]}
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
(store_name,store_ops)=>(store_ops?.hasOwnProperty("value")||store_ops?.hasOwnProperty("updater")||(store_ops={value:store_ops}),d(store_name,store_ops)),ustore:
/**!
* - Create or overwrite an untyped global Manifold store by passing `store_ops` (`MfldOps`) -> *returns `Store\<any\>`* 
* - Retrieve an untyped reference to the store specified by name by omitting `store_ops` -> *returns `Store\<any\>`*
* @param {string} store_name
* @param {StoreOptions<any> | any} store_ops
* @return {Store<any>}
*/
(store_name,store_ops)=>d(store_name,store_ops),get:
/**!
 * - Retrieve a Manifold store by name. *returns `Store\<any\>`*
 * @param {string} store_name
 * @return {Store<any>}
 */
store_name=>d(store_name),func:
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
(new_ops,profile_name)=>{return t=new_ops,void((e=profile_name)?v.profiles={...v.profiles,[e]:t}:v={...v,...t})

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
t=>{"string"==typeof t&&(t=document.querySelector(t)),function(t){let e=(t||document.body).querySelectorAll(`[data-${b.join("],[data-")}]${0!=v.fetch?.auto?",a":""}`)||[]
for(let t of e){t.id||(t.id=""+T++)
for(let e in t.dataset){if([`${h}if`,`${h}each`].includes(e)){y(t,e,v)
continue}if(!b.includes(e))continue
let n=![`${h}bind`].includes(e),i=`(#${t.id} on ${e})`
t.dataset?.[e]?.split(";").forEach((o=>{let r,s=o?.split(/(?:(?:\)|->) ?){1,}/g)||[],l=n?x(s.splice(0,1)[0]):[],f=s[0]?.includes("(")&&s[0]?.match(/^[^\(]{1,}/)?.[0]||"",a=x(s.splice(e==`${h}sync`?1:0,1)[0]),u=x(s[0])
if(n&&!l?.length)throw`No trigger: ${i}.`
if(f&&(r=globalThis[f]||MfFn?.get(f),r||console.warn(`"${f}" not registered: ${i}`),!n&&a.length>1||n&&u.length>1))throw`Multiple sources: ${i}`
let c=a.map((t=>{let[e,...n]=t.split(/[\.\[\]\?]{1,}/g)
return{name:e,path:n.map((t=>isNaN(parseInt(t))?t:parseInt(t))).filter((t=>t))}}))
l?.length||(l=[""])
for(let n of l)if(e.match(/bind|sync/))m(t,u,c,n,e,r,i)
else{if(u.length>1||a.length>1)throw`Multiple sources: ${i}`
w(t,n,v,e.replace(h,""),u[0],a[0])}}))}}}(t)}}
export{S as Mfld}
//# sourceMappingURL=mfld.mod.js.map
