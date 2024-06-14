let e="mf_",t=/[\.\[\]\?]{1,}/g,i=/, {0,}/g,n=()=>`${Date.now()}.${Math.floor(1e5*Math.random())}`,o=window,r=(e,t)=>{let i=t.dataset?.override||"",n=e.profiles?.[i]||{}
return{...e,...n}},s=n=>{"string"!=typeof n&&((n=n?.el?.dataset?.[n?.datakey]||"")||null==n?.el?.dataset?.[`${e}else`]||(n="return true"))
let[r,s]=n?.split("=>")?.map((e=>e.trim()))?.reverse()||["",""],[l,a]=r?.split(/\s{1,}as\s{1,}/)||[r,"value"],f=a?.split?.(i)?.map?.((e=>e.trim()))||["value"],u=s?.split(",")?.map((e=>e.replace(/[()]/g,"").trim()))||[],c=o[l]||o.MFLD.fn[l]
if(!c){u?.length||l.includes("=>")||(l.match(/\(|\)/)?u=l.match(/\([^\)]{1,}\)/)?.[0]?.replace(/[\(\) ]/g,"").split(",").filter((e=>!e.match(/[\"\'\`]/)))||[]:(u=[l],l=`return ${l}`)),u=("string"==typeof u?u.split(/\s*,\s*/)||[]:u).map((e=>e.split(t)[0]))||[],l.match(/^\s{0,}\{/)||l.includes("return")||(l=l.replace(/^\s{0,}/,"return "))
try{c=new Function(...u,l)}catch(e){console.error(e)}}return{paramList:u,func:c,as:f}},l=[],a=0,f=[],u=e=>{l.push(e),a||(a=requestAnimationFrame(p))},c=(e,t,i,n)=>{if(!(n.trans?.smart??1))return
let{paddingTop:o,paddingBottom:r}=t instanceof Element?getComputedStyle(t):{paddingTop:0,paddingBottom:0},s=document.createElement("div")
s.style.height=`calc(${Math.abs(i-(e?.clientHeight||0))}px - ${o} - ${r})`,t?.after(s)},d=(e,t)=>{if(!t.trans?.smart??1)return
let i=(t?.trans?.dur?.[0]||t?.trans?.dur||600)/2
u((()=>{e?.animate?.([{height:""},{height:`${e.clientHeight||0}px`}],i)}))},p=()=>{a=0
for(let e of l){if("function"==typeof e){e()
continue}let t=e.out?e.out.clientHeight:0,i="inner"==e.relation
if("prepend"==e.relation)c?.(e.in,e.out,t,e.ops),h(e.in,"in",e.ops,(()=>{e.out?.prepend(e.in),d?.(e.in,e.ops)}))
else{if(["inner","outer"].includes(e.relation)){let t=e.out?.cloneNode(!0)
t&&(e.out?.after(t),i&&(t.style.border="none",e.out.replaceChildren()),h(t,"out",e.ops,void 0,e.out,i))}c?.(e.in,e.out,t,e.ops),h(e.in,"in",e.ops,(()=>{"outer"==e.relation?e.out?.replaceWith(e.in):e.out?.appendChild(e.in),d?.(e.in,e.ops)}))}e.done?.(e.in)}f.forEach((e=>e())),f=[],l=[]},h=(t,i,n,o,r,s=!1)=>{if(t?.nodeType==Node.TEXT_NODE&&(t.replaceWith(document?.createElement("div")),t.textContent=t.textContent),t){const l=Array.isArray(n.trans?.dur)?n.trans?.dur["in"==i?0:1]||n.trans?.dur[0]:n.trans?.dur||0,a=n?.trans?.class||`${e}trans`
if(t?.classList?.add(a),n.trans?.hooks?.[`${i}-start`]?.(t),"out"==i){if(!(r=r||t))return
let e={};(n.trans?.smart??1)&&!s&&(e=m(r)),u((()=>{(n.trans?.smart??1)&&s&&r&&(e=m(r)),(n.trans?.smart??1)&&(t.style.position="fixed",t.style.width=e.w,t.style.left=e.left,t.style.top=e.top,t.style.margin="0"),l&&(t.style.transitionDuration=`${l}ms`),t.classList?.add("out")}))}else t?.classList?.add("in"),l&&(t.style.transitionDuration=`${l}ms`),o?.(),setTimeout((()=>{u((()=>{setTimeout((()=>u((()=>t?.classList?.remove(i)))),0)}))}),n.trans?.swap||0)
setTimeout((()=>{u((()=>{"out"==i&&t?.remove(),t?.classList?.remove(a),n.trans?.hooks?.[`${i}-end`]?.(t)}))}),l+("in"==i&&n.trans?.swap||0))}},m=e=>{let t=getComputedStyle(e),i=e.getBoundingClientRect()
return{w:`calc(${e.clientWidth}px - ${t.paddingLeft} - ${t.paddingRight})`,left:`calc(${i.left}px + ${o.scrollX}px)`,top:`calc(${i.top}px + ${o.scrollY}px)`}},$=e=>{if(!e)return 0
if("number"==typeof e||!0===e)return e
if(e instanceof Map||e instanceof Set)return $(Array.from(e.entries()||e))
let t=0
for(let i of(new TextEncoder).encode(e?.toString()||""))t=(t<<5)-t+i
return t}
o.MFLD||(o.MFLD={st:new Map,fn:{},mut:new Map})
class g{t=void 0
i=new Map
o=void 0
l=new Set
u=new Set
p
h
constructor(e,t){return this.m(e,t)}m(e,t){if(this.name=e,this.p=t?.scope||document.currentScript||"global",o.MFLD.st.set(e,this),this.p instanceof Element){let e=o.MFLD.mut.get(this.p)||{toRemove:new Set,observer:null}
e.observer||(e.observer=new MutationObserver((t=>{for(let i of t)if("childList"==i.type)for(let t of i.removedNodes)if(t instanceof Element)for(let i of e.toRemove)if(i.p==t){let t=this.p
v(i),e.observer?.disconnect(),e.toRemove.delete(i),MFLD.mut.delete(t)}})),e.observer.observe(this.p?.parentElement,{childList:!0})),e.toRemove.add(this),MFLD.mut.set(this.p,e)}return t?.upstream?.map((e=>{let t=y(e)
return this.l.add(t),t.u.add(this),t})),this.value=t?.value,this.t=t?.updater,this.$(),this}sub(e,t,i=!0){this.i.set(t||n(),e),i&&e?.(this.value)}async update(e){return new Promise((async t=>{this.h&&clearTimeout(this.h),this.h=setTimeout((()=>{u((async()=>{let i="function"==typeof e?(await e)?.(this.value):e,n=$(i)
if(n!==this.o){this.value=i,this.o=n
for(let e of this.u)await e.$()
for(let[e,t]of this?.i||[])t?.(this.value,e)
t(this.value)}else t(this.value)}))}),0)}))}async $(){let e=await(this.t?.(Array.from(this.l)?.map((e=>e?.value))||[],this?.value))
await this.update(void 0===e?this.value:e)}}let y=(e,t)=>{let i=o.MFLD.st.get(e)
return t?i?i.m(e,t):new g(e,t):i||new g(e,t)},v=e=>{MFLD.st.delete(e.name),e=void 0},w=(t,i,n,o,r,l,a)=>{let f=async i=>{i?.preventDefault(),i?.stopPropagation(),r||(r=(i?.target)?.method||"get"),n?.fetch?.externals?.find((e=>o?.startsWith(e.domain)))||!o.match(/^https?:\/\//)||o.includes(location.origin)
let f=a?.(...l||[])||l,c=Array.isArray(f)?f[0]:"$form"==f?new FormData(t):f
if(a){let e=Array.isArray(f)?f?.map((e=>y(e).value))||[]:[c]
c=a?.(...e)}let d=await fetch(o,{...n?.fetch?.request||{},headers:{...n?.fetch?.request?.headers,MFLD:"true"},method:r,body:"$form"==f||"string"==typeof c?c:JSON.stringify(c)}).catch((e=>{n?.fetch?.err?.(e)})),p=d?.status
if(p&&0==n?.fetch?.onCode?.(p,d))return
let h=await(d?.[n?.fetch?.resType||"text"]())
for(let i of["append","prepend","inner","outer"]){let o=t.dataset[`${e}${i}`]
if(void 0===o)continue
let[r,s]=o?.split("->").map((e=>e.trim()))||[],l=(new DOMParser)?.parseFromString?.(h,"text/html")
l&&u({in:l.querySelector(r||"body"),out:s?document.querySelector(s):t,relation:i,ops:n,done:e=>{_(e)}})}void 0!==t.dataset?.[`${e}pushstate`]&&history.pushState({},"",o)
let m=t.dataset?.[`${e}resolve`],$=s(m||"")?.func
$?.(h)}
"$mount"==i?f():t.addEventListener(i,f)}
function b(e,t,i,n=!1){let o=n?"previousElementSibling":"nextElementSibling"
return t?.(e)?e:b((i?.(e)||e)?.[o],t,i,n)}let M=(e=[],t)=>y(n(),{upstream:[...e],updater:e=>{try{return t?.func?.(...e)??e[0]}catch(e){return}},scope:t?.observeEl}),T=(e,t,i,n,r,s)=>{if(r.match("bind"))M(t,{observeEl:e,func:()=>{let r=s?.(...t.map((e=>o.MFLD.st.get(e)?.value||o?.[r]||[])),e)
if(i&&null!=r){let[t,n]=i.split(":")
"style"==t?e.style[n]=r:"attr"==t?e.setAttribute(n,r):e[i]=r}return e.dispatchEvent(new CustomEvent(n)),r}})
else{let o=()=>{t.length>1&&console.warn("Multiple sync props",e)
let[n,o]=t?.[0].trim().split(":"),r="style"==n?e.style[o]:"attr"==n?e.getAttribute(o):e[n],l=parseFloat(r)
isNaN(l)||(r=l)
let a=s?.(r,e)
i&&void 0!==a&&y(i)?.update?.(a)}
"$mount"==n?o():e.addEventListener(n,o)}},x=(t,i,n,o,r,l)=>{let a,f,c=document.createElement("template"),d=(e=>{let t="TEMPLATE"
if(e.tagName==t)return e
let i=document.createElement(t)
return i.content.appendChild(e.cloneNode(!0)),e.replaceWith(i),i})(t.cloneNode(!0)),p=i.match(/if|else/),m=i.match(/(else|elseif)(\s|$)/),$=[]
if(c.classList.add(`${i}-start`),d.classList.add(`${i}-end`),t.before(c),t.after(d),t.remove(),p){if(m){let t=b(c,(t=>t?.classList?.contains(`${e}if-end`)),null,!0)
b(t,(e=>e==d),(t=>{t?.dataset?.[`${e}cstore`]&&$.push(t?.dataset?.[`${e}cstore`])})),r=r&&"else"!=m[0]?[...r,...$]:$}f=(...e)=>{if(m)for(let t of e.slice(-$.length))if(1==t)return!1
return"else"==m?.[0]||1==o?.(...e)}}a=M(r,{func:p?f:o,observeEl:d}),p&&(d.dataset[`${e}cstore`]=a.name),a.sub((e=>{void 0!==e&&u((()=>{b(c?.nextElementSibling,(e=>e?.classList?.contains(`${i}-end`)),(e=>h(e,"out",l,(()=>e?.remove())))),p&&!e||((e,t)=>{if(e instanceof Map)for(const[i,n]of e.entries())t(i,n)
else try{let i=Array.from(e||[])
if(i?.length)i.forEach(t)
else for(let i in e)t(i,e[i])}catch(t){console.error(`${e} is not iterable`)}})(i.match(/each/)?e:[e],((e,t)=>{let i=d.cloneNode(!0)
if(!p){let o=new RegExp("\\$:{([^}]*)}","g"),r=d?.innerHTML?.replace(o,((i,o)=>s(`(${n.join(",")})=> ${o}`)?.func?.(e,t)||""))||""
i?.innerHTML&&(i.innerHTML=r)}for(let t of i.content.children)t?.innerHTML||(t.innerHTML=e),d.before(t),h(t,"in",l,(()=>_(t)))}))}))}))},E={},S=["bind","sync","templ","if","elseif","else","each","get","head","post","put","delete","patch"].map((t=>`${e}${t}`))
o.addEventListener("popstate",(e=>{}))
let _=t=>{if(t&&t.nodeType==Node.TEXT_NODE)return
let n=(t||document.body).querySelectorAll(`[data-${S.join("],[data-")}],a,form`)||[]
for(let t of n){let n=r(E,t)
if(void 0!==t.dataset?.[`${e}promote`]){let[e,i,o,r]="A"==t.tagName?["get",t.href,[],"click"]:[t.method.toLowerCase(),t.action,"$form","submit"]
if(i){w(t,r,n,i,e,o)
continue}}for(let o in t.dataset){if(!S.includes(o))continue
let r=!o.match(/bind|templ|if|else|each/)
for(let l of t.dataset?.[o]?.split(";;")||[]){let[a,f]=l?.split("->")?.map((e=>e.trim()))||[],u=r&&a.slice(0,a.indexOf(")"))?.match(/[^\(\)]{1,}/g)?.pop()?.split(i)?.map((e=>e.trim()))||[]
!f&&o.match(/get|head|post|put|delete|patch/)&&(f=a.slice(a.indexOf(")")+1),a="")
let c=r?a?.slice(a.indexOf(")")+1):a
if(r&&!u?.length){console.error("No trigger",t)
break}let{func:d,paramList:p,as:h}=s(c)
if(c&&!d&&console.warn(`"${c}" not registered`,t),o.match(/each|templ|if|else/))x(t,o,h||[],d,p||[],n)
else{u?.length||(u=[""])
for(let i of u)o.match(/bind|sync/)?T(t,p,f,i,o,d):w(t,i,n,f,o.replace(e,""),p,d)}}}}},A={store:
/**!
* - Create or overwrite a _typed_ global Manifold store by passing `store_ops` (`MfldOps`) -> *returns `Store\<T\>`* 
* - Retrieve an untyped reference to the store specified by name by omitting `store_ops` -> *returns `Store\<any\>`*
* @template T
* @param {string} store_name
* @param {StoreOptions<T> | T} store_ops
* @return {Store<T>}
*/
(store_name,store_ops)=>(store_ops?.hasOwnProperty("value")||store_ops?.hasOwnProperty("updater")||(store_ops={value:store_ops}),y(store_name,store_ops)),ustore:
/**!
* - Create or overwrite an untyped global Manifold store by passing `store_ops` (`MfldOps`) -> *returns `Store\<any\>`* 
* - Retrieve an untyped reference to the store specified by name by omitting `store_ops` -> *returns `Store\<any\>`*
* @param {string} store_name
* @param {StoreOptions<any> | any} store_ops
* @return {Store<any>}
*/
(store_name,store_ops)=>y(store_name,store_ops),get:
/**!
 * - Retrieve a Manifold store by name. *returns `Store\<any\>`*
 * @param {string} store_name
 * @return {Store<any>}
 */
store_name=>y(store_name),func:
/**!
 * - Retrieve a Manifold function by name. *val* refers to the store's current value; *el* refers to the element that triggered the update (if applicable). *returns `MfldFunc`*
 * - *Note:* Functions retrived using this method cannot infer the type of the store's value and is therefore **not** type-checked. It is preferable to keep a reference to the function if you need to preserve type information.
 * @param {string} func_name
 * @return {MfldFunc}
 */
func_name=>o.MFLD.fn[func_name],funcs:
/**!
 * - Add functions to the Manifold function registry in key-value pairs.
 * - Functions must be registered in order to be accessible to HTML elements via `mfBind`, `mfSync`, and `mfResolve`. 
 * - It may still be beneficial to keep a reference to the original function if you need to preserve type information.
 * @param {{ [key: string]: MfldFunc }} funcs
 */
funcs=>{for(let e in funcs)o.MFLD.fn[e]=funcs[e]},config:
/**!
 * - Set Manifold configuration options, including `trans` (DOM transition settings), `fetch` (fetch options), and `profiles` (configuration option overrides that can be set on elements ad-hoc via `mfOverrides`).
 * - Providing the optional `profileName` parameter allows you to save the configuration as a named profile. Otherwise, the profile is saved as the default configuration.
 * @param {MfldOps} new_ops
 * @param {string} [profile_name]
 */
(new_ops,profile_name)=>{return e=new_ops,void((t=profile_name)?E.profiles={...E.profiles,[t]:e}:E={...E,...e})
var e,t},onTick:
/**!
  * - Wait for the next Manifold data update cycle to complete before executing the callback function.
  * @param {()=> void} cb
  */
e=>{var t;(t=e)&&f.push(t)},register:
/**!
 * - Register Manifold subscriptions on the DOM. *Optional:* Pass an `HTMLElement` or selector string to scope the registration to a specific element.
 * @param {HTMLElement | string | null} [parent]
 */
e=>{"string"==typeof e&&(e=document.querySelector(e)),_(e)}}

;/**! @typedef {"in-start"|"in-end"|"out-start"|"out-end"} HookKey*/
/**!
 * @typedef {object} ExternalOptions
 * @property {string} domain - The domain name these settings apply to
 * @property {boolean} [scripts] - Allow scripts from this domain to execute
 * @property {boolean} [styles] - Allow styles from this domain to apply
 */
/**!
 * @typedef {object} FetchOptions
 * @property {RequestInit} [request] - Fetch request options
 * @property {"json"|"text"} [resType] - Response type (default: "text")
 * @property {(err: Error)=> void} [err] - Error callback - run on fetch error
 * @property {(code: number, data: void | Response)=> boolean | void} [onCode] - Callback function - run on fetch response code; return `false` to prevent further processing
 * @property {ExternalOptions[]} [externals] - External domain fetch settings
 */
/**!
 * @typedef {object} TransitionOptions
 * @property {string} [class] - CSS class applied to transitions (default: `mfTrans`)
 * @property {[number, number] | number} [dur] - Transition duration: [in, out] or single value (in ms); default: 300
 * @property {number} [swap] - Swap delay (in ms) - applied between one element's outro start and the replacement's intro start; default: 0
 * @property {boolean} [smart] - Enable smart transitions (default: true)
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
 * @callback ValueDeterminer
 * @param {T} [currentValue]
 * @returns {T | Promise<T> | undefined}
 */
/**!
 * @template T
 * @callback UpdateFunction
 * @param {T | ValueDeterminer<T>} value
 * @returns {T | Promise<T> | undefined}
 */
/**!
 * @template T
 * @callback SubDeterminer
 * @param {T} value
 * @returns {void}
 */
/**!
 * @template T
 * @callback SubFunction
 * @param {SubDeterminer<T>} value The store's current value
 * @returns void
 */
/**!
 * @template T
 * @typedef {Object} StoreOptions
 * @property {T} [value]
 * @property {Array<string>} [upstream]
 * @property {UpdaterFunction<T>} [updater]
 * @property {HTMLElement | SVGScriptElement | "global"} [scope]
 */
/**!
 * @template T
 * @typedef Store
 * @prop {T} value - The store's current value (read only)
 * @prop {UpdateFunction<T>} update - Update the store's current value
 * @prop {SubFunction<T>} sub - Add a subscription function to the store
 */
/**!
 * @typedef {Function} MfldFunc
 * @param {any} val
 * @param {HTMLElement} [el]
 */
/**!
 * The global Manifold interface.
 */globalThis.Mfld||(globalThis.Mfld=A)
//# sourceMappingURL=dev.global.mfld.js.map
