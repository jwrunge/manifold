let t="mf_",e=/, {0,}/g,o=()=>`${Date.now()}.${Math.floor(1e5*Math.random())}`,n=(e,o)=>{let n=e.profiles?.[o.dataset?.override||""],i={...e,...n}
for(let e in o.dataset)for(let n of["fetch","trans"])if(e.startsWith(`${t}${n}_`))try{let t=e.split("_")[1],r=o.dataset[e]
r?.match(/\{\[/)&&(r=JSON.parse(r)),parseInt(r)&&(r=parseInt(r)),i[n][t]=r}catch(t){console.error(t)}return i},i=(t,o,n)=>{try{let[i,r]=t?.split(/\s{1,}as\s{1,}/)||[t,"value"],s=`return ${i?.match(/^\s{0,}(function)?\(.{0,}\)(=>)?\s{0,}/)?`(${i})()`:i}`,l=r?.split?.(e)?.map?.((t=>t.trim()))||["value"]||[]
return{func:new Function("$el","$st","$fn",o||"$val",n||"$key",s),as:l}}catch(t){return console.error(t),{}}}
function r(e,o,n){o?.preventDefault()
let i=e.dataset?.[`${t}pushstate`],r=n
switch(i){case"":break
case void 0:return
default:r=`#${i}`}history.pushState(null,"",r)}let s=[],l=0,f=[],u=t=>{s.push(t),l||(l=requestAnimationFrame(d))},a=(t,e,o,n)=>{if(!(n.trans?.smart??1))return
let{paddingTop:i,paddingBottom:r}=e instanceof Element?getComputedStyle(e):{paddingTop:0,paddingBottom:0},s=document.createElement("div")
s.style.height=`calc(${Math.abs(o-(t?.clientHeight||0))}px - ${i} - ${r})`,e?.after(s)},c=(t,e)=>{if(!e.trans?.smart??1)return
let o=(e?.trans?.dur?.[0]||e?.trans?.dur||600)/2
u((()=>{t?.animate?.([{height:""},{height:`${t.clientHeight||0}px`}],o)}))},d=()=>{l=0
for(let t of s){if("function"==typeof t){t()
continue}let e=t.out?t.out.clientHeight:0,o="inner"==t.relation
if("prepend"==t.relation)a?.(t.in,t.out,e,t.ops),p(t.in,"in",t.ops,(()=>{t.out?.prepend(t.in),c?.(t.in,t.ops)}))
else{if(["inner","outer"].includes(t.relation)){let e=t.out?.cloneNode(!0)
e&&(t.out?.after(e),o&&(e.style.border="none",t.out.replaceChildren()),p(e,"out",t.ops,void 0,t.out,o))}a?.(t.in,t.out,e,t.ops),p(t.in,"in",t.ops,(()=>{"outer"==t.relation?t.out?.replaceWith(t.in):t.out?.appendChild(t.in),c?.(t.in,t.ops)}))}t.done?.(t.in)}f.forEach((t=>t())),f=[],s=[]},p=(e,o,n,i,r,s=!1,l)=>{if(e?.nodeType==Node.TEXT_NODE&&(e.replaceWith(document?.createElement("div")),e.textContent=e.textContent),e){const f=Array.isArray(n.trans?.dur)?n.trans?.dur["in"==o?0:1]||n.trans?.dur[0]:n.trans?.dur||0,a=n?.trans?.class||`${t}trans`
if(e?.classList?.add(a),n.trans?.hooks?.[`${o}-start`]?.(e),"out"==o){if(!(r=r||e))return
let t={};(n.trans?.smart??1)&&!s&&(t=h(r)),u((()=>{(n.trans?.smart??1)&&s&&r&&(t=h(r)),(n.trans?.smart??1)&&(e.style.position="fixed",e.style.width=t.w,e.style.left=t.left,e.style.top=t.top,e.style.margin="0"),f&&(e.style.transitionDuration=`${f}ms`),e.classList?.add("out")}))}else e?.classList?.add("in"),f&&(e.style.transitionDuration=`${f}ms`),i?.(),setTimeout((()=>{u((()=>{setTimeout((()=>u((()=>e?.classList?.remove(o)))),0)}))}),n.trans?.swap||0)
setTimeout((()=>{u((()=>{"out"==o&&e?.remove(),e?.classList?.remove(a),n.trans?.hooks?.[`${o}-end`]?.(e),e.style.transitionDuration="","in"==o&&l?.(e)}))}),f+("in"==o&&n.trans?.swap||0))}},h=t=>{let e=getComputedStyle(t),o=t.getBoundingClientRect()
return{w:`calc(${t.clientWidth}px - ${e.paddingLeft} - ${e.paddingRight})`,left:`calc(${o.left}px + ${m.scrollX}px)`,top:`calc(${o.top}px + ${m.scrollY}px)`}},$=(t,e)=>{let o=m.MFLD.st.get(t)
return e?o?o.t(t,e):new y(t,e):o||new y(t,e)},m=window
m.MFLD||(m.MFLD={st:new Map,mut:new Map,$st:new Proxy($,{get:(t,e)=>t(e)?.value,set:(t,e,o)=>{let n=e.split(/[\.\[\]\?]{1,}/g).map((t=>parseFloat(t.trim())||t.trim())),i=t(n[0]),r=i.value
for(let t of n.slice(1)||[])r=r[t]
return r=o,i.update(r),!0}}),$fn:{}})
let v=t=>{if(!t)return 0
if("number"==typeof t||!0===t)return t
if(t instanceof Map||t instanceof Set)return v(Array.from(t.entries()||t))
let e=0
for(let o of(new TextEncoder).encode(t?.toString()||""))e=(e<<5)-e+o
return e}
class y{o=void 0
i=new Map
l=void 0
u=new Set
p=new Set
h
$
constructor(t,e){return this.t(t,e)}t(t,e){if(this.name=t,this.h=e?.scope||document.currentScript||"global",m.MFLD.st.set(t,this),this.h instanceof Element){let t=m.MFLD.mut.get(this.h)||{toRemove:new Set,observer:null}
t.observer||(t.observer=new MutationObserver((e=>{for(let o of e)if("childList"==o.type)for(let e of o.removedNodes)if(e instanceof Element)for(let o of t.toRemove)if(o.h==e){let e=this.h
g(o),t.observer?.disconnect(),t.toRemove.delete(o),MFLD.mut.delete(e)}})),t.observer.observe(this.h?.parentElement,{childList:!0})),t.toRemove.add(this),MFLD.mut.set(this.h,t)}return e?.upstream?.map((t=>{let e=$(t)
return this.u.add(e),e.p.add(this),e})),this.value=e?.value,this.o=e?.updater,this.m(),this}sub(t,e,n=!0){this.i.set(e||o(),t),n&&t?.(this.value)}update(t){this.$&&clearTimeout(this.$),this.$=setTimeout((()=>{u((()=>{let e="function"==typeof t?t?.(this.value):t,o=v(e)
if(o!==this.l){this.value=e,this.l=o
for(let t of this.p)t.m()
for(let[t,e]of this?.i||[])e?.(this.value,t)}return this.value}))}),0)}m(){let t=this.o?.(Array.from(this.u)?.map((t=>t?.value))||[],this?.value)
this.update(void 0===t?this.value:t)}}let g=t=>{m.MFLD.st.delete(t?.name||""),t=void 0},w=(e,o,n,s,l,f,a)=>{let c=async o=>{o?.preventDefault(),o?.stopPropagation(),l||(l=(o?.target)?.method||"get")
let c=n?.fetch?.externals?.find((t=>s?.startsWith(t.domain)))||!s.match(/^https?:\/\//)||s.includes(location.origin)?{scripts:!0,styles:!0}:void 0,d=f?.(e,k,N)||a,p=Array.isArray(d)?d[0]:"$form"==d?new FormData(e):d
if(f){let t=Array.isArray(d)?d?.map((t=>$(t).value))||[]:[p]
p=f?.(...t)}let h=await fetch(s,{...n?.fetch?.request||{},headers:{...n?.fetch?.request?.headers,MFLD:"true"},method:l,body:"$form"==d||"string"==typeof p?p:JSON.stringify(p)}).catch((t=>{n?.fetch?.err?.(t)})),m=h?.status
if(m&&0==n?.fetch?.onCode?.(m,h))return
let v=await(h?.[n?.fetch?.resType||"text"]())
for(let o of["append","prepend","inner","outer"]){let i=e.dataset[`${t}${o}`]
if(void 0===i)continue
let[r,s]=i?.split("->").map((t=>t.trim()))||[],l=(new DOMParser)?.parseFromString?.(v,"text/html")
l&&(c?.styles||l.querySelectorAll("style").forEach((t=>t.parentNode?.removeChild(t))),c?.scripts&&l.querySelectorAll("script").forEach((t=>{let e=document.createElement("script")
e.src=t.src,document.head.appendChild(e)})),u({in:l.querySelector(r||"body"),out:s?document.querySelector(s):e,relation:o,ops:n,done:t=>{D(t)}}))}let y=e.dataset?.[`${t}resolve`],g=i(y||"")?.func
g?.(v),r(e,o,s)}
"$mount"==o?c():e.addEventListener(o,c)}
function b(t,e,o,n=!1){let i=n?"previousElementSibling":"nextElementSibling"
return e?.(t)?t:b((o?.(t)||t)?.[i],e,o,n)}let x=(t,e)=>$(o(),{upstream:[...t||[]],updater:()=>e?.func?.(e.observeEl,F,A),scope:e?.observeEl}),M=(t,e,o,n)=>{x(n,{observeEl:t,func:()=>(t.dispatchEvent(new CustomEvent(e)),o?.(t,F,A))})},S=(t,e,o)=>{let n=e=>{o?.(t,F,A),r(t,e)}
"$mount"==e?n():t.addEventListener(e,n)},_=(e,o,n,r,s,l)=>{let f,a,c=document.createElement("template"),d=(t=>{let e="TEMPLATE"
if(t.tagName==e)return t
let o=document.createElement(e)
return o.content.appendChild(t.cloneNode(!0)),t.replaceWith(o),o})(e.cloneNode(!0)),h=o.match(/if|else/),$=o.match(/(else|elseif)(\s|$)/),m=[]
if(c.classList.add(`${o}-start`),d.classList.add(`${o}-end`),e.before(c),e.after(d),e.remove(),h){if($){let e=b(c,(e=>e?.classList?.contains(`${t}if-end`)),null,!0)
b(e,(t=>t==d),(e=>{e?.dataset?.[`${t}cstore`]&&m.push(e?.dataset?.[`${t}cstore`])}))}a=(t,e,o)=>{if($)for(let t of m)if(e[t])return!1
return"else"==$?.[0]||1==r?.(t,e,o)}}f=x([...s,...m],{func:h?a:r,observeEl:d}),d.dataset[`${t}cstore`]=f.name,f.sub((t=>{void 0!==t&&u((()=>{b(c?.nextElementSibling,(t=>t?.classList?.contains(`${o}-end`)),(t=>p(t,"out",l,(()=>t?.remove())))),h&&!t||((t,e)=>{if(t instanceof Map)for(const[o,n]of t.entries())e(o,n)
else try{let o=Array.from(t||[])
if(o?.length)o.forEach(e)
else for(let o in t)e(o,t[o])}catch(e){console.error(`${t} is not iterable`)}})(o.match(/each/)?t:[t],((t,o)=>{let r=d.cloneNode(!0)
if(!h){let s=d?.innerHTML?.replace(/\$:{([^}]*)}/g,((r,s)=>i(s,n[0],n[1])?.func?.(e,F,A,t,o)||""))||""
r?.innerHTML&&(r.innerHTML=s)}for(let e of r.content.children)e?.innerHTML||(e.innerHTML=t),d.before(e),p(e,"in",l)}))}))}))},T={},E=["bind","sync","templ","if","elseif","else","each","get","head","post","put","delete","patch"].map((e=>`${t}${e}`))
m.addEventListener("popstate",(()=>{location.reload()}))
let{$fn:A,$st:F}=m.MFLD,D=r=>{if(r?.nodeType==Node.TEXT_NODE)return
let s=(r||document.body).querySelectorAll(`[data-${E.join("],[data-")}],a,form`)
for(let r of s){let s=n(T,r)
if(r.id||(r.id=o()),void 0!==r.dataset?.[`${t}promote`]){let[t,e,o,n]="A"==r.tagName?["get",r.href,[],"click"]:[r.method.toLowerCase(),r.action,"$form","submit"]
if(e)continue}for(let o in r.dataset)if(E.includes(o))for(let n of r.dataset?.[o]?.split(";;")||[]){let l=n?.split(/\s*->\s*/g),f=o.match(/get|head|post|put|delete|patch/)&&l.pop()||"",[u,a]=l.reverse(),c=a?.match(/[^\(\)]{1,}/g)?.pop()?.split(e)?.map((t=>t.trim())),d=Array.from(new Set([...u?.matchAll(/\$st\.(\w{1,})/g)].map((t=>t[1])))),{func:p,as:h}=i(u)
if(o.match(/each|templ|if|else/))_(r,o,h||[],p,d,s)
else{c?.length||(c=[""])
for(let e of c)o.match(/bind/)?M(r,e,p,d):o.match(/sync/)?S(r,e,p):w(r,e,s,f,o.replace(t,""),p,d)}}}},L={store:
/**!
* - Create or overwrite a _typed_ global Manifold store by passing `store_ops` (`MfldOps`) -> *returns `Store\<T\>`* 
* - Retrieve an untyped reference to the store specified by name by omitting `store_ops` -> *returns `Store\<any\>`*
* @template T
* @param {string} store_name
* @param {StoreOptions<T> | T} store_ops
* @return {Store<T>}
*/
(store_name,store_ops)=>(store_ops?.hasOwnProperty("value")||store_ops?.hasOwnProperty("updater")||(store_ops={value:store_ops}),$(store_name,store_ops)),ustore:
/**!
* - Create or overwrite an untyped global Manifold store by passing `store_ops` (`MfldOps`) -> *returns `Store\<any\>`* 
* - Retrieve an untyped reference to the store specified by name by omitting `store_ops` -> *returns `Store\<any\>`*
* @param {string} store_name
* @param {StoreOptions<any> | any} store_ops
* @return {Store<any>}
*/
(store_name,store_ops)=>$(store_name,store_ops),funcs:
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
