let t="mf_",e=/[\.\[\]\?]{1,}/g
function n(t,e,n){let o=t
for(let t of e)null==o&&(o="number"==typeof t?[]:{}),null==n||e[e.length-1]!==t?o=o instanceof Map?o?.get(t):o?.[t]:o instanceof Map?o.set(t,n):o[t]=n
return o}function o(t){let[n,...o]=t?.split(e)
return[n,o?.map((t=>isNaN(parseInt(t))?t:parseInt(t))).filter((t=>t))||[]]}function i(e,n,o,i=!0,r="{}",s){let l=n.dataset[`${t}${e}`]
if(l)return"overrides"==e?o.profiles?.[l||""]?.fetch||JSON.parse(l||"{}"):i?JSON.parse(l||r):"num"==s?parseInt(l)||void 0:"bool"==s?"true"==l||"false"!=l&&void 0:l}function r(t,e){let n=i("overrides",e,t)
return{profiles:t.profiles,fetch:{...t.fetch,responseType:i("responsetype",e,t,!1)||t.fetch?.responseType,...n?.fetch||{},...i("fetch",e,t)||{}},trans:{...t.trans,dur:i("transdur",e,t,!0,"[]","num")||t.trans?.dur,swap:i("transswap",e,t,!1,"","num")||t.trans?.swap,class:i("transclass",e,t,!1)||t.trans?.class,smartTransition:i("transsmart",e,t,!1,void 0,"bool")||t.trans?.smartTransition,...n?.trans||{},...i("trans",e,t)||{}}}}function s(e){let n="",o=""
if("string"==typeof e?(n=e,o=e):(n=e?.el?.dataset?.[e?.datakey]||"",o=n,n||void 0===e?.el?.dataset?.[`${t}else`]||(n="return true",o=`ELSE:${e?.el?.dataset?.[e?.datakey]||""}`)),!n)return{}
let[i,r]=n?.split("=>")?.map((t=>t.trim()))||["",""]
r||(r=i.slice(),i="")
let s=i?.split(",")?.map((t=>t.replace(/[()]/g,"").trim())),l=globalThis[r]||MfFn?.get(r)
return l||(r.match(/^\s{0,}\{/)||r.includes("return")||(r=r.replace(/^\s{0,}/,"return ")),l=new Function(...s,r)),{storeList:s,func:l,storeName:o}}let l,a=[],f=!1,u=[],c="",d=globalThis?.requestAnimationFrame||(t=>setTimeout(t,0))
function p(t){a.push(t),f||(f=!0,d(m))}function $(t,e,n,o=!1,i){if(!i.trans?.smartTransition??1)return
l=document.createElement("div")
let{paddingTop:r,paddingBottom:s}=e instanceof Element?window.getComputedStyle(e):{paddingTop:0,paddingBottom:0}
c=l.style.height=`calc(${Math.abs(n-(t?.clientHeight||0))}px - ${r} - ${s})`,e?.after(l)}function h(t,e){if(!e.trans?.smartTransition??1)return
let n=(e?.trans?.dur?.[0]||e?.trans?.dur||600)/2
p((()=>{l?.remove(),t?.animate?.([{height:c},{height:`${t.clientHeight||0}px`}],n)}))}function m(){f=!1
for(let t of a)if("function"==typeof t)t()
else{let e=t.out?t.out.clientHeight:0
if("prepend"==t.relation)$?.(t.in,t.out,e,!1,t.ops),w(t.in,"in",t.ops,(()=>{t.in&&t.out?.prepend(t.in),h?.(t.in,t.ops)}))
else{if(["swapinner","swapouter"].includes(t.relation)){let e=t.out?.cloneNode(!0)
t.out?.after(e)
let n="swapinner"==t.relation
"swapinner"==t.relation&&(e.style.border="none",t.out.replaceChildren()),w(e,"out",t.ops,void 0,t.out,n)}$?.(t.in,t.out,e,!1,t.ops),w(t.in,"in",t.ops,(()=>{t.in&&("swapouter"==t.relation?t.out?.replaceWith(t.in):t.out?.appendChild(t.in)),h?.(t.in,t.ops)}))}t.done?.(t.in)}for(let t of u)t()
u=[],a=[]}function w(e,n,o,i,r,s=!1){if(e?.nodeType==Node.TEXT_NODE){let t=e.textContent,n=document?.createElement("div")
n.textContent=t,e.replaceWith(n),e=n}if(e){let l=Array.isArray(o.trans?.dur)?o.trans?.dur["in"==n?0:1]||o.trans?.dur[0]:o.trans?.dur||0,a=o?.trans?.class||`${t}trans`
if(e?.classList?.add(a),o.trans?.hooks?.[`${n}-start`]?.(e),"out"==n){if(r||(r=e),!r)return
let t={}
if((o.trans?.smartTransition??1)&&0==s){let e=getComputedStyle(r)
t.w=`calc(${r.clientWidth}px - ${e.paddingLeft} - ${e.paddingRight})`,t.left=`calc(${r.getBoundingClientRect().left}px + ${window.scrollX}px)`,t.top=`calc(${r.getBoundingClientRect().top}px + ${window.scrollY}px)`}p((()=>{if(o.trans?.smartTransition??1){if(s&&r){let e=getComputedStyle(r)
t.w=`calc(${r.clientWidth}px - ${e.paddingLeft} - ${e.paddingRight})`,t.left=`calc(${r.getBoundingClientRect().left}px + ${window.scrollX}px)`,t.top=`calc(${r.getBoundingClientRect().top}px + ${window.scrollY}px)`}e.style.position="fixed",e.style.width=t.w,e.style.left=t.left,e.style.top=t.top,e.style.margin="0"}l&&(e.style.transitionDuration=`${l}ms`),e.classList?.add("out")}))}else e?.classList?.add("in"),l&&(e.style.transitionDuration=`${l}ms`),i?.(),setTimeout((()=>{p((()=>{setTimeout((()=>p((()=>e?.classList?.remove(n)))),0)}))}),o.trans?.swap||0)
setTimeout((()=>{p((()=>{"out"==n&&e?.remove(),e?.classList?.remove(a),o.trans?.hooks?.[`${n}-end`]?.(e)}))}),l+("in"==n&&o.trans?.swap||0))}}function y(t){if(!t)return 0
if("number"==typeof t)return t
if(!0===t)return 1
if(t instanceof Map)return y(Array.from(t.entries()))
if(t instanceof Set)return y(Array.from(t))
let e=0
for(let n of(new TextEncoder).encode("string"==typeof t?t:t?.toString()||""))e=(e<<5)-e+n
return e}globalThis.MfSt||(globalThis.MfSt=new Map),globalThis.MfFn||(globalThis.MfFn=new Map)
class g{t=void 0
o=new Map
i=void 0
l=new Set
u=new Set
constructor(t,e){return this.p(t,e)}p(t,e){return this.name=t,MfSt.set(t,this),e?.upstream?.map((t=>{let e=v(t)
return this.l.add(e),e.u.add(this),e})),this.value=e?.value,this.t=e?.updater,this.$(),this}sub(t,e,n=!0){this.o.set(e||String(Date.now()+Math.random()),t),n&&t?.(this.value)}async update(t){return new Promise((async e=>{let n="function"==typeof t?(await t)?.(this.value):t,o=y(n)
if(o!==this.i){this.value=n,this.i=o
for(let t of this.u)await t.$()
p((()=>{for(let[t,e]of this?.o||[])e?.(this.value,t)
e(this.value)}))}else e(this.value)}))}async $(){let t=await(this.t?.(Array.from(this.l)?.map((t=>t?.value))||[],this?.value))
await this.update(void 0===t?this.value:t)}}function v(t,e){let n=MfSt.get(t)
return e?n?n.p(t,e):new g(t,e):n||new g(t,e)}function b(e,n,o,i,r,l,a){let f=async n=>{n?.preventDefault(),n?.stopPropagation(),r||(r=(n?.target)?.method||"get"),o?.fetch?.externals?.find((t=>i?.startsWith(t.domain)))||!i.match(/^https?:\/\//)||i.includes(location.origin)
let f=Array.isArray(l)?l[0]:"$form"==l?new FormData(e):l
if(a){let t=Array.isArray(l)?l?.map((t=>v(t).value))||[]:[f]
f=a?.(...t)}let u=await fetch(i,{...o?.fetch?.request||{},headers:{...o?.fetch?.request?.headers,"Manifold-App-Fetch":"true"},method:r,body:"$form"==l||"string"==typeof f?f:JSON.stringify(f)}).catch((t=>{o?.fetch?.err?.(t)||console.error("FETCH ERROR",t)})),c=u?.status
if(c&&0==o?.fetch?.onCode?.(c,u))return
let d=await(u?.[o?.fetch?.responseType||"text"]())
for(let n of["append","prepend","swapinner","swapouter"]){let i=e.dataset[`${t}${n}`]
if(void 0===i)continue
let[r,s]=i?.split("->").map((t=>t.trim()))||[],l=(new DOMParser)?.parseFromString?.(d,"text/html")
l&&p({in:l.querySelector(r||"body"),out:s?document.querySelector(s):e,relation:n,ops:o,done:t=>{k(t)}})}let $=e.dataset?.[`${t}resolve`],h=s($||"")?.func
h?.(d)}
"$mount"==n?f():e.addEventListener(n,f)}function T(e,i,r,s,l,a){if(l==`${t}bind`){let t=i.map(o),l=()=>{p((()=>{let o=t.map((t=>n(v(t[0])?.value,t[1]))),i=a?.(...o,e)??o[0]
if(r&&void 0!==i){let t=r.split(":")
if(t.length>1)switch(t[0]){case"style":e.style[t[1]]=i
break
case"attr":e.setAttribute(t[1],i)
break
default:e[r]=i}else e[r]=i}e.dispatchEvent(new CustomEvent(s))}))}
for(let e of t)v(e?.[0]||"")?.sub(l)}else if(l==`${t}sync`){let[t,l]=o(r||""),f=()=>{let o=i.map((t=>{let n=(t=t.trim()).split(":")
if(!(n.length>1))return e[t]??void 0
switch(n[0]){case"style":return e.style[t]??void 0
case"attr":return e.getAttribute(t)??void 0
default:return e[t]??void 0}})),r=a?.(...o)??o[0]
t&&void 0!==r&&v(t)?.update?.((t=>l?.length?n(t,l,r):r))}
"$mount"==s?f():e.addEventListener(s,f)}}function M(t,e){if("TEMPLATE"!=t.tagName){let n=document.createElement("template")
n.innerHTML=t.innerHTML
for(let e of t.attributes)n.setAttribute(e.name,e.value)
return t.replaceWith(n),e.innerHTML=t.innerHTML,n}return t}function x(t,e,n,o,i){return v(t||"",{upstream:[...e||[],...n||[]],updater:t=>{if(o)for(let e of t.slice(-o)||[])if(e)return!1
return i?.(...t)}})}function S(e,n,o){let i=document.createElement("div")
if(e.before(i),n==`${t}if`){i.classList.add("mfld-active-condition")
let r=e,l=[]
for(;r&&r;){let{storeList:e,func:a,storeName:f}=s({el:r,datakey:l.length?`${t}elseif`:n})
if(!e&&!a)break
r=M(r,i)
let u=x(f,e,l,l.length,a)
l.push(u.name)
let c=r.cloneNode(!0)
u?.sub((t=>{if(!t)return
let e=document.createElement("div")
e.innerHTML=c.innerHTML,"TEMPLATE"==c?.tagName&&p({in:e,out:i,relation:"swapinner",ops:o,done:t=>k(t)})})),r=r?.nextElementSibling}}if(n==`${t}each`){i.classList.add("mfld-loop-result")
let[n,r]=e.dataset[`${t}each`]?.split("as")?.map((t=>t.trim()))||[],[l,a]=r.split(/\s{0,},\s{0,}/)?.map((t=>t.trim()))||["value","key"],{storeList:f,func:u,storeName:c}=s(n)
e=M(e,i)
let d=x(`LOOP:${c}`,f,[],0,u)
d?.sub((t=>{p((()=>i.replaceChildren())),function(t,e){if(t instanceof Map)for(const[n,o]of t.entries())e(n,o)
else try{let n=Array.from(t)
if(n?.length)n.forEach(e)
else for(let n in t)e(n,t[n])}catch(e){console.error(`${t} is not iterable`)}}(t||[],((t,n)=>{let r=e.innerHTML,f=e.innerHTML.match(/\${[^}]*}/g)||[]
for(let e of f){let o=e.replace(/^\$\{|\}$/g,"")
try{let i=s(`(${a}, ${l})=> ${o}`)?.func
r=r.replace(e,i?.(n,t)||"")}catch(t){console.error("Syntax error in loop function",t)}}let u=document.createElement("div")
u.innerHTML=r,p({in:u,out:i,relation:"append",ops:o,done:t=>k(t)})}))}))}}let A={},E=/, {0,}/g,N=0,_=["bind","sync","if","each","get","head","post","put","delete","patch"].map((e=>`${t}${e}`))
function k(e){let n=(e||document.body).querySelectorAll(`[data-${_.join("],[data-")}]${0!=A.fetch?.auto?",a,form":""}`)||[]
for(let e of n){e.id||(e.id=""+N++)
let n=r(A,e)
if(void 0===e.dataset?.[`${t}boost`]||"A"!=e.tagName&&"FORM"!=e.tagName)for(let o in e.dataset){if([`${t}if`,`${t}each`].includes(o)){S(e,o,n)
continue}if(!_.includes(o))continue
let i=![`${t}bind`].includes(o),r=`(#${e.id} on ${o})`
for(let l of e.dataset?.[o]?.split(";")||[]){let[a,f]=l?.split("->")?.map((t=>t.trim()))||[],u=i?F(a.slice(0,a.indexOf(")"))):[],c=i?a.slice(a.indexOf(")")+1):a,d=c.includes("=>")?c:c.includes("(")&&c.match(/^[^\(]{1,}/)?.[0]||"",p=d?F(c.slice(0,(c.indexOf(")")||-2)+1)):c.split(E)?.map((t=>t.trim()))
if(i&&!u?.length){console.error(`No trigger: ${r}.`)
break}let $=s(d)?.func
d?$||console.warn(`"${d}" not registered: ${r}`):p.length>1&&console.warn(`Multiple inputs without function: ${r}`),u?.length||(u=[""])
for(let i of u)o.match(/bind|sync/)?T(e,p,f,i,o,$):(f||(f=p[0],p=[]),b(e,i,n,f,o.replace(t,""),p,$))}}else{let[t,o,i,r]="A"==e.tagName?["get",e.href,"","click"]:[e.method.toLowerCase(),e.action,"$form","submit"]
b(e,r,n,o,t,i)}}}function F(t){if(t?.includes("(")){let e=t.match(/[^\(\)]{1,}/g)
t=e?.[e.length-1]||""}return t?.split(E)?.map((t=>t.trim()))||[]}
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
 * @property {"json"|"text"} [responseType] - Response type (default: "text")
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
 * @callback UpdateFunction
 * @param {T | ValueDeterminer<T>} value
 * @returns {T | Promise<T> | undefined}
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
 * @typedef {Function} SubFunction
 * @param {T} value
 * @returns {void}
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
 */let O={store:
/**!
* - Create or overwrite a _typed_ global Manifold store by passing `store_ops` (`MfldOps`) -> *returns `Store\<T\>`* 
* - Retrieve an untyped reference to the store specified by name by omitting `store_ops` -> *returns `Store\<any\>`*
* @template T
* @param {string} store_name
* @param {StoreOptions<T> | T} store_ops
* @return {Store<T>}
*/
(store_name,store_ops)=>(store_ops?.hasOwnProperty("value")||store_ops?.hasOwnProperty("updater")||(store_ops={value:store_ops}),v(store_name,store_ops)),ustore:
/**!
* - Create or overwrite an untyped global Manifold store by passing `store_ops` (`MfldOps`) -> *returns `Store\<any\>`* 
* - Retrieve an untyped reference to the store specified by name by omitting `store_ops` -> *returns `Store\<any\>`*
* @param {string} store_name
* @param {StoreOptions<any> | any} store_ops
* @return {Store<any>}
*/
(store_name,store_ops)=>v(store_name,store_ops),get:
/**!
 * - Retrieve a Manifold store by name. *returns `Store\<any\>`*
 * @param {string} store_name
 * @return {Store<any>}
 */
store_name=>v(store_name),func:
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
(new_ops,profile_name)=>{return t=new_ops,void((e=profile_name)?A.profiles={...A.profiles,[e]:t}:A={...A,...t})

;/**!
 * @param {Partial<MfldOps>} newops 
 * @param {string} [profileName] 
 */
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
t=>{"string"==typeof t&&(t=document.querySelector(t)),k(t)}}
export{O as Mfld}
//# sourceMappingURL=mfld.mod.js.map
