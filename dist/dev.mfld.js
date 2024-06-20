let t="mf_",e=/, {0,}/g,o=()=>`${Date.now()}.${Math.floor(1e5*Math.random())}`,n=(e,o)=>{let n=e.profiles?.[o.dataset?.override||""],i={...e,...n}
for(let e in o.dataset)for(let n of["fetch","trans"])if(e.startsWith(`${t}${n}_`))try{let t=e.split("_")[2],r=o.dataset[e]
r?.match(/\{|\[/)?r=JSON.parse(r):parseInt(r)&&(r=parseInt(r)),Array.isArray(r)&&(r=r.map((t=>parseInt(t)||t))),i[n][t]=r}catch(t){console.error(t)}return i},i=(t,o,n)=>{try{let[i,r]=t?.split(/\s{1,}as\s{1,}/)||[t,"value"],s=`let {$el, $st, $fn, ${o||"$val"}, ${n||"$key"}, $body} = ops;return ${i?.match(/^\s{0,}(function)?\(.{0,}\)(=>)?\s{0,}/)?`(${i})()`:i}`,l=r?.split?.(e)?.map?.((t=>t.trim()))||["value"]||[]
return{func:new Function("ops",s),as:l}}catch(t){return console.error(t),{}}}
function r(e,o,n){o?.preventDefault()
let i=e.dataset?.[`${t}pushstate`],r=n
switch(i){case"":break
case void 0:return
default:r=`#${i}`}history.pushState(null,"",r)}let s=[],l=0,f=[],a=t=>{s.push(t),l||(l=requestAnimationFrame($))},u=(t,e,o,n)=>{if(!(n.trans?.smart??1))return
let{paddingTop:i,paddingBottom:r}=e instanceof Element?getComputedStyle(e):{paddingTop:0,paddingBottom:0},s=document.createElement("div")
s.style.height=`calc(${Math.abs(o-(t?.clientHeight||0))}px - ${i} - ${r})`,e?.after(s)},c=(t,e)=>{if(!e.trans?.smart??1)return
let o=(e?.trans?.dur?.[0]||e?.trans?.dur||600)/2
a((()=>{t?.animate?.([{height:""},{height:`${t.clientHeight||0}px`}],o)}))},$=()=>{l=0
for(let t of s){if("function"==typeof t){t()
continue}let e=t.out?t.out.clientHeight:0,o="inner"==t.relation
if("prepend"==t.relation)u?.(t.in,t.out,e,t.ops),d(t.in,"in",t.ops,(()=>{t.out?.prepend(t.in),c?.(t.in,t.ops)}))
else{if(["inner","outer"].includes(t.relation)){let e=t.out?.cloneNode(!0)
e&&(t.out?.after(e),o&&(e.style.border="none",t.out.replaceChildren()),d(e,"out",t.ops,void 0,t.out,o))}u?.(t.in,t.out,e,t.ops),d(t.in,"in",t.ops,(()=>{"outer"==t.relation?t.out?.replaceWith(t.in):t.out?.appendChild(t.in),c?.(t.in,t.ops)}))}t.done?.(t.in)}f.forEach((t=>t())),f=[],s=[]},d=(e,o,n,i,r,s=!1,l)=>{if(e?.nodeType==Node.TEXT_NODE&&(e.replaceWith(document?.createElement("div")),e.textContent=e.textContent),e){const f=Array.isArray(n.trans?.dur)?n.trans?.dur["in"==o?0:1]||n.trans?.dur[0]:n.trans?.dur||0,u=n?.trans?.class||`${t}trans`
if(e?.classList?.add(u),n.trans?.hooks?.[`${o}-start`]?.(e),"out"==o){if(!(r=r||e))return
let t={};(n.trans?.smart??1)&&!s&&(t=p(r)),a((()=>{(n.trans?.smart??1)&&s&&r&&(t=p(r)),(n.trans?.smart??1)&&(e.style.position="fixed",e.style.width=t.w,e.style.left=t.left,e.style.top=t.top,e.style.margin="0"),f&&(e.style.transitionDuration=`${f}ms`),e.classList?.add("out")}))}else e?.classList?.add("in"),f&&(e.style.transitionDuration=`${f}ms`),i?.(),setTimeout((()=>{a((()=>{setTimeout((()=>a((()=>e?.classList?.remove(o)))),0)}))}),n.trans?.swap||0)
setTimeout((()=>{a((()=>{"out"==o&&e?.remove(),e?.classList?.remove(u),n.trans?.hooks?.[`${o}-end`]?.(e),e.style.transitionDuration="","in"==o&&l?.(e)}))}),f+("in"==o&&n.trans?.swap||0))}},p=t=>{let e=getComputedStyle(t),o=t.getBoundingClientRect()
return{w:`calc(${t.clientWidth}px - ${e.paddingLeft} - ${e.paddingRight})`,left:`calc(${o.left}px + ${m.scrollX}px)`,top:`calc(${o.top}px + ${m.scrollY}px)`}},h=(t,e)=>{let o=m.MFLD.st.get(t)
return e?o?o.t(t,e):new g(t,e):o||new g(t,e)},m=window
m.MFLD||(m.MFLD={st:new Map,mut:new Map,$st:new Proxy(h,{get:(t,e)=>t(e)?.value,set:(t,e,o)=>{let n=e.split(/[\.\[\]\?]{1,}/g).map((t=>parseFloat(t.trim())||t.trim())),i=t(n[0]),r=i.value
for(let t of n.slice(1)||[])r=r[t]
return r=o,i.update(r),!0}}),$fn:{}})
let y=t=>{if(!t)return 0
if("number"==typeof t||!0===t)return t
if(t instanceof Map||t instanceof Set)return y(Array.from(t.entries()||t))
let e=0
for(let o of(new TextEncoder).encode(t?.toString()||""))e=(e<<5)-e+o
return e}
class g{o=void 0
i=new Map
l=void 0
u=new Set
$=new Set
p
h
constructor(t,e){return this.t(t,e)}t(t,e){if(this.name=t,this.p=e?.scope||document.currentScript||"global",m.MFLD.st.set(t,this),this.p instanceof Element){let t=m.MFLD.mut.get(this.p)||{toRemove:new Set,observer:null}
t.observer||(t.observer=new MutationObserver((e=>{for(let o of e)if("childList"==o.type)for(let e of o.removedNodes)if(e instanceof Element)for(let o of t.toRemove)if(o.p==e){let e=this.p
v(o),t.observer?.disconnect(),t.toRemove.delete(o),MFLD.mut.delete(e)}})),t.observer.observe(this.p?.parentElement,{childList:!0})),t.toRemove.add(this),MFLD.mut.set(this.p,t)}return e?.upstream?.map((t=>{let e=h(t)
return this.u.add(e),e.$.add(this),e})),this.value=e?.value,this.o=e?.updater,this.m(),this}sub(t,e,n=!0){this.i.set(e||o(),t),n&&t?.(this.value)}update(t){this.h&&clearTimeout(this.h),this.h=setTimeout((()=>{a((()=>{let e="function"==typeof t?t?.(this.value):t,o=y(e)
if(o!==this.l){this.value=e,this.l=o
for(let t of this.$)t.m()
for(let[t,e]of this?.i||[])e?.(this.value,t)}return this.value}))}),0)}m(){let t=this.o?.(Array.from(this.u)?.map((t=>t?.value))||[],this?.value)
this.update(void 0===t?this.value:t)}}let v=t=>{m.MFLD.st.delete(t?.name||""),t=void 0},w=(e,o,n,s,l,f)=>{let u=async o=>{o?.preventDefault(),o?.stopPropagation(),l||(l=(o?.target)?.method||"get")
let u=n?.fetch?.externals?.find((t=>"$origin"==t.domain&&s.startsWith(location.origin)||s?.startsWith(t.domain)))
u||(u=s.startsWith(location.origin)?{domain:"$origin",scripts:"selected",styles:"selected"}:void 0)
let c=f?.({$el:e,$st:k,$fn:N}),$="$form"==c?new FormData(e):c,d=await fetch(s,{...n?.fetch?.request||{},headers:{...n?.fetch?.request?.headers,MFLD:"true"},method:l,body:"$form"==c||"string"==typeof $?$:JSON.stringify($)}).catch((t=>{n?.fetch?.err?.(t)})),p=d?.status
if(p&&0==n?.fetch?.onCode?.(p,d))return
let h=await(d?.[n?.fetch?.resType||"text"]())
for(let o of["append","prepend","inner","outer"]){let i=e.dataset[`${t}${o}`]
if(void 0===i)continue
let[r,s]=i?.split("->").map((t=>t.trim()))||[],l=(new DOMParser)?.parseFromString?.(h,"text/html"),f=l.querySelector(r||"body")
if(l){let t=[]
u?.styles||l.querySelectorAll("style").forEach((t=>t.parentNode?.removeChild(t))),("all"==u?.scripts?l:f).querySelectorAll("script")?.forEach((e=>{["all","selected"].includes(u?.scripts||"")&&t.push(e),e.parentNode?.removeChild(e)})),a({in:f,out:s?document.querySelector(s):e,relation:o,ops:n,done:e=>{D(e)
for(let o of t){let t=document.createElement("script")
t.textContent=o.textContent,e.appendChild(t)}}})}}let m=e.dataset?.[`${t}resolve`],y=i(m||"")?.func
y?.({$el:e,$st:k,$fn:N,$body:h}),r(e,o,s)}
"$mount"==o?u():e.addEventListener(o,u)}
function b(t,e,o,n=!1){let i=n?"previousElementSibling":"nextElementSibling"
return e?.(t)?t:b((o?.(t)||t)?.[i],e,o,n)}let x=(t,e,n)=>h(o(),{upstream:t,updater:()=>e?.({$el:n,$st:F,$fn:E}),scope:n}),M=(t,e,o)=>{x(o,(()=>e?.({$el:t,$st:F,$fn:E})),t)},S=(t,e,o)=>{let n=e=>{o?.({$el:t,$st:F,$fn:E}),r(t,e)}
"$mount"==e?n():t.addEventListener(e,n)},_=(e,o,n,r,s,l)=>{let f,u,c=document.createElement("template"),$=(t=>{let e="TEMPLATE"
if(t.tagName==e)return t
let o=document.createElement(e)
return o.content.appendChild(t.cloneNode(!0)),t.replaceWith(o),o})(e.cloneNode(!0)),p=o.match(/if|else/),h=o.match(/(else|elseif)(\s|$)/),m=[]
if(c.classList.add(`${o}-start`),$.classList.add(`${o}-end`),e.before(c),e.after($),e.remove(),p){if(h){let e=b(c,(e=>e?.classList?.contains(`${t}if-end`)),null,!0)
b(e,(t=>t==$),(e=>{e?.dataset?.[`${t}cstore`]&&m.push(e?.dataset?.[`${t}cstore`])}))}u=({$el:t,$st:e,$fn:o})=>{if(h)for(let t of m)if(e[t])return!1
return"else"==h?.[0]||1==r?.({$el:t,$st:e,$fn:o})}}f=x([...s,...m],p?u:r,$),$.dataset[`${t}cstore`]=f.name,f.sub((t=>{void 0!==t&&a((()=>{b(c?.nextElementSibling,(t=>t?.classList?.contains(`${o}-end`)),(t=>d(t,"out",l,(()=>t?.remove())))),p&&!t||((t,e)=>{if(t instanceof Map)for(const[o,n]of t.entries())e(o,n)
else try{let o=Array.from(t||[])
if(o?.length)o.forEach(e)
else for(let o in t)e(o,t[o])}catch(e){console.error(`${t} is not iterable`)}})(o.match(/each/)?t:[t],((t,o)=>{let r=$.cloneNode(!0)
if(!p){let s=$?.innerHTML?.replace(/\$:{([^}]*)}/g,((r,s)=>i(s,n[0],n[1])?.func?.({$el:e,$st:F,$fn:E,[n[0]]:t,[n[1]]:o})||""))||""
r?.innerHTML&&(r.innerHTML=s)}for(let e of r.content.children)e?.innerHTML||(e.innerHTML=t),$.before(e),d(e,"in",l)}))}))}))},T={},A=["bind","sync","templ","if","elseif","else","each","get","head","post","put","delete","patch","promote"].map((e=>`${t}${e}`))
m.addEventListener("popstate",(()=>{location.reload()}))
let{$fn:E,$st:F}=m.MFLD,D=r=>{if(r?.nodeType==Node.TEXT_NODE)return
let s=(r||document.body).querySelectorAll(`[data-${A.join("],[data-")}],a,form`)
for(let r of s){let s=n(structuredClone(T),r)
if(r.id||(r.id=o()),void 0!==r.dataset?.[`${t}promote`]){let[t,e,o,n]="A"==r.tagName?["get",r.href,void 0,"click"]:[r.method.toLowerCase(),r.action,()=>"$form","submit"]
if(e){w(r,n,s,e,t,o)
continue}}for(let o in r.dataset)if(A.includes(o))for(let n of r.dataset?.[o]?.split(";;")||[]){let l=!!o.match(/get|head|post|put|delete|patch/),f=n?.split(/\s*->\s*/g),a=l&&f.pop()||"",u=l||o.match(/sync/)?f.shift()?.match(/[^\(\)]{1,}/g)?.pop()?.split(e)?.map((t=>t.trim())):[]||[],c=f?.[0]||"",$=Array.from(new Set([...c?.matchAll(/\$st\.(\w{1,})/g)].map((t=>t[1])))),{func:d,as:p}=i(c)
if(o.match(/each|templ|if|else/))_(r,o,p||[],d,$,s)
else{u?.length||(u=[""])
for(let e of u)o.match(/bind/)?M(r,d,$):o.match(/sync/)?S(r,e,d):w(r,e,s,a,o.replace(t,""),d)}}}},L={store:
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
(store_name,store_ops)=>h(store_name,store_ops),funcs:
/**!
 * - Add functions to the Manifold function registry in key-value pairs.
 * - Functions must be registered in order to be accessible to HTML elements via `mfBind`, `mfSync`, and `mfResolve`. 
 * - It may still be beneficial to keep a reference to the original function if you need to preserve type information.
 * @param {{ [key: string]: MfldFunc }} funcs
 */
funcs=>{for(let t in funcs)m.MFLD.$fn[t]=funcs[t]},config:
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
t=>{var e;(e=t)&&f.push(e)},register:
/**!
 * - Register Manifold subscriptions on the DOM. *Optional:* Pass an `HTMLElement` or selector string to scope the registration to a specific element.
 * @param {HTMLElement | string | null} [parent]
 */
t=>{"string"==typeof t&&(t=document.querySelector(t)),D(t)}},k=m.MFLD.$st,N=m.MFLD.$fn
export{N as $fn,k as $st,L as Mfld}
//# sourceMappingURL=dev.mfld.js.map
