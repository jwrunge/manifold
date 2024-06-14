let e="mf_",t=/[\.\[\]\?]{1,}/g,o=/, {0,}/g,n=()=>`${Date.now()}.${Math.floor(1e5*Math.random())}`,i=window,r=(t,o)=>{let n=t.profiles?.[o.dataset?.override||""],i={...t,...n}
for(let t in o.dataset){console.log("SET",t)
for(let n of["fetch","trans"])if(t.startsWith(`${e}${n}_`)){console.log("MATCH",`${e}${n}_`)
try{let e=t.split("_")[1],r=o.dataset[t]
r?.match(/\{\[/)&&(r=JSON.parse(r)),parseInt(r)&&(r=parseInt(r)),i[n][e]=r,console.log("Got ",n,e,r)}catch(e){console.error(e)}}}return console.log(i),i},s=n=>{"string"!=typeof n&&((n=n?.el?.dataset?.[n?.datakey]||"")||null==n?.el?.dataset?.[`${e}else`]||(n="return true"))
let[r,s]=n?.split("=>")?.map((e=>e.trim()))?.reverse()||["",""],[l,a]=r?.split(/\s{1,}as\s{1,}/)||[r,"value"],f=a?.split?.(o)?.map?.((e=>e.trim()))||["value"],u=s?.split(",")?.map((e=>e.replace(/[()]/g,"").trim()))||[],c=i[l]||i.MFLD.fn[l]
if(!c){u?.length||l.includes("=>")||(l.match(/\(|\)/)?u=l.match(/\([^\)]{1,}\)/)?.[0]?.replace(/[\(\) ]/g,"").split(",").filter((e=>!e.match(/[\"\'\`]/)))||[]:(u=[l],l=`return ${l}`)),u=("string"==typeof u?u.split(/\s*,\s*/)||[]:u).map((e=>e.split(t)[0]))||[],l.match(/^\s{0,}\{/)||l.includes("return")||(l=l.replace(/^\s{0,}/,"return "))
try{c=new Function(...u,l)}catch(e){console.error(e)}}return{paramList:u,func:c,as:f}}
function l(t,o,n){o?.preventDefault()
let i=t.dataset?.[`${e}pushstate`],r=n
switch(i){case"":break
case void 0:return
default:r=`#${i}`}history.pushState(null,"",r)}let a=[],f=0,u=[],c=e=>{a.push(e),f||(f=requestAnimationFrame(h))},d=(e,t,o,n)=>{if(!(n.trans?.smart??1))return
let{paddingTop:i,paddingBottom:r}=t instanceof Element?getComputedStyle(t):{paddingTop:0,paddingBottom:0},s=document.createElement("div")
s.style.height=`calc(${Math.abs(o-(e?.clientHeight||0))}px - ${i} - ${r})`,t?.after(s)},p=(e,t)=>{if(!t.trans?.smart??1)return
let o=(t?.trans?.dur?.[0]||t?.trans?.dur||600)/2
c((()=>{e?.animate?.([{height:""},{height:`${e.clientHeight||0}px`}],o)}))},h=()=>{f=0
for(let e of a){if("function"==typeof e){e()
continue}let t=e.out?e.out.clientHeight:0,o="inner"==e.relation
if("prepend"==e.relation)d?.(e.in,e.out,t,e.ops),m(e.in,"in",e.ops,(()=>{e.out?.prepend(e.in),p?.(e.in,e.ops)}))
else{if(["inner","outer"].includes(e.relation)){let t=e.out?.cloneNode(!0)
t&&(e.out?.after(t),o&&(t.style.border="none",e.out.replaceChildren()),m(t,"out",e.ops,void 0,e.out,o))}d?.(e.in,e.out,t,e.ops),m(e.in,"in",e.ops,(()=>{"outer"==e.relation?e.out?.replaceWith(e.in):e.out?.appendChild(e.in),p?.(e.in,e.ops)}))}e.done?.(e.in)}u.forEach((e=>e())),u=[],a=[]},m=(t,o,n,i,r,s=!1,l)=>{if(t?.nodeType==Node.TEXT_NODE&&(t.replaceWith(document?.createElement("div")),t.textContent=t.textContent),t){const a=Array.isArray(n.trans?.dur)?n.trans?.dur["in"==o?0:1]||n.trans?.dur[0]:n.trans?.dur||0,f=n?.trans?.class||`${e}trans`
if(t?.classList?.add(f),n.trans?.hooks?.[`${o}-start`]?.(t),"out"==o){if(!(r=r||t))return
let e={};(n.trans?.smart??1)&&!s&&(e=$(r)),c((()=>{(n.trans?.smart??1)&&s&&r&&(e=$(r)),(n.trans?.smart??1)&&(t.style.position="fixed",t.style.width=e.w,t.style.left=e.left,t.style.top=e.top,t.style.margin="0"),a&&(t.style.transitionDuration=`${a}ms`),t.classList?.add("out")}))}else t?.classList?.add("in"),a&&(t.style.transitionDuration=`${a}ms`),i?.(),setTimeout((()=>{c((()=>{setTimeout((()=>c((()=>t?.classList?.remove(o)))),0)}))}),n.trans?.swap||0)
setTimeout((()=>{c((()=>{"out"==o&&t?.remove(),t?.classList?.remove(f),n.trans?.hooks?.[`${o}-end`]?.(t),t.style.transitionDuration="",console.log("RUNNING AFTER"),"in"==o&&l?.(t)}))}),a+("in"==o&&n.trans?.swap||0))}},$=e=>{let t=getComputedStyle(e),o=e.getBoundingClientRect()
return{w:`calc(${e.clientWidth}px - ${t.paddingLeft} - ${t.paddingRight})`,left:`calc(${o.left}px + ${i.scrollX}px)`,top:`calc(${o.top}px + ${i.scrollY}px)`}},y=e=>{if(!e)return 0
if("number"==typeof e||!0===e)return e
if(e instanceof Map||e instanceof Set)return y(Array.from(e.entries()||e))
let t=0
for(let o of(new TextEncoder).encode(e?.toString()||""))t=(t<<5)-t+o
return t}
i.MFLD||(i.MFLD={st:new Map,fn:{},mut:new Map})
class g{t=void 0
o=new Map
i=void 0
l=new Set
u=new Set
p
h
constructor(e,t){return this.m(e,t)}m(e,t){if(this.name=e,this.p=t?.scope||document.currentScript||"global",i.MFLD.st.set(e,this),this.p instanceof Element){let e=i.MFLD.mut.get(this.p)||{toRemove:new Set,observer:null}
e.observer||(e.observer=new MutationObserver((t=>{for(let o of t)if("childList"==o.type)for(let t of o.removedNodes)if(t instanceof Element)for(let o of e.toRemove)if(o.p==t){let t=this.p
v(o),e.observer?.disconnect(),e.toRemove.delete(o),MFLD.mut.delete(t)}})),e.observer.observe(this.p?.parentElement,{childList:!0})),e.toRemove.add(this),MFLD.mut.set(this.p,e)}return t?.upstream?.map((e=>{let t=w(e)
return this.l.add(t),t.u.add(this),t})),this.value=t?.value,this.t=t?.updater,this.$(),this}sub(e,t,o=!0){this.o.set(t||n(),e),o&&e?.(this.value)}async update(e){return new Promise((async t=>{this.h&&clearTimeout(this.h),this.h=setTimeout((()=>{c((async()=>{let o="function"==typeof e?(await e)?.(this.value):e,n=y(o)
if(n!==this.i){this.value=o,this.i=n
for(let e of this.u)await e.$()
for(let[e,t]of this?.o||[])t?.(this.value,e)
t(this.value)}else t(this.value)}))}),0)}))}async $(){let e=await(this.t?.(Array.from(this.l)?.map((e=>e?.value))||[],this?.value))
await this.update(void 0===e?this.value:e)}}let w=(e,t)=>{let o=i.MFLD.st.get(e)
return t?o?o.m(e,t):new g(e,t):o||new g(e,t)},v=e=>{i.MFLD.st.delete(e?.name||""),e=void 0},b=(t,o,n,i,r,a,f)=>{let u=async o=>{o?.preventDefault(),o?.stopPropagation(),r||(r=(o?.target)?.method||"get")
let u=n?.fetch?.externals?.find((e=>i?.startsWith(e.domain)))||!i.match(/^https?:\/\//)||i.includes(location.origin)?{scripts:!0,styles:!0}:void 0,d=f?.(...a||[])||a,p=Array.isArray(d)?d[0]:"$form"==d?new FormData(t):d
if(f){let e=Array.isArray(d)?d?.map((e=>w(e).value))||[]:[p]
p=f?.(...e)}let h=await fetch(i,{...n?.fetch?.request||{},headers:{...n?.fetch?.request?.headers,MFLD:"true"},method:r,body:"$form"==d||"string"==typeof p?p:JSON.stringify(p)}).catch((e=>{n?.fetch?.err?.(e)})),m=h?.status
if(m&&0==n?.fetch?.onCode?.(m,h))return
let $=await(h?.[n?.fetch?.resType||"text"]())
for(let o of["append","prepend","inner","outer"]){let i=t.dataset[`${e}${o}`]
if(void 0===i)continue
let[r,s]=i?.split("->").map((e=>e.trim()))||[],l=(new DOMParser)?.parseFromString?.($,"text/html")
l&&(u?.styles||l.querySelectorAll("style").forEach((e=>e.parentNode?.removeChild(e))),u?.scripts&&l.querySelectorAll("script").forEach((e=>{let t=document.createElement("script")
t.src=e.src,document.head.appendChild(t)})),c({in:l.querySelector(r||"body"),out:s?document.querySelector(s):t,relation:o,ops:n,done:e=>{A(e)}}))}let y=t.dataset?.[`${e}resolve`],g=s(y||"")?.func
g?.($),l(t,o,i)}
"$mount"==o?u():t.addEventListener(o,u)}
function T(e,t,o,n=!1){let i=n?"previousElementSibling":"nextElementSibling"
return t?.(e)?e:T((o?.(e)||e)?.[i],t,o,n)}let E=(e=[],t)=>w(n(),{upstream:[...e],updater:e=>{try{return t?.func?.(...e)??e[0]}catch(e){return}},scope:t?.observeEl}),M=(e,t,o,n,r,s)=>{if(r.match("bind"))E(t,{observeEl:e,func:()=>{let r=s?.(...t.map((e=>i.MFLD.st.get(e)?.value||i?.[r]||[])),e)
if(o&&null!=r){let[t,n]=o.split(":")
"style"==t?e.style[n]=r:"attr"==t?e.setAttribute(n,r):e[o]=r}return e.dispatchEvent(new CustomEvent(n)),r}})
else{let i=n=>{t.length>1&&console.warn("Multiple sync props",e)
let i,[r,a]=t?.[0]?.trim().split(":")||[],f="style"==r?e.style[a]:"attr"==r?e.getAttribute(a):e[r],u=parseFloat(f)
isNaN(u)||(f=u),i=s?.(f,e),o&&void 0!==i&&w(o)?.update?.(i),l(e,n)}
"$mount"==n?i():e.addEventListener(n,i)}},S=(t,o,n,i,r,l)=>{let a,f,u=document.createElement("template"),d=(e=>{let t="TEMPLATE"
if(e.tagName==t)return e
let o=document.createElement(t)
return o.content.appendChild(e.cloneNode(!0)),e.replaceWith(o),o})(t.cloneNode(!0)),p=o.match(/if|else/),h=o.match(/(else|elseif)(\s|$)/),$=[]
if(u.classList.add(`${o}-start`),d.classList.add(`${o}-end`),t.before(u),t.after(d),t.remove(),p){if(h){let t=T(u,(t=>t?.classList?.contains(`${e}if-end`)),null,!0)
T(t,(e=>e==d),(t=>{t?.dataset?.[`${e}cstore`]&&$.push(t?.dataset?.[`${e}cstore`])})),r=r&&"else"!=h[0]?[...r,...$]:$}f=(...e)=>{if(h)for(let t of e.slice(-$.length))if(1==t)return!1
return"else"==h?.[0]||1==i?.(...e)}}a=E(r,{func:p?f:i,observeEl:d}),p&&(d.dataset[`${e}cstore`]=a.name),a.sub((e=>{void 0!==e&&c((()=>{T(u?.nextElementSibling,(e=>e?.classList?.contains(`${o}-end`)),(e=>m(e,"out",l,(()=>e?.remove())))),p&&!e||((e,t)=>{if(e instanceof Map)for(const[o,n]of e.entries())t(o,n)
else try{let o=Array.from(e||[])
if(o?.length)o.forEach(t)
else for(let o in e)t(o,e[o])}catch(t){console.error(`${e} is not iterable`)}})(o.match(/each/)?e:[e],((e,t)=>{let o=d.cloneNode(!0)
if(!p){let i=new RegExp("\\$:{([^}]*)}","g"),r=d?.innerHTML?.replace(i,((o,i)=>s(`(${n.join(",")})=> ${i}`)?.func?.(e,t)||""))||""
o?.innerHTML&&(o.innerHTML=r)}for(let t of o.content.children)t?.innerHTML||(t.innerHTML=e),d.before(t),m(t,"in",l)}))}))}))},_={},x=["bind","sync","templ","if","elseif","else","each","get","head","post","put","delete","patch"].map((t=>`${e}${t}`))
i.addEventListener("popstate",(()=>{location.reload()}))
let A=t=>{if(console.log("%cREGISTERING","color: yellow; font-weight: bold",t),t&&t.nodeType==Node.TEXT_NODE)return
let i=(t||document.body).querySelectorAll(`[data-${x.join("],[data-")}],a,form`)||[]
for(let t of i){let i=r(_,t)
if(t.id||(t.id=n()),void 0!==t.dataset?.[`${e}promote`]){let[e,o,n,r]="A"==t.tagName?["get",t.href,[],"click"]:[t.method.toLowerCase(),t.action,"$form","submit"]
if(o){b(t,r,i,o,e,n)
continue}}for(let n in t.dataset){if(!x.includes(n))continue
let r=!n.match(/bind|templ|if|else|each/)
for(let l of t.dataset?.[n]?.split(";;")||[]){let[a,f]=l?.split("->")?.map((e=>e.trim()))||[],u=r&&a.slice(0,a.indexOf(")"))?.match(/[^\(\)]{1,}/g)?.pop()?.split(o)?.map((e=>e.trim()))||[]
!f&&n.match(/get|head|post|put|delete|patch/)&&(f=a.slice(a.indexOf(")")+1),a="")
let c=r?a?.slice(a.indexOf(")")+1):a
if(r&&!u?.length){console.error("No trigger",t)
break}let{func:d,paramList:p,as:h}=s(c)
if(c&&!d&&console.warn(`"${c}" not registered`,t),n.match(/each|templ|if|else/))S(t,n,h||[],d,p||[],i)
else{u?.length||(u=[""])
for(let o of u)n.match(/bind|sync/)?M(t,p,f,o,n,d):b(t,o,i,f,n.replace(e,""),p,d)}}}}},N={store:
/**!
* - Create or overwrite a _typed_ global Manifold store by passing `store_ops` (`MfldOps`) -> *returns `Store\<T\>`* 
* - Retrieve an untyped reference to the store specified by name by omitting `store_ops` -> *returns `Store\<any\>`*
* @template T
* @param {string} store_name
* @param {StoreOptions<T> | T} store_ops
* @return {Store<T>}
*/
(store_name,store_ops)=>(store_ops?.hasOwnProperty("value")||store_ops?.hasOwnProperty("updater")||(store_ops={value:store_ops}),w(store_name,store_ops)),ustore:
/**!
* - Create or overwrite an untyped global Manifold store by passing `store_ops` (`MfldOps`) -> *returns `Store\<any\>`* 
* - Retrieve an untyped reference to the store specified by name by omitting `store_ops` -> *returns `Store\<any\>`*
* @param {string} store_name
* @param {StoreOptions<any> | any} store_ops
* @return {Store<any>}
*/
(store_name,store_ops)=>w(store_name,store_ops),get:
/**!
 * - Retrieve a Manifold store by name. *returns `Store\<any\>`*
 * @param {string} store_name
 * @return {Store<any>}
 */
store_name=>w(store_name),func:
/**!
 * - Retrieve a Manifold function by name. *val* refers to the store's current value; *el* refers to the element that triggered the update (if applicable). *returns `MfldFunc`*
 * - *Note:* Functions retrived using this method cannot infer the type of the store's value and is therefore **not** type-checked. It is preferable to keep a reference to the function if you need to preserve type information.
 * @param {string} func_name
 * @return {MfldFunc}
 */
func_name=>i.MFLD.fn[func_name],funcs:
/**!
 * - Add functions to the Manifold function registry in key-value pairs.
 * - Functions must be registered in order to be accessible to HTML elements via `mfBind`, `mfSync`, and `mfResolve`. 
 * - It may still be beneficial to keep a reference to the original function if you need to preserve type information.
 * @param {{ [key: string]: MfldFunc }} funcs
 */
funcs=>{for(let e in funcs)i.MFLD.fn[e]=funcs[e]},config:
/**!
 * - Set Manifold configuration options, including `trans` (DOM transition settings), `fetch` (fetch options), and `profiles` (configuration option overrides that can be set on elements ad-hoc via `mfOverrides`).
 * - Providing the optional `profileName` parameter allows you to save the configuration as a named profile. Otherwise, the profile is saved as the default configuration.
 * @param {MfldOps} new_ops
 * @param {string} [profile_name]
 */
(new_ops,profile_name)=>{return e=new_ops,void((t=profile_name)?_.profiles={..._.profiles,[t]:e}:_={..._,...e})
var e,t},onTick:
/**!
  * - Wait for the next Manifold data update cycle to complete before executing the callback function.
  * @param {()=> void} cb
  */
e=>{var t;(t=e)&&u.push(t)},register:
/**!
 * - Register Manifold subscriptions on the DOM. *Optional:* Pass an `HTMLElement` or selector string to scope the registration to a specific element.
 * @param {HTMLElement | string | null} [parent]
 */
e=>{"string"==typeof e&&(e=document.querySelector(e)),A(e)}}

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
 */globalThis.Mfld||(globalThis.Mfld=N)
//# sourceMappingURL=dev.global.mfld.js.map
