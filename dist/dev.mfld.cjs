let t="mf_",e=/[\.\[\]\?]{1,}/g,n=/, {0,}/g,o=()=>`${Date.now()}.${Math.floor(1e5*Math.random())}`,i=window,r=(t,e)=>{let n=e.dataset?.override||"",o=t.profiles?.[n]||{}
return{...t,...o}},s=o=>{"string"!=typeof o&&((o=o?.el?.dataset?.[o?.datakey]||"")||null==o?.el?.dataset?.[`${t}else`]||(o="return true"))
let[r,s]=o?.split("=>")?.map((t=>t.trim()))?.reverse()||["",""],[l,a]=r?.split(/\s{1,}as\s{1,}/)||[r,"value"],u=a?.split?.(n)?.map?.((t=>t.trim()))||["value"],f=s?.split(",")?.map((t=>t.replace(/[()]/g,"").trim()))||[],c=i[l]||MFLD.fn[l]
if(!c){f?.length||l.includes("=>")||(l.match(/\(|\)/)?f=l.match(/\([^\)]{1,}\)/)?.[0]?.replace(/[\(\) ]/g,"").split(",").filter((t=>!t.match(/[\"\'\`]/)))||[]:(f=[l],l=`return ${l}`)),f=("string"==typeof f?f.split(/\s*,\s*/):f).map((t=>t.split(e)[0])),l.match(/^\s{0,}\{/)||l.includes("return")||(l=l.replace(/^\s{0,}/,"return "))
try{c=new Function(...f,l)}catch(t){console.error(t)}}return{valueList:f,func:c,as:u}},l=[],a=0,u=[],f=t=>{l.push(t),a||(a=requestAnimationFrame(p))},c=(t,e,n,o)=>{if(!(o.trans?.smart??1))return
let{paddingTop:i,paddingBottom:r}=e instanceof Element?getComputedStyle(e):{paddingTop:0,paddingBottom:0},s=document.createElement("div")
s.style.height=`calc(${Math.abs(n-(t?.clientHeight||0))}px - ${i} - ${r})`,e?.after(s)},d=(t,e)=>{if(!e.trans?.smart??1)return
let n=(e?.trans?.dur?.[0]||e?.trans?.dur||600)/2
f((()=>{t?.animate?.([{height:""},{height:`${t.clientHeight||0}px`}],n)}))},p=()=>{a=0
for(let t of l){if("function"==typeof t){t()
continue}let e=t.out?t.out.clientHeight:0,n="inner"==t.relation
if("prepend"==t.relation)c?.(t.in,t.out,e,t.ops),h(t.in,"in",t.ops,(()=>{t.out?.prepend(t.in),d?.(t.in,t.ops)}))
else{if(["inner","outer"].includes(t.relation)){let e=t.out?.cloneNode(!0)
e&&(t.out?.after(e),n&&(e.style.border="none",t.out.replaceChildren()),h(e,"out",t.ops,void 0,t.out,n))}c?.(t.in,t.out,e,t.ops),h(t.in,"in",t.ops,(()=>{"outer"==t.relation?t.out?.replaceWith(t.in):t.out?.appendChild(t.in),d?.(t.in,t.ops)}))}t.done?.(t.in)}u.forEach((t=>t())),u=[],l=[]},h=(e,n,o,i,r,s=!1)=>{if(e?.nodeType==Node.TEXT_NODE&&(e.replaceWith(document?.createElement("div")),e.textContent=e.textContent),e){const l=Array.isArray(o.trans?.dur)?o.trans?.dur["in"==n?0:1]||o.trans?.dur[0]:o.trans?.dur||0,a=o?.trans?.class||`${t}trans`
if(e?.classList?.add(a),o.trans?.hooks?.[`${n}-start`]?.(e),"out"==n){if(!(r=r||e))return
let t={};(o.trans?.smart??1)&&!s&&(t=m(r)),f((()=>{(o.trans?.smart??1)&&s&&r&&(t=m(r)),(o.trans?.smart??1)&&(e.style.position="fixed",e.style.width=t.w,e.style.left=t.left,e.style.top=t.top,e.style.margin="0"),l&&(e.style.transitionDuration=`${l}ms`),e.classList?.add("out")}))}else e?.classList?.add("in"),l&&(e.style.transitionDuration=`${l}ms`),i?.(),setTimeout((()=>{f((()=>{setTimeout((()=>f((()=>e?.classList?.remove(n)))),0)}))}),o.trans?.swap||0)
setTimeout((()=>{f((()=>{"out"==n&&e?.remove(),e?.classList?.remove(a),o.trans?.hooks?.[`${n}-end`]?.(e)}))}),l+("in"==n&&o.trans?.swap||0))}},m=t=>{let e=getComputedStyle(t),n=t.getBoundingClientRect()
return{w:`calc(${t.clientWidth}px - ${e.paddingLeft} - ${e.paddingRight})`,left:`calc(${n.left}px + ${i.scrollX}px)`,top:`calc(${n.top}px + ${i.scrollY}px)`}},$=t=>{if(!t)return 0
if("number"==typeof t||!0===t)return t
if(t instanceof Map||t instanceof Set)return $(Array.from(t.entries()||t))
let e=0
for(let n of(new TextEncoder).encode(t?.toString()||""))e=(e<<5)-e+n
return e}
i.MFLD||(i.MFLD={st:new Map,fn:{},mut:new Map})
class y{t=void 0
o=new Map
i=void 0
l=new Set
u=new Set
p
h
constructor(t,e){return this.m(t,e)}m(t,e){if(this.name=t,this.p=e?.scope||document.currentScript||"global",MFLD.st.set(t,this),this.p instanceof Element){let t=MFLD.mut.get(this.p)||{toRemove:new Set}
t.observer||(t.observer=new MutationObserver((e=>{for(let n of e)if("childList"==n.type)for(let e of n.removedNodes)if(e instanceof Element)for(let n of t.toRemove)if(n.p==e){let e=this.p
v(n),t.observer.disconnect(),t.toRemove.delete(n),MFLD.mut.delete(e)}})),t.observer.observe(this.p?.parentElement,{childList:!0})),t.toRemove.add(this),MFLD.mut.set(this.p,t)}return e?.upstream?.map((t=>{let e=g(t)
return this.l.add(e),e.u.add(this),e})),this.value=e?.value,this.t=e?.updater,this.$(),this}sub(t,e,n=!0){this.o.set(e||o(),t),n&&t?.(this.value)}async update(t){return new Promise((async e=>{this.h&&clearTimeout(this.h),this.h=setTimeout((()=>{f((async()=>{let n="function"==typeof t?(await t)?.(this.value):t,o=$(n)
if(o!==this.i){this.value=n,this.i=o
for(let t of this.u)await t.$()
for(let[t,e]of this?.o||[])e?.(this.value,t)
e(this.value)}else e(this.value)}))}),0)}))}async $(){let t=await(this.t?.(Array.from(this.l)?.map((t=>t?.value))||[],this?.value))
await this.update(void 0===t?this.value:t)}}let g=(t,e)=>{let n=i.MFLD.st.get(t)
return e?n?n.m(t,e):new y(t,e):n||new y(t,e)},v=t=>{MFLD.st.delete(t.name),t=void 0},w=(e,n,o,i,r,l,a)=>{let u=async n=>{n?.preventDefault(),n?.stopPropagation(),r||(r=(n?.target)?.method||"get"),o?.fetch?.externals?.find((t=>i?.startsWith(t.domain)))||!i.match(/^https?:\/\//)||i.includes(location.origin)
let u=a?.(...l||[])||l,c=Array.isArray(u)?u[0]:"$form"==u?new FormData(e):u
if(a){let t=Array.isArray(u)?u?.map((t=>g(t).value))||[]:[c]
c=a?.(...t)}let d=await fetch(i,{...o?.fetch?.request||{},headers:{...o?.fetch?.request?.headers,MFLD:"true"},method:r,body:"$form"==u||"string"==typeof c?c:JSON.stringify(c)}).catch((t=>{o?.fetch?.err?.(t)})),p=d?.status
if(p&&0==o?.fetch?.onCode?.(p,d))return
let h=await(d?.[o?.fetch?.resType||"text"]())
for(let n of["append","prepend","inner","outer"]){let i=e.dataset[`${t}${n}`]
if(void 0===i)continue
let[r,s]=i?.split("->").map((t=>t.trim()))||[],l=(new DOMParser)?.parseFromString?.(h,"text/html")
l&&f({in:l.querySelector(r||"body"),out:s?document.querySelector(s):e,relation:n,ops:o,done:t=>{E(t)}})}void 0!==e.dataset?.[`${t}pushstate`]&&history.pushState({},"",i)
let m=e.dataset?.[`${t}resolve`],$=s(m||"")?.func
$?.(h)}
"$mount"==n?u():e.addEventListener(n,u)},M=(t,e,n=[],o=[])=>{if(t.tagName==e)return t
let i=document.createElement(e)
return i.innerHTML=t.innerHTML,[...t.attributes].filter((t=>!n.includes(t.name))).forEach((t=>i.setAttribute(t.name,t.value))),o.forEach((t=>i.classList.remove(t))),t.replaceWith(i),i},b=(t,e)=>{if(t instanceof Map)for(const[n,o]of t.entries())e(n,o)
else try{let n=Array.from(t||[])
if(n?.length)n.forEach(e)
else for(let n in t)e(n,t[n])}catch(e){console.error(`${t} is not iterable`)}},L=(t,e,n)=>e?.(t)?t:L(n?.(t)||t?.nextElementSibling,e,n),F=(t=[],e)=>g(o(),{upstream:[...t],updater:t=>{try{return e?.func?.(...t)||t[0]}catch(t){return}},scope:e?.observeEl}),x=(t,e,n,o,r,s)=>{if(r.match("bind"))F(e,{observeEl:t,func:()=>{let r=s?.(...e.map((t=>i.MFLD.st.get(t)?.value||i[r])),t)
if(n&&null!=r){let[e,o]=n.split(":")
"style"==e?t.style[o]=r:"attr"==e?t.setAttribute(o,r):t[n]=r}return t.dispatchEvent(new CustomEvent(o)),r}})
else{let i=()=>{e.length>1&&console.warn("Multiple sync props",t)
let[o,i]=e?.[0].trim().split(":"),r="style"==o?t.style[i]:"attr"==o?t.getAttribute(i):t[o],l=parseFloat(r)
isNaN(l)||(r=l)
let a=s?.(r,t)
n&&void 0!==a&&g(n)?.update?.(a)}
"$mount"==o?i():t.addEventListener(o,i)}},D=(e,n,o,i,r,l)=>{let a=document.createElement("template"),u=M(e.cloneNode(!0),"TEMPLATE")
a.classList.add(`${n}-start`),u.classList.add(`${n}-end`),u.dataset.nodeName=e.nodeName,e.before(a),e.after(u),e.remove(),F(r,{func:i,observeEl:u}).sub((e=>{f((()=>{L(a?.nextElementSibling,(t=>t?.classList?.contains(`${n}-end`)),(t=>h(t,"out",l,(()=>t?.remove())))),(n.match(/each/)?b:(t,e)=>e(t||""))(e,((e,i)=>{if(null==e)return
let r,a=u?.innerHTML||u?.textContent?.replace(/^\n{0,}|\n{0,}$/,"")||"",f=a.match(/\${[^}]*}/g)||[]
for(let t of f)try{let n=s(`(${o.join(",")})=> ${t.slice(2,t.length-1)}`)?.func
a=a.replace(t,n?.(e,i)||"")}catch(t){a="Error in template. Check console for details.",console.error(t)}if(n.match(/each/)){let t=u.cloneNode(!0)
t.innerHTML=a||e,r=t.content.children}else{let o=M(u.cloneNode(!0),u.dataset.nodeName,["data-node-name",`data-${t}`],[`${n}-end`])
o.innerHTML=a||e,r=[o]}for(let t of r)u.before(t),h(t,"in",l,(()=>E(t)))}))}))}))},T={},_=["bind","sync","templ","if","each","get","head","post","put","delete","patch"].map((e=>`${t}${e}`))
i.addEventListener("popstate",(t=>{}))
let E=e=>{if(e&&e.nodeType==Node.TEXT_NODE)return
let o=(e||document.body).querySelectorAll(`[data-${_.join("],[data-")}],a,form`)||[]
for(let e of o){let o=r(T,e)
if(void 0!==e.dataset?.[`${t}promote`]){let[t,n,i,r]="A"==e.tagName?["get",e.href,[],"click"]:[e.method.toLowerCase(),e.action,"$form","submit"]
if(n){w(e,r,o,n,t,i)
continue}}for(let i in e.dataset){if(!_.includes(i))continue
let r=!i.match(/bind|templ|if|each/)
for(let l of e.dataset?.[i]?.split(";;")||[]){let[a,u]=l?.split("->")?.map((t=>t.trim()))||[],f=r&&a.slice(0,a.indexOf(")"))?.match(/[^\(\)]{1,}/g)?.pop()?.split(n)?.map((t=>t.trim()))||[]
!u&&i.match(/get|head|post|put|delete|patch/)&&(u=a.slice(a.indexOf(")")+1),a="")
let c=r?a?.slice(a.indexOf(")")+1):a
if(r&&!f?.length){console.error("No trigger",e)
break}let{func:d,valueList:p,as:h}=s(c)
if(c&&!d&&console.warn(`"${c}" not registered`,e),i.match(/if|each|templ/))D(e,i,h||[],d,p||[],o)
else{f?.length||(f=[""])
for(let n of f)i.match(/bind|sync/)?x(e,p,u,n,i,d):w(e,n,o,u,i.replace(t,""),p,d)}}}}},A={store:
/**!
* - Create or overwrite a _typed_ global Manifold store by passing `store_ops` (`MfldOps`) -> *returns `Store\<T\>`* 
* - Retrieve an untyped reference to the store specified by name by omitting `store_ops` -> *returns `Store\<any\>`*
* @template T
* @param {string} store_name
* @param {StoreOptions<T> | T} store_ops
* @return {Store<T>}
*/
(store_name,store_ops)=>(store_ops?.hasOwnProperty("value")||store_ops?.hasOwnProperty("updater")||(store_ops={value:store_ops}),g(store_name,store_ops)),ustore:
/**!
* - Create or overwrite an untyped global Manifold store by passing `store_ops` (`MfldOps`) -> *returns `Store\<any\>`* 
* - Retrieve an untyped reference to the store specified by name by omitting `store_ops` -> *returns `Store\<any\>`*
* @param {string} store_name
* @param {StoreOptions<any> | any} store_ops
* @return {Store<any>}
*/
(store_name,store_ops)=>g(store_name,store_ops),get:
/**!
 * - Retrieve a Manifold store by name. *returns `Store\<any\>`*
 * @param {string} store_name
 * @return {Store<any>}
 */
store_name=>g(store_name),func:
/**!
 * - Retrieve a Manifold function by name. *val* refers to the store's current value; *el* refers to the element that triggered the update (if applicable). *returns `MfldFunc`*
 * - *Note:* Functions retrived using this method cannot infer the type of the store's value and is therefore **not** type-checked. It is preferable to keep a reference to the function if you need to preserve type information.
 * @param {string} func_name
 * @return {MfldFunc}
 */
func_name=>MFLD.fn[func_name],funcs:
/**!
 * - Add functions to the Manifold function registry in key-value pairs.
 * - Functions must be registered in order to be accessible to HTML elements via `mfBind`, `mfSync`, and `mfResolve`. 
 * - It may still be beneficial to keep a reference to the original function if you need to preserve type information.
 * @param {{ [key: string]: MfldFunc }} funcs
 */
funcs=>{for(let t in funcs)MFLD.fn[t]=funcs[t]},config:
/**!
 * - Set Manifold configuration options, including `trans` (DOM transition settings), `fetch` (fetch options), and `profiles` (configuration option overrides that can be set on elements ad-hoc via `mfOverrides`).
 * - Providing the optional `profileName` parameter allows you to save the configuration as a named profile. Otherwise, the profile is saved as the default configuration.
 * @param {MfldOps} new_ops
 * @param {string} [profile_name]
 */
(new_ops,profile_name)=>{return t=new_ops,void((e=profile_name)?T.profiles={...T.profiles,[e]:t}:T={...T,...t})
var t,e},onTick:
/**!
  * - Wait for the next Manifold data update cycle to complete before executing the callback function.
  * @param {()=> void} cb
  */
t=>{var e;(e=t)&&u.push(e)},register:
/**!
 * - Register Manifold subscriptions on the DOM. *Optional:* Pass an `HTMLElement` or selector string to scope the registration to a specific element.
 * @param {HTMLElement | string | null} [parent]
 */
t=>{"string"==typeof t&&(t=document.querySelector(t)),E(t)}}

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
 */exports.Mfld=A
