let t="mf_",e=/[\.\[\]\?]{1,}/g,o=/, {0,}/g,n=()=>`${Date.now()}.${Math.floor(1e5*Math.random())}`,i=window,r=(t,e)=>{let o=e.dataset?.override||"",n=t.profiles?.[o]||{}
return{...t,...n}},s=n=>{"string"!=typeof n&&((n=n?.el?.dataset?.[n?.datakey]||"")||null==n?.el?.dataset?.[`${t}else`]||(n="return true"))
let[r,s]=n?.split("=>")?.map((t=>t.trim()))?.reverse()||["",""],[l,a]=r?.split(/\s{1,}as\s{1,}/)||[r,"value"],u=a?.split?.(o)?.map?.((t=>t.trim()))||["value"],f=s?.split(",")?.map((t=>t.replace(/[()]/g,"").trim()))||[],c=i[l]||MFLD.fn[l]
if(!c){f?.length||l.includes("=>")||(l.match(/\(|\)/)?f=l.match(/\([^\)]{1,}\)/)?.[0]?.replace(/[\(\) ]/g,"").split(",").filter((t=>!t.match(/[\"\'\`]/)))||[]:(f=[l],l=`return ${l}`)),f=("string"==typeof f?f.split(/\s*,\s*/):f).map((t=>t.split(e)[0])),l.match(/^\s{0,}\{/)||l.includes("return")||(l=l.replace(/^\s{0,}/,"return "))
try{c=new Function(...f,l)}catch(t){console.error(t)}}return{valueList:f,func:c,as:u}},l=[],a=0,u=[],f=t=>{l.push(t),a||(a=requestAnimationFrame(h))},c=(t,e,o,n)=>{if(!(n.trans?.smart??1))return
let{paddingTop:i,paddingBottom:r}=e instanceof Element?getComputedStyle(e):{paddingTop:0,paddingBottom:0},s=document.createElement("div")
s.style.height=`calc(${Math.abs(o-(t?.clientHeight||0))}px - ${i} - ${r})`,e?.after(s)},d=(t,e)=>{if(!e.trans?.smart??1)return
let o=(e?.trans?.dur?.[0]||e?.trans?.dur||600)/2
f((()=>{t?.animate?.([{height:""},{height:`${t.clientHeight||0}px`}],o)}))},h=()=>{a=0
for(let t of l){if("function"==typeof t){t()
continue}let e=t.out?t.out.clientHeight:0,o="inner"==t.relation
if("prepend"==t.relation)c?.(t.in,t.out,e,t.ops),p(t.in,"in",t.ops,(()=>{t.out?.prepend(t.in),d?.(t.in,t.ops)}))
else{if(["inner","outer"].includes(t.relation)){let e=t.out?.cloneNode(!0)
e&&(t.out?.after(e),o&&(e.style.border="none",t.out.replaceChildren()),p(e,"out",t.ops,void 0,t.out,o))}c?.(t.in,t.out,e,t.ops),p(t.in,"in",t.ops,(()=>{"outer"==t.relation?t.out?.replaceWith(t.in):t.out?.appendChild(t.in),d?.(t.in,t.ops)}))}t.done?.(t.in)}u.forEach((t=>t())),u=[],l=[]},p=(e,o,n,i,r,s=!1)=>{if(e?.nodeType==Node.TEXT_NODE&&(e.replaceWith(document?.createElement("div")),e.textContent=e.textContent),e){const l=Array.isArray(n.trans?.dur)?n.trans?.dur["in"==o?0:1]||n.trans?.dur[0]:n.trans?.dur||0,a=n?.trans?.class||`${t}trans`
if(e?.classList?.add(a),n.trans?.hooks?.[`${o}-start`]?.(e),"out"==o){if(!(r=r||e))return
let t={};(n.trans?.smart??1)&&!s&&(t=m(r)),f((()=>{(n.trans?.smart??1)&&s&&r&&(t=m(r)),(n.trans?.smart??1)&&(e.style.position="fixed",e.style.width=t.w,e.style.left=t.left,e.style.top=t.top,e.style.margin="0"),l&&(e.style.transitionDuration=`${l}ms`),e.classList?.add("out")}))}else e?.classList?.add("in"),l&&(e.style.transitionDuration=`${l}ms`),i?.(),setTimeout((()=>{f((()=>{setTimeout((()=>f((()=>e?.classList?.remove(o)))),0)}))}),n.trans?.swap||0)
setTimeout((()=>{f((()=>{"out"==o&&e?.remove(),e?.classList?.remove(a),n.trans?.hooks?.[`${o}-end`]?.(e)}))}),l+("in"==o&&n.trans?.swap||0))}},m=t=>{let e=getComputedStyle(t),o=t.getBoundingClientRect()
return{w:`calc(${t.clientWidth}px - ${e.paddingLeft} - ${e.paddingRight})`,left:`calc(${o.left}px + ${i.scrollX}px)`,top:`calc(${o.top}px + ${i.scrollY}px)`}},$=t=>{if(!t)return 0
if("number"==typeof t||!0===t)return t
if(t instanceof Map||t instanceof Set)return $(Array.from(t.entries()||t))
let e=0
for(let o of(new TextEncoder).encode(t?.toString()||""))e=(e<<5)-e+o
return e}
i.MFLD||(i.MFLD={st:new Map,fn:{},mut:new Map})
class y{t=void 0
o=new Map
i=void 0
l=new Set
u=new Set
h
p
constructor(t,e){return this.m(t,e)}m(t,e){if(this.name=t,this.h=e?.scope||document.currentScript||"global",MFLD.st.set(t,this),this.h instanceof Element){let t=MFLD.mut.get(this.h)||{toRemove:new Set}
t.observer||(t.observer=new MutationObserver((e=>{for(let o of e)if("childList"==o.type)for(let e of o.removedNodes)if(e instanceof Element)for(let o of t.toRemove)if(o.h==e){let e=this.h
v(o),t.observer.disconnect(),t.toRemove.delete(o),MFLD.mut.delete(e)}})),t.observer.observe(this.h?.parentElement,{childList:!0})),t.toRemove.add(this),MFLD.mut.set(this.h,t)}return e?.upstream?.map((t=>{let e=g(t)
return this.l.add(e),e.u.add(this),e})),this.value=e?.value,this.t=e?.updater,this.$(),this}sub(t,e,o=!0){this.o.set(e||n(),t),o&&t?.(this.value)}async update(t){return new Promise((async e=>{this.p&&clearTimeout(this.p),this.p=setTimeout((()=>{f((async()=>{let o="function"==typeof t?(await t)?.(this.value):t,n=$(o)
if(n!==this.i){this.value=o,this.i=n
for(let t of this.u)await t.$()
for(let[t,e]of this?.o||[])e?.(this.value,t)
e(this.value)}else e(this.value)}))}),0)}))}async $(){let t=await(this.t?.(Array.from(this.l)?.map((t=>t?.value))||[],this?.value))
await this.update(void 0===t?this.value:t)}}let g=(t,e)=>{let o=i.MFLD.st.get(t)
return e?o?o.m(t,e):new y(t,e):o||new y(t,e)},v=t=>{MFLD.st.delete(t.name),t=void 0},w=(e,o,n,i,r,l,a)=>{let u=async o=>{o?.preventDefault(),o?.stopPropagation(),r||(r=(o?.target)?.method||"get"),n?.fetch?.externals?.find((t=>i?.startsWith(t.domain)))||!i.match(/^https?:\/\//)||i.includes(location.origin)
let u=a?.(...l||[])||l,c=Array.isArray(u)?u[0]:"$form"==u?new FormData(e):u
if(a){let t=Array.isArray(u)?u?.map((t=>g(t).value))||[]:[c]
c=a?.(...t)}let d=await fetch(i,{...n?.fetch?.request||{},headers:{...n?.fetch?.request?.headers,MFLD:"true"},method:r,body:"$form"==u||"string"==typeof c?c:JSON.stringify(c)}).catch((t=>{n?.fetch?.err?.(t)})),h=d?.status
if(h&&0==n?.fetch?.onCode?.(h,d))return
let p=await(d?.[n?.fetch?.resType||"text"]())
for(let o of["append","prepend","inner","outer"]){let i=e.dataset[`${t}${o}`]
if(void 0===i)continue
let[r,s]=i?.split("->").map((t=>t.trim()))||[],l=(new DOMParser)?.parseFromString?.(p,"text/html")
l&&f({in:l.querySelector(r||"body"),out:s?document.querySelector(s):e,relation:o,ops:n,done:t=>{E(t)}})}void 0!==e.dataset?.[`${t}pushstate`]&&history.pushState({},"",i)
let m=e.dataset?.[`${t}resolve`],$=s(m||"")?.func
$?.(p)}
"$mount"==o?u():e.addEventListener(o,u)},M=(t,e,o=[],n=[])=>{if(t.tagName==e)return t
let i=document.createElement(e)
return i.innerHTML=t.innerHTML,[...t.attributes].filter((t=>!o.includes(t.name))).forEach((t=>i.setAttribute(t.name,t.value))),n.forEach((t=>i.classList.remove(t))),t.replaceWith(i),i},b=(t,e)=>{if(t instanceof Map)for(const[o,n]of t.entries())e(o,n)
else try{let o=Array.from(t||[])
if(o?.length)o.forEach(e)
else for(let o in t)e(o,t[o])}catch(e){console.error(`${t} is not iterable`)}},L=(t,e,o)=>e?.(t)?t:L(o?.(t)||t?.nextElementSibling,e,o),T=(t=[],e)=>g(n(),{upstream:[...t],updater:t=>{try{return e?.func?.(...t)||t[0]}catch(t){return}},scope:e?.observeEl}),F=(t,e,o,n,r,s)=>{if(r.match("bind"))T(e,{observeEl:t,func:()=>{let r=s?.(...e.map((t=>i.MFLD.st.get(t)?.value||i[r])),t)
if(o&&null!=r){let[e,n]=o.split(":")
"style"==e?t.style[n]=r:"attr"==e?t.setAttribute(n,r):t[o]=r}return t.dispatchEvent(new CustomEvent(n)),r}})
else{let i=()=>{e.length>1&&console.warn("Multiple sync props",t)
let[n,i]=e?.[0].trim().split(":"),r="style"==n?t.style[i]:"attr"==n?t.getAttribute(i):t[n],l=parseFloat(r)
isNaN(l)||(r=l)
let a=s?.(r,t)
o&&void 0!==a&&g(o)?.update?.(a)}
"$mount"==n?i():t.addEventListener(n,i)}},D=(e,o,n,i,r,l)=>{let a=document.createElement("template"),u=M(e.cloneNode(!0),"TEMPLATE")
a.classList.add(`${o}-start`),u.classList.add(`${o}-end`),u.dataset.nodeName=e.nodeName,e.before(a),e.after(u),e.remove(),T(r,{func:i,observeEl:u}).sub((e=>{f((()=>{L(a?.nextElementSibling,(t=>t?.classList?.contains(`${o}-end`)),(t=>p(t,"out",l,(()=>t?.remove())))),(o.match(/each/)?b:(t,e)=>e(t||""))(e,((e,i)=>{if(null==e)return
let r,a=u?.innerHTML||u?.textContent?.replace(/^\n{0,}|\n{0,}$/,"")||"",f=a.match(/\${[^}]*}/g)||[]
for(let t of f)try{let o=s(`(${n.join(",")})=> ${t.slice(2,t.length-1)}`)?.func
a=a.replace(t,o?.(e,i)||"")}catch(t){a="Error in template. Check console for details.",console.error(t)}if(o.match(/each/)){let t=u.cloneNode(!0)
t.innerHTML=a||e,r=t.content.children}else{let n=M(u.cloneNode(!0),u.dataset.nodeName,["data-node-name",`data-${t}`],[`${o}-end`])
n.innerHTML=a||e,r=[n]}for(let t of r)u.before(t),p(t,"in",l,(()=>E(t)))}))}))}))},x={},_=["bind","sync","templ","if","each","get","head","post","put","delete","patch"].map((e=>`${t}${e}`))
i.addEventListener("popstate",(t=>{}))
let E=e=>{if(e&&e.nodeType==Node.TEXT_NODE)return
let n=(e||document.body).querySelectorAll(`[data-${_.join("],[data-")}],a,form`)||[]
for(let e of n){let n=r(x,e)
if(void 0!==e.dataset?.[`${t}promote`]){let[t,o,i,r]="A"==e.tagName?["get",e.href,[],"click"]:[e.method.toLowerCase(),e.action,"$form","submit"]
if(o){w(e,r,n,o,t,i)
continue}}for(let i in e.dataset){if(!_.includes(i))continue
let r=!i.match(/bind|templ|if|each/)
for(let l of e.dataset?.[i]?.split(";;")||[]){let[a,u]=l?.split("->")?.map((t=>t.trim()))||[],f=r&&a.slice(0,a.indexOf(")"))?.match(/[^\(\)]{1,}/g)?.pop()?.split(o)?.map((t=>t.trim()))||[]
!u&&i.match(/get|head|post|put|delete|patch/)&&(u=a.slice(a.indexOf(")")+1),a="")
let c=r?a?.slice(a.indexOf(")")+1):a
if(r&&!f?.length){console.error("No trigger",e)
break}let{func:d,valueList:h,as:p}=s(c)
if(c&&!d&&console.warn(`"${c}" not registered`,e),i.match(/if|each|templ/))D(e,i,p||[],d,h||[],n)
else{f?.length||(f=[""])
for(let o of f)i.match(/bind|sync/)?F(e,h,u,o,i,d):w(e,o,n,u,i.replace(t,""),h,d)}}}}},A={store:
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
(new_ops,profile_name)=>{return t=new_ops,void((e=profile_name)?x.profiles={...x.profiles,[e]:t}:x={...x,...t})
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
 */globalThis.Mfld||(globalThis.Mfld=A)
//# sourceMappingURL=dev.global.mfld.js.map
