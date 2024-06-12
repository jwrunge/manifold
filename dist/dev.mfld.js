let t="mf_",e=/[\.\[\]\?]{1,}/g,n=/, {0,}/g,o=()=>`${Date.now()}.${Math.floor(1e5*Math.random())}`,i=(t,e)=>{let n=e.dataset?.override||"",o=t.profiles?.[n]||{}
return{...t,...o}},r=o=>{"string"!=typeof o&&((o=o?.el?.dataset?.[o?.datakey]||"")||null==o?.el?.dataset?.[`${t}else`]||(o="return true"))
let[i,r]=o?.split("=>")?.map((t=>t.trim()))?.reverse()||["",""],[s,l]=i?.split(/\s{1,}as\s{1,}/)||[i,"value"],a=l?.split?.(n)?.map?.((t=>t.trim()))||["value"],u=r?.split(",")?.map((t=>t.replace(/[()]/g,"").trim()))||[],f=window[s]||MFLD.fn[s]
if(!f){u?.length||s.includes("=>")||(s.match(/\(|\)/)?u=s.match(/\([^\)]{1,}\)/)?.[0]?.replace(/[\(\) ]/g,"").split(",").filter((t=>!t.match(/[\"\'\`]/)))||[]:(u=[s],s=`return ${s}`)),u=("string"==typeof u?u.split(/\s*,\s*/):u).map((t=>t.split(e)[0])),s.match(/^\s{0,}\{/)||s.includes("return")||(s=s.replace(/^\s{0,}/,"return "))
try{f=new Function(...u,s)}catch(t){console.error(t)}}return{valueList:u,func:f,as:a}},s=[],l=!1,a=[],u=t=>{s.push(t),l||(l=requestAnimationFrame(d))},f=(t,e,n,o)=>{if(!(o.trans?.smart??1))return
let{paddingTop:i,paddingBottom:r}=e instanceof Element?getComputedStyle(e):{paddingTop:0,paddingBottom:0},s=document.createElement("div")
s.style.height=`calc(${Math.abs(n-(t?.clientHeight||0))}px - ${i} - ${r})`,e?.after(s)},c=(t,e)=>{if(!e.trans?.smart??1)return
let n=(e?.trans?.dur?.[0]||e?.trans?.dur||600)/2
u((()=>{t?.animate?.([{height:""},{height:`${t.clientHeight||0}px`}],n)}))},d=()=>{l=!1
for(let t of s){if("function"==typeof t){t()
continue}let e=t.out?t.out.clientHeight:0,n="inner"==t.relation
if("prepend"==t.relation)f?.(t.in,t.out,e,t.ops),p(t.in,"in",t.ops,(()=>{t.out?.prepend(t.in),c?.(t.in,t.ops)}))
else{if(["inner","outer"].includes(t.relation)){let e=t.out?.cloneNode(!0)
e&&(t.out?.after(e),n&&(e.style.border="none",t.out.replaceChildren()),p(e,"out",t.ops,void 0,t.out,n))}f?.(t.in,t.out,e,t.ops),p(t.in,"in",t.ops,(()=>{"outer"==t.relation?t.out?.replaceWith(t.in):t.out?.appendChild(t.in),c?.(t.in,t.ops)}))}t.done?.(t.in)}a.forEach((t=>t())),a=[],s=[]},p=(e,n,o,i,r,s=!1)=>{if(e?.nodeType==Node.TEXT_NODE&&(e=e.replaceWith(document?.createElement("div")).textContent=e.textContent),e){const l=Array.isArray(o.trans?.dur)?o.trans?.dur["in"==n?0:1]||o.trans?.dur[0]:o.trans?.dur||0,a=o?.trans?.class||`${t}trans`
if(e?.classList?.add(a),o.trans?.hooks?.[`${n}-start`]?.(e),"out"==n){if(!(r=r||e))return
let t={};(o.trans?.smart??1)&&!s&&(t=h(r)),u((()=>{(o.trans?.smart??1)&&s&&r&&(t=h(r)),(o.trans?.smart??1)&&(e.style.position="fixed",e.style.width=t.w,e.style.left=t.left,e.style.top=t.top,e.style.margin="0"),l&&(e.style.transitionDuration=`${l}ms`),e.classList?.add("out")}))}else e?.classList?.add("in"),l&&(e.style.transitionDuration=`${l}ms`),i?.(),setTimeout((()=>{u((()=>{setTimeout((()=>u((()=>e?.classList?.remove(n)))),0)}))}),o.trans?.swap||0)
setTimeout((()=>{u((()=>{"out"==n&&e?.remove(),e?.classList?.remove(a),o.trans?.hooks?.[`${n}-end`]?.(e)}))}),l+("in"==n&&o.trans?.swap||0))}},h=t=>{let e=getComputedStyle(t),n=t.getBoundingClientRect()
return{w:`calc(${t.clientWidth}px - ${e.paddingLeft} - ${e.paddingRight})`,left:`calc(${n.left}px + ${window.scrollX}px)`,top:`calc(${n.top}px + ${window.scrollY}px)`}},m=t=>{if(!t)return 0
if("number"==typeof t||!0===t)return t
if(t instanceof Map||t instanceof Set)return m(Array.from(t.entries()||t))
let e=0
for(let n of(new TextEncoder).encode(t?.toString()||""))e=(e<<5)-e+n
return e}
window.MFLD||(window.MFLD={st:new Map,fn:{},mut:new Map})
class ${t=void 0
o=new Map
i=void 0
l=new Set
u=new Set
p
h
constructor(t,e){return this.m(t,e)}m(t,e){if(this.name=t,this.p=e?.scope||document.currentScript||"global",MFLD.st.set(t,this),this.p instanceof Element){let t=MFLD.mut.get(this.p)||{toRemove:new Set}
t.observer||(t.observer=new MutationObserver((e=>{for(let n of e)if("childList"==n.type)for(let e of n.removedNodes)if(e instanceof Element)for(let n of t.toRemove)if(n.p==e){let e=this.p
y(n),t.observer.disconnect(),t.toRemove.delete(n),MFLD.mut.delete(e)}})),t.observer.observe(this.p?.parentElement,{childList:!0})),t.toRemove.add(this),MFLD.mut.set(this.p,t)}return e?.upstream?.map((t=>{let e=w(t)
return this.l.add(e),e.u.add(this),e})),this.value=e?.value,this.t=e?.updater,this.$(),this}sub(t,e,n=!0){this.o.set(e||o(),t),n&&t?.(this.value)}async update(t){return new Promise((async e=>{this.h&&clearTimeout(this.h),this.h=setTimeout((()=>{u((async()=>{let n="function"==typeof t?(await t)?.(this.value):t,o=m(n)
if(o!==this.i){this.value=n,this.i=o
for(let t of this.u)await t.$()
for(let[t,e]of this?.o||[])e?.(this.value,t)
e(this.value)}else e(this.value)}))}),0)}))}async $(){let t=await(this.t?.(Array.from(this.l)?.map((t=>t?.value))||[],this?.value))
await this.update(void 0===t?this.value:t)}}let w=(t,e)=>{let n=MFLD.st.get(t)
return e?n?n.m(t,e):new $(t,e):n||new $(t,e)},y=t=>{MFLD.st.delete(t.name),t=void 0},g=(e,n,o,i,s,l,a)=>{let f=async n=>{n?.preventDefault(),n?.stopPropagation(),s||(s=(n?.target)?.method||"get"),o?.fetch?.externals?.find((t=>i?.startsWith(t.domain)))||!i.match(/^https?:\/\//)||i.includes(location.origin)
let f=a?.(...l||[])||l,c=Array.isArray(f)?f[0]:"$form"==f?new FormData(e):f
if(a){let t=Array.isArray(f)?f?.map((t=>w(t).value))||[]:[c]
c=a?.(...t)}let d=await fetch(i,{...o?.fetch?.request||{},headers:{...o?.fetch?.request?.headers,MFLD:"true"},method:s,body:"$form"==f||"string"==typeof c?c:JSON.stringify(c)}).catch((t=>{o?.fetch?.err?.(t)})),p=d?.status
if(p&&0==o?.fetch?.onCode?.(p,d))return
let h=await(d?.[o?.fetch?.resType||"text"]())
for(let n of["append","prepend","inner","outer"]){let i=e.dataset[`${t}${n}`]
if(void 0===i)continue
let[r,s]=i?.split("->").map((t=>t.trim()))||[],l=(new DOMParser)?.parseFromString?.(h,"text/html")
l&&u({in:l.querySelector(r||"body"),out:s?document.querySelector(s):e,relation:n,ops:o,done:t=>{_(t)}})}void 0!==e.dataset?.[`${t}pushstate`]&&history.pushState({},"",i)
let m=e.dataset?.[`${t}resolve`],$=r(m||"")?.func
$?.(h)}
"$mount"==n?f():e.addEventListener(n,f)},v=(t,e,n=[],o=[])=>{if(t.tagName==e)return t
let i=document.createElement(e)
return i.innerHTML=t.innerHTML,[...t.attributes].filter((t=>!n.includes(t.name))).forEach((t=>i.setAttribute(t.name,t.value))),o.forEach((t=>i.classList.remove(t))),t.replaceWith(i),i},M=(t,e)=>{if(t instanceof Map)for(const[n,o]of t.entries())e(n,o)
else try{let n=Array.from(t||[])
if(n?.length)n.forEach(e)
else for(let n in t)e(n,t[n])}catch(e){console.error(`${t} is not iterable`)}},b=(t,e,n)=>e?.(t)?t:b(n?.(t)||t?.nextElementSibling,e,n),L=(t=[],e)=>w(o(),{upstream:[...t],updater:t=>{try{return e?.func?.(...t)||t[0]}catch(t){return}},scope:e?.observeEl}),F=(t,e,n,o,i,r)=>{if(i.match("bind"))L(e,{observeEl:t,func:()=>{let i=r?.(...e.map((t=>MFLD.st.get(t).value||window.value)),t)
if(n&&null!=i){let[e,o]=n.split(":")
"style"==e?t.style[o]=i:"attr"==e?t.setAttribute(o,i):t[n]=i}return t.dispatchEvent(new CustomEvent(o)),i}})
else{let i=()=>{e.length>1&&console.warn("Multiple sync props",t)
let[o,i]=e?.[0].trim().split(":"),s="style"==o?t.style[i]:"attr"==o?t.getAttribute(i):t[o],l=parseFloat(s)
isNaN(l)||(s=l)
let a=r?.(s,t)
n&&void 0!==a&&w(n)?.update?.(a)}
"$mount"==o?i():t.addEventListener(o,i)}},D=(e,n,o,i,s,l)=>{let a=document.createElement("template"),f=v(e.cloneNode(!0),"TEMPLATE")
a.classList.add(`${n}-start`),f.classList.add(`${n}-end`),f.dataset.nodeName=e.nodeName,e.before(a),e.after(f),e.remove(),L(s,{func:i,observeEl:f}).sub((e=>{u((()=>{b(a?.nextElementSibling,(t=>t?.classList?.contains(`${n}-end`)),(t=>p(t,"out",l,(()=>t?.remove())))),(n.match(/each/)?M:(t,e)=>e(t||""))(e,((e,i)=>{if(null==e)return
let s,a=f?.innerHTML||f?.textContent?.replace(/^\n{0,}|\n{0,}$/,"")||"",u=a.match(/\${[^}]*}/g)||[]
for(let t of u)try{let n=r(`(${o.join(",")})=> ${t.slice(2,t.length-1)}`)?.func
a=a.replace(t,n?.(e,i)||"")}catch(t){a="Error in template. Check console for details.",console.error(t)}if(n.match(/each/)){let t=f.cloneNode(!0)
t.innerHTML=a||e,s=t.content.children}else{let o=v(f.cloneNode(!0),f.dataset.nodeName,["data-node-name",`data-${t}`],[`${n}-end`])
o.innerHTML=a||e,s=[o]}for(let t of s)f.before(t),p(t,"in",l,(()=>_(t)))}))}))}))},x={},T=["bind","sync","templ","if","each","get","head","post","put","delete","patch"].map((e=>`${t}${e}`))
window.addEventListener("popstate",(t=>{}))
let _=e=>{if(e&&e.nodeType==Node.TEXT_NODE)return
let o=(e||document.body).querySelectorAll(`[data-${T.join("],[data-")}],a,form`)||[]
for(let e of o){let o=i(x,e)
if(void 0!==e.dataset?.[`${t}promote`]){let[t,n,i,r]="A"==e.tagName?["get",e.href,[],"click"]:[e.method.toLowerCase(),e.action,"$form","submit"]
if(n){g(e,r,o,n,t,i)
continue}}for(let i in e.dataset){if(!T.includes(i))continue
let s=!i.match(/bind|templ|if|each/)
for(let l of e.dataset?.[i]?.split(";;")||[]){let[a,u]=l?.split("->")?.map((t=>t.trim()))||[],f=s&&a.slice(0,a.indexOf(")"))?.match(/[^\(\)]{1,}/g)?.pop()?.split(n)?.map((t=>t.trim()))||[]
!u&&i.match(/get|head|post|put|delete|patch/)&&(u=a.slice(a.indexOf(")")+1),a="")
let c=s?a?.slice(a.indexOf(")")+1):a
if(s&&!f?.length){console.error("No trigger",e)
break}let{func:d,valueList:p,as:h}=r(c)
if(c&&!d&&console.warn(`"${c}" not registered`,e),i.match(/if|each|templ/))D(e,i,h||[],d,p||[],o)
else{f?.length||(f=[""])
for(let n of f)i.match(/bind|sync/)?F(e,p,u,n,i,d):g(e,n,o,u,i.replace(t,""),p,d)}}}}},E={store:
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
t=>{var e;(e=t)&&a.push(e)},register:
/**!
 * - Register Manifold subscriptions on the DOM. *Optional:* Pass an `HTMLElement` or selector string to scope the registration to a specific element.
 * @param {HTMLElement | string | null} [parent]
 */
t=>{"string"==typeof t&&(t=document.querySelector(t)),_(t)}}

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
 */export{E as Mfld}
//# sourceMappingURL=dev.mfld.js.map
