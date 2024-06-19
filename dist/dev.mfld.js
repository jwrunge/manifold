let e="mf_",t=/, {0,}/g,n=()=>`${Date.now()}.${Math.floor(1e5*Math.random())}`,o=(t,n)=>{let o=t.profiles?.[n.dataset?.override||""],i={...t,...o}
for(let t in n.dataset)for(let o of["fetch","trans"])if(t.startsWith(`${e}${o}_`))try{let e=t.split("_")[1],r=n.dataset[t]
r?.match(/\{\[/)&&(r=JSON.parse(r)),parseInt(r)&&(r=parseInt(r)),i[o][e]=r}catch(e){console.error(e)}return i},i=(e,n,o)=>{try{let[i,r]=e?.split(/\s{1,}as\s{1,}/)||[e,"value"],s=`return ${i?.match(/^\s{0,}(function)?\(.{0,}\)(=>)?\s{0,}/)?`(${i})()`:i}`,l=r?.split?.(t)?.map?.((e=>e.trim()))||["value"]||[]
return{func:new Function("$el","$st","$fn",n||"$val",o||"$key",s),as:l}}catch(e){return console.error(e),{}}}
let r=[],s=0,l=[],f=e=>{r.push(e),s||(s=requestAnimationFrame(c))},u=(e,t,n,o)=>{if(!(o.trans?.smart??1))return
let{paddingTop:i,paddingBottom:r}=t instanceof Element?getComputedStyle(t):{paddingTop:0,paddingBottom:0},s=document.createElement("div")
s.style.height=`calc(${Math.abs(n-(e?.clientHeight||0))}px - ${i} - ${r})`,t?.after(s)},a=(e,t)=>{if(!t.trans?.smart??1)return
let n=(t?.trans?.dur?.[0]||t?.trans?.dur||600)/2
f((()=>{e?.animate?.([{height:""},{height:`${e.clientHeight||0}px`}],n)}))},c=()=>{s=0
for(let e of r){if("function"==typeof e){e()
continue}let t=e.out?e.out.clientHeight:0,n="inner"==e.relation
if("prepend"==e.relation)u?.(e.in,e.out,t,e.ops),d(e.in,"in",e.ops,(()=>{e.out?.prepend(e.in),a?.(e.in,e.ops)}))
else{if(["inner","outer"].includes(e.relation)){let t=e.out?.cloneNode(!0)
t&&(e.out?.after(t),n&&(t.style.border="none",e.out.replaceChildren()),d(t,"out",e.ops,void 0,e.out,n))}u?.(e.in,e.out,t,e.ops),d(e.in,"in",e.ops,(()=>{"outer"==e.relation?e.out?.replaceWith(e.in):e.out?.appendChild(e.in),a?.(e.in,e.ops)}))}e.done?.(e.in)}l.forEach((e=>e())),l=[],r=[]},d=(t,n,o,i,r,s=!1,l)=>{if(t?.nodeType==Node.TEXT_NODE&&(t.replaceWith(document?.createElement("div")),t.textContent=t.textContent),t){const u=Array.isArray(o.trans?.dur)?o.trans?.dur["in"==n?0:1]||o.trans?.dur[0]:o.trans?.dur||0,a=o?.trans?.class||`${e}trans`
if(t?.classList?.add(a),o.trans?.hooks?.[`${n}-start`]?.(t),"out"==n){if(!(r=r||t))return
let e={};(o.trans?.smart??1)&&!s&&(e=h(r)),f((()=>{(o.trans?.smart??1)&&s&&r&&(e=h(r)),(o.trans?.smart??1)&&(t.style.position="fixed",t.style.width=e.w,t.style.left=e.left,t.style.top=e.top,t.style.margin="0"),u&&(t.style.transitionDuration=`${u}ms`),t.classList?.add("out")}))}else t?.classList?.add("in"),u&&(t.style.transitionDuration=`${u}ms`),i?.(),setTimeout((()=>{f((()=>{setTimeout((()=>f((()=>t?.classList?.remove(n)))),0)}))}),o.trans?.swap||0)
setTimeout((()=>{f((()=>{"out"==n&&t?.remove(),t?.classList?.remove(a),o.trans?.hooks?.[`${n}-end`]?.(t),t.style.transitionDuration="","in"==n&&l?.(t)}))}),u+("in"==n&&o.trans?.swap||0))}},h=e=>{let t=getComputedStyle(e),n=e.getBoundingClientRect()
return{w:`calc(${e.clientWidth}px - ${t.paddingLeft} - ${t.paddingRight})`,left:`calc(${n.left}px + ${$.scrollX}px)`,top:`calc(${n.top}px + ${$.scrollY}px)`}},p=(e,t)=>{let n=$.MFLD.st.get(e)
return t?n?n.t(e,t):new v(e,t):n||new v(e,t)},$=window
$.MFLD||($.MFLD={st:new Map,mut:new Map,$st:new Proxy(p,{get:(e,t)=>e(t)?.value,set:(e,t,n)=>{let o=t.split(/[\.\[\]\?]{1,}/g).map((e=>parseFloat(e.trim())||e.trim())),i=e(o[0]),r=i.value
for(let e of o.slice(1)||[])r=r[e]
return r=n,i.update(r),!0}}),$fn:{}})
let m=e=>{if(!e)return 0
if("number"==typeof e||!0===e)return e
if(e instanceof Map||e instanceof Set)return m(Array.from(e.entries()||e))
let t=0
for(let n of(new TextEncoder).encode(e?.toString()||""))t=(t<<5)-t+n
return t}
class v{o=void 0
i=new Map
l=void 0
u=new Set
h=new Set
p
$
constructor(e,t){return this.t(e,t)}t(e,t){if(this.name=e,this.p=t?.scope||document.currentScript||"global",$.MFLD.st.set(e,this),this.p instanceof Element){let e=$.MFLD.mut.get(this.p)||{toRemove:new Set,observer:null}
e.observer||(e.observer=new MutationObserver((t=>{for(let n of t)if("childList"==n.type)for(let t of n.removedNodes)if(t instanceof Element)for(let n of e.toRemove)if(n.p==t){let t=this.p
g(n),e.observer?.disconnect(),e.toRemove.delete(n),MFLD.mut.delete(t)}})),e.observer.observe(this.p?.parentElement,{childList:!0})),e.toRemove.add(this),MFLD.mut.set(this.p,e)}return t?.upstream?.map((e=>{let t=p(e)
return this.u.add(t),t.h.add(this),t})),this.value=t?.value,this.o=t?.updater,this.m(),this}sub(e,t,o=!0){this.i.set(t||n(),e),o&&e?.(this.value)}update(e){this.$&&clearTimeout(this.$),this.$=setTimeout((()=>{f((()=>{let t="function"==typeof e?e?.(this.value):e,n=m(t)
if(n!==this.l){this.value=t,this.l=n
for(let e of this.h)e.m()
for(let[e,t]of this?.i||[])t?.(this.value,e)}return this.value}))}),0)}m(){let e=this.o?.(Array.from(this.u)?.map((e=>e?.value))||[],this?.value)
this.update(void 0===e?this.value:e)}}let g=e=>{$.MFLD.st.delete(e?.name||""),e=void 0}
function w(e,t,n,o=!1){let i=o?"previousElementSibling":"nextElementSibling"
return t?.(e)?e:w((n?.(e)||e)?.[i],t,n,o)}let y=(e,t)=>p(n(),{upstream:[...e||[]],updater:()=>t?.func?.(t.observeEl,S,M),scope:t?.observeEl}),b=(e,t,n,o)=>{y(o,{observeEl:e,func:()=>(e.dispatchEvent(new CustomEvent(t)),n?.(e,S,M))})},E=(t,n,o)=>{let i=n=>{o?.(t,S,M),function(t,n,o){n?.preventDefault()
let i=t.dataset?.[`${e}pushstate`],r=o
switch(i){case"":break
case void 0:return
default:r=`#${i}`}history.pushState(null,"",r)}(t,n)}
"$mount"==n?i():t.addEventListener(n,i)},T=(t,n,o,r,s,l)=>{let u,a,c=document.createElement("template"),h=(e=>{let t="TEMPLATE"
if(e.tagName==t)return e
let n=document.createElement(t)
return n.content.appendChild(e.cloneNode(!0)),e.replaceWith(n),n})(t.cloneNode(!0)),p=n.match(/if|else/),$=n.match(/(else|elseif)(\s|$)/),m=[]
if(c.classList.add(`${n}-start`),h.classList.add(`${n}-end`),t.before(c),t.after(h),t.remove(),p){if($){let t=w(c,(t=>t?.classList?.contains(`${e}if-end`)),null,!0)
w(t,(e=>e==h),(t=>{t?.dataset?.[`${e}cstore`]&&m.push(t?.dataset?.[`${e}cstore`])}))}a=(e,t,n)=>{if($)for(let e of m)if(console.log(" --- CHECKING",e,t[e]),t[e])return!1
return console.log(`RETURNING ${"else"==$?.[0]||1==r?.(e,t,n)} FOR`,$?.[0],m),"else"==$?.[0]||1==r?.(e,t,n)}}u=y([...s,...m],{func:p?a:r,observeEl:h}),h.dataset[`${e}cstore`]=u.name,u.sub((e=>{void 0!==e&&f((()=>{w(c?.nextElementSibling,(e=>e?.classList?.contains(`${n}-end`)),(e=>d(e,"out",l,(()=>e?.remove())))),p&&!e||((e,t)=>{if(e instanceof Map)for(const[n,o]of e.entries())t(n,o)
else try{let n=Array.from(e||[])
if(n?.length)n.forEach(t)
else for(let n in e)t(n,e[n])}catch(t){console.error(`${e} is not iterable`)}})(n.match(/each/)?e:[e],((e,n)=>{let r=h.cloneNode(!0)
if(!p){let s=h?.innerHTML?.replace(/\$:{([^}]*)}/g,((r,s)=>i(s,o[0],o[1])?.func?.(t,S,M,e,n)||""))||""
r?.innerHTML&&(r.innerHTML=s)}for(let t of r.content.children)t?.innerHTML||(t.innerHTML=e),h.before(t),d(t,"in",l)}))}))}))},_={},x=["bind","sync","templ","if","elseif","else","each","get","head","post","put","delete","patch"].map((t=>`${e}${t}`))
$.addEventListener("popstate",(()=>{location.reload()}))
let{$fn:M,$st:S}=$.MFLD,A={store:
/**!
* - Create or overwrite a _typed_ global Manifold store by passing `store_ops` (`MfldOps`) -> *returns `Store\<T\>`* 
* - Retrieve an untyped reference to the store specified by name by omitting `store_ops` -> *returns `Store\<any\>`*
* @template T
* @param {string} store_name
* @param {StoreOptions<T> | T} store_ops
* @return {Store<T>}
*/
(store_name,store_ops)=>(store_ops?.hasOwnProperty("value")||store_ops?.hasOwnProperty("updater")||(store_ops={value:store_ops}),p(store_name,store_ops)),ustore:
/**!
* - Create or overwrite an untyped global Manifold store by passing `store_ops` (`MfldOps`) -> *returns `Store\<any\>`* 
* - Retrieve an untyped reference to the store specified by name by omitting `store_ops` -> *returns `Store\<any\>`*
* @param {string} store_name
* @param {StoreOptions<any> | any} store_ops
* @return {Store<any>}
*/
(store_name,store_ops)=>p(store_name,store_ops),funcs:
/**!
 * - Add functions to the Manifold function registry in key-value pairs.
 * - Functions must be registered in order to be accessible to HTML elements via `mfBind`, `mfSync`, and `mfResolve`. 
 * - It may still be beneficial to keep a reference to the original function if you need to preserve type information.
 * @param {{ [key: string]: MfldFunc }} funcs
 */
funcs=>{for(let e in funcs)$.MFLD.$fn[e]=funcs[e]},config:
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
e=>{var t;(t=e)&&l.push(t)},register:
/**!
 * - Register Manifold subscriptions on the DOM. *Optional:* Pass an `HTMLElement` or selector string to scope the registration to a specific element.
 * @param {HTMLElement | string | null} [parent]
 */
r=>{"string"==typeof r&&(r=document.querySelector(r)),(r=>{if(r?.nodeType==Node.TEXT_NODE)return
let s=(r||document.body).querySelectorAll(`[data-${x.join("],[data-")}],a,form`)
for(let r of s){let s=o(_,r)
if(r.id||(r.id=n()),void 0!==r.dataset?.[`${e}promote`]){let[e,t,n,o]="A"==r.tagName?["get",r.href,[],"click"]:[r.method.toLowerCase(),r.action,"$form","submit"]
if(t)continue}for(let e in r.dataset)if(x.includes(e))for(let n of r.dataset?.[e]?.split(";;")||[]){let[o,l]=n?.split(/\s*->\s*/).reverse(),f=l?.match(/[^\(\)]{1,}/g)?.pop()?.split(t)?.map((e=>e.trim())),u=[...o?.matchAll(/\$st\.(\w{1,})/g)].map((e=>e[1]))
console.log(r,f,o,u)
let{func:a,as:c}=i(o)
if(e.match(/each|templ|if|else/))T(r,e,c||[],a,u,s)
else{f?.length||(f=[""])
for(let t of f)e.match(/bind/)?b(r,t,a,u):e.match(/sync/)&&E(r,t,a)}}}})(r)}},F=$.MFLD.$st,N=$.MFLD.$fn
export{N as $fn,F as $st,A as Mfld}
//# sourceMappingURL=dev.mfld.js.map
