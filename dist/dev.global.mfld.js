let e="mf_",t=/, {0,}/g,o=()=>`${Date.now()}.${Math.floor(1e5*Math.random())}`,i=window,n=(t,o)=>{let i=t.profiles?.[o.dataset?.override||""],n={...t,...i}
for(let t in o.dataset){console.log("SET",t)
for(let i of["fetch","trans"])if(t.startsWith(`${e}${i}_`)){console.log("MATCH",`${e}${i}_`)
try{let e=t.split("_")[1],s=o.dataset[t]
s?.match(/\{\[/)&&(s=JSON.parse(s)),parseInt(s)&&(s=parseInt(s)),n[i][e]=s,console.log("Got ",i,e,s)}catch(e){console.error(e)}}}return console.log(n),n},s=e=>{let[o,i]=e?.split(/\s{1,}as\s{1,}/)||[e,"value"],n=`let $fn = globalThis.MFLD.fn; let $st = globalThis.MFLD.st; console.log($el, $fn, $st); console.log($el.value); console.log($fn); return ${o}`,s=i?.split?.(t)?.map?.((e=>e.trim()))||["value"]||[]
return{func:new Function("$el",n),as:s}}
let l=[],r=0,f=[],a=e=>{l.push(e),r||(r=requestAnimationFrame(h))},u=(e,t,o,i)=>{if(!(i.trans?.smart??1))return
let{paddingTop:n,paddingBottom:s}=t instanceof Element?getComputedStyle(t):{paddingTop:0,paddingBottom:0},l=document.createElement("div")
l.style.height=`calc(${Math.abs(o-(e?.clientHeight||0))}px - ${n} - ${s})`,t?.after(l)},c=(e,t)=>{if(!t.trans?.smart??1)return
let o=(t?.trans?.dur?.[0]||t?.trans?.dur||600)/2
a((()=>{e?.animate?.([{height:""},{height:`${e.clientHeight||0}px`}],o)}))},h=()=>{r=0
for(let e of l){if("function"==typeof e){e()
continue}let t=e.out?e.out.clientHeight:0,o="inner"==e.relation
if("prepend"==e.relation)u?.(e.in,e.out,t,e.ops),d(e.in,"in",e.ops,(()=>{e.out?.prepend(e.in),c?.(e.in,e.ops)}))
else{if(["inner","outer"].includes(e.relation)){let t=e.out?.cloneNode(!0)
t&&(e.out?.after(t),o&&(t.style.border="none",e.out.replaceChildren()),d(t,"out",e.ops,void 0,e.out,o))}u?.(e.in,e.out,t,e.ops),d(e.in,"in",e.ops,(()=>{"outer"==e.relation?e.out?.replaceWith(e.in):e.out?.appendChild(e.in),c?.(e.in,e.ops)}))}e.done?.(e.in)}f.forEach((e=>e())),f=[],l=[]},d=(t,o,i,n,s,l=!1,r)=>{if(t?.nodeType==Node.TEXT_NODE&&(t.replaceWith(document?.createElement("div")),t.textContent=t.textContent),t){const f=Array.isArray(i.trans?.dur)?i.trans?.dur["in"==o?0:1]||i.trans?.dur[0]:i.trans?.dur||0,u=i?.trans?.class||`${e}trans`
if(t?.classList?.add(u),i.trans?.hooks?.[`${o}-start`]?.(t),"out"==o){if(!(s=s||t))return
let e={};(i.trans?.smart??1)&&!l&&(e=p(s)),a((()=>{(i.trans?.smart??1)&&l&&s&&(e=p(s)),(i.trans?.smart??1)&&(t.style.position="fixed",t.style.width=e.w,t.style.left=e.left,t.style.top=e.top,t.style.margin="0"),f&&(t.style.transitionDuration=`${f}ms`),t.classList?.add("out")}))}else t?.classList?.add("in"),f&&(t.style.transitionDuration=`${f}ms`),n?.(),setTimeout((()=>{a((()=>{setTimeout((()=>a((()=>t?.classList?.remove(o)))),0)}))}),i.trans?.swap||0)
setTimeout((()=>{a((()=>{"out"==o&&t?.remove(),t?.classList?.remove(u),i.trans?.hooks?.[`${o}-end`]?.(t),t.style.transitionDuration="",console.log("RUNNING AFTER"),"in"==o&&r?.(t)}))}),f+("in"==o&&i.trans?.swap||0))}},p=e=>{let t=getComputedStyle(e),o=e.getBoundingClientRect()
return{w:`calc(${e.clientWidth}px - ${t.paddingLeft} - ${t.paddingRight})`,left:`calc(${o.left}px + ${i.scrollX}px)`,top:`calc(${o.top}px + ${i.scrollY}px)`}},$=e=>{if(!e)return 0
if("number"==typeof e||!0===e)return e
if(e instanceof Map||e instanceof Set)return $(Array.from(e.entries()||e))
let t=0
for(let o of(new TextEncoder).encode(e?.toString()||""))t=(t<<5)-t+o
return t}
i.MFLD||(i.MFLD={st:{},fn:{},mut:new Map})
class m{t=void 0
o=new Map
i=void 0
l=new Set
u=new Set
h
p
constructor(e,t){return this.$(e,t)}$(e,t){if(this.name=e,this.h=t?.scope||document.currentScript||"global",i.MFLD.st[e]=this,this.h instanceof Element){let e=i.MFLD.mut.get(this.h)||{toRemove:new Set,observer:null}
e.observer||(e.observer=new MutationObserver((t=>{for(let o of t)if("childList"==o.type)for(let t of o.removedNodes)if(t instanceof Element)for(let o of e.toRemove)if(o.h==t){let t=this.h
v(o),e.observer?.disconnect(),e.toRemove.delete(o),MFLD.mut.delete(t)}})),e.observer.observe(this.h?.parentElement,{childList:!0})),e.toRemove.add(this),MFLD.mut.set(this.h,e)}return t?.upstream?.map((e=>{let t=g(e)
return this.l.add(t),t.u.add(this),t})),this.value=t?.value,this.t=t?.updater,this.m(),this}sub(e,t,i=!0){this.o.set(t||o(),e),i&&e?.(this.value)}async update(e){return new Promise((async t=>{this.p&&clearTimeout(this.p),this.p=setTimeout((()=>{a((async()=>{let o="function"==typeof e?(await e)?.(this.value):e,i=$(o)
if(i!==this.i){this.value=o,this.i=i
for(let e of this.u)await e.m()
for(let[e,t]of this?.o||[])t?.(this.value,e)
t(this.value)}else t(this.value)}))}),0)}))}async m(){let e=await(this.t?.(Array.from(this.l)?.map((e=>e?.value))||[],this?.value))
await this.update(void 0===e?this.value:e)}}let g=(e,t)=>{let o=i.MFLD.st[e]
return t?o?o.$(e,t):new m(e,t):o||new m(e,t)},v=e=>{i.MFLD.st[e?.name||""]=void 0}
function w(e,t,o,i=!1){let n=i?"previousElementSibling":"nextElementSibling"
return t?.(e)?e:w((o?.(e)||e)?.[n],t,o,i)}let b=(e,t)=>g(o(),{upstream:[...e||[]],updater:()=>t?.func?.(t.observeEl),scope:t?.observeEl}),y=(t,o,i,n,s,l)=>{if(n.match("bind"))o=o?.replace(/\$el\./,"")||"",b(l,{observeEl:t,func:()=>{let e=s?.(t)
if(o&&null!=e){let[i,n]=o.split(":")
"style"==i?t.style[n]=e:"attr"==i?t.setAttribute(n,e):t[o]=e}return t.dispatchEvent(new CustomEvent(i)),e}})
else{let n=i=>{console.log("EV",s.toString(),t,s?.(t))
let n=s?.(t)
o&&void 0!==n&&g(o)?.update?.(n),function(t,o,i){o?.preventDefault()
let n=t.dataset?.[`${e}pushstate`],s=i
switch(n){case"":break
case void 0:return
default:s=`#${n}`}history.pushState(null,"",s)}(t,i)}
"$mount"==i?n():t.addEventListener(i,n)}},T=(t,o,i,n,l,r)=>{let f,u,c=document.createElement("template"),h=(e=>{let t="TEMPLATE"
if(e.tagName==t)return e
let o=document.createElement(t)
return o.content.appendChild(e.cloneNode(!0)),e.replaceWith(o),o})(t.cloneNode(!0)),p=o.match(/if|else/),$=o.match(/(else|elseif)(\s|$)/),m=[]
if(c.classList.add(`${o}-start`),h.classList.add(`${o}-end`),t.before(c),t.after(h),t.remove(),p){if($){let t=w(c,(t=>t?.classList?.contains(`${e}if-end`)),null,!0)
w(t,(e=>e==h),(t=>{t?.dataset?.[`${e}cstore`]&&m.push(t?.dataset?.[`${e}cstore`])}))}u=(...e)=>{if($)for(let t of e.slice(-m.length))if(1==t)return!1
return"else"==$?.[0]||1==n?.(...e)}}f=b(l,{func:p?u:n,observeEl:h}),p&&(h.dataset[`${e}cstore`]=f.name),f.sub((e=>{void 0!==e&&a((()=>{w(c?.nextElementSibling,(e=>e?.classList?.contains(`${o}-end`)),(e=>d(e,"out",r,(()=>e?.remove())))),p&&!e||((e,t)=>{if(e instanceof Map)for(const[o,i]of e.entries())t(o,i)
else try{let o=Array.from(e||[])
if(o?.length)o.forEach(t)
else for(let o in e)t(o,e[o])}catch(t){console.error(`${e} is not iterable`)}})(o.match(/each/)?e:[e],((e,t)=>{let o=h.cloneNode(!0)
if(!p){let n=new RegExp("\\$:{([^}]*)}","g"),l=h?.innerHTML?.replace(n,((o,n)=>s(`(${i.join(",")})=> ${n}`)?.func?.(e,t)||""))||""
o?.innerHTML&&(o.innerHTML=l)}for(let t of o.content.children)t?.innerHTML||(t.innerHTML=e),h.before(t),d(t,"in",r)}))}))}))},E={},M=["bind","sync","templ","if","elseif","else","each","get","head","post","put","delete","patch"].map((t=>`${e}${t}`))
i.addEventListener("popstate",(()=>{location.reload()}))
let S={store:
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
i=>{"string"==typeof i&&(i=document.querySelector(i)),(i=>{if(i?.nodeType==Node.TEXT_NODE)return
let l=(i||document.body).querySelectorAll(`[data-${M.join("],[data-")}],a,form`)||[]
for(let i of l){let l=n(E,i)
if(i.id||(i.id=o()),void 0!==i.dataset?.[`${e}promote`]){let[e,t,o,n]="A"==i.tagName?["get",i.href,[],"click"]:[i.method.toLowerCase(),i.action,"$form","submit"]
if(t)continue}for(let e of M){if(void 0===i.dataset?.[e])continue
let o=!e.match(/bind|templ|if|else|each/)
for(let n of i.dataset?.[e]?.split(";;")||[]){let r=n?.split(/\s*->\s*/g),f=(o?r?.shift()?.match(/[^\(\)]{1,}/g)?.pop()?.split(t)?.map((e=>e.trim())):[])||[],[a,u]=r,c=a?.match(/\$st\.(\w{1,})/g)||[]
!u&&e.match(/get|head|put|post|delete|patch/)&&(u=a,a="")
let{func:h,as:d}=s(a)
if(console.log("MODE",e,"FUNC",h,"AS",d,"OUTPUT",u,"DEPS",c),e.match(/each|templ|if|else/))T(i,e,d||[],h,c,l)
else{f?.length||(f=[""])
for(let t of f)e.match(/bind|sync/)&&y(i,u,t,e,h)}}}}})(i)}}

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
 */globalThis.Mfld||(globalThis.Mfld=S)
//# sourceMappingURL=dev.global.mfld.js.map
