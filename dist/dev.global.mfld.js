let e="mf_",t=/, {0,}/g,i=()=>`${Date.now()}.${Math.floor(1e5*Math.random())}`,o=(t,i)=>{let o=t.profiles?.[i.dataset?.override||""],n={...t,...o}
for(let t in i.dataset)for(let o of["fetch","trans"])if(t.startsWith(`${e}${o}_`))try{let e=t.split("_")[1],s=i.dataset[t]
s?.match(/\{\[/)&&(s=JSON.parse(s)),parseInt(s)&&(s=parseInt(s)),n[o][e]=s}catch(e){console.error(e)}return n},n=(e,i,o)=>{try{let[n,s]=e?.split(/\s{1,}as\s{1,}/)||[e,"value"],r=`return ${n?.match(/^\s{0,}(function)?\(.{0,}\)(=>)?\s{0,}/)?`(${n})()`:n}`,l=s?.split?.(t)?.map?.((e=>e.trim()))||["value"]||[]
return{func:new Function("$el","$st","$fn",i||"$val",o||"$key",r),as:l}}catch(e){return console.error(e),{}}}
let s=[],r=0,l=[],f=e=>{s.push(e),r||(r=requestAnimationFrame(c))},u=(e,t,i,o)=>{if(!(o.trans?.smart??1))return
let{paddingTop:n,paddingBottom:s}=t instanceof Element?getComputedStyle(t):{paddingTop:0,paddingBottom:0},r=document.createElement("div")
r.style.height=`calc(${Math.abs(i-(e?.clientHeight||0))}px - ${n} - ${s})`,t?.after(r)},a=(e,t)=>{if(!t.trans?.smart??1)return
let i=(t?.trans?.dur?.[0]||t?.trans?.dur||600)/2
f((()=>{e?.animate?.([{height:""},{height:`${e.clientHeight||0}px`}],i)}))},c=()=>{r=0
for(let e of s){if("function"==typeof e){e()
continue}let t=e.out?e.out.clientHeight:0,i="inner"==e.relation
if("prepend"==e.relation)u?.(e.in,e.out,t,e.ops),h(e.in,"in",e.ops,(()=>{e.out?.prepend(e.in),a?.(e.in,e.ops)}))
else{if(["inner","outer"].includes(e.relation)){let t=e.out?.cloneNode(!0)
t&&(e.out?.after(t),i&&(t.style.border="none",e.out.replaceChildren()),h(t,"out",e.ops,void 0,e.out,i))}u?.(e.in,e.out,t,e.ops),h(e.in,"in",e.ops,(()=>{"outer"==e.relation?e.out?.replaceWith(e.in):e.out?.appendChild(e.in),a?.(e.in,e.ops)}))}e.done?.(e.in)}l.forEach((e=>e())),l=[],s=[]},h=(t,i,o,n,s,r=!1,l)=>{if(t?.nodeType==Node.TEXT_NODE&&(t.replaceWith(document?.createElement("div")),t.textContent=t.textContent),t){const u=Array.isArray(o.trans?.dur)?o.trans?.dur["in"==i?0:1]||o.trans?.dur[0]:o.trans?.dur||0,a=o?.trans?.class||`${e}trans`
if(t?.classList?.add(a),o.trans?.hooks?.[`${i}-start`]?.(t),"out"==i){if(!(s=s||t))return
let e={};(o.trans?.smart??1)&&!r&&(e=d(s)),f((()=>{(o.trans?.smart??1)&&r&&s&&(e=d(s)),(o.trans?.smart??1)&&(t.style.position="fixed",t.style.width=e.w,t.style.left=e.left,t.style.top=e.top,t.style.margin="0"),u&&(t.style.transitionDuration=`${u}ms`),t.classList?.add("out")}))}else t?.classList?.add("in"),u&&(t.style.transitionDuration=`${u}ms`),n?.(),setTimeout((()=>{f((()=>{setTimeout((()=>f((()=>t?.classList?.remove(i)))),0)}))}),o.trans?.swap||0)
setTimeout((()=>{f((()=>{"out"==i&&t?.remove(),t?.classList?.remove(a),o.trans?.hooks?.[`${i}-end`]?.(t),t.style.transitionDuration="","in"==i&&l?.(t)}))}),u+("in"==i&&o.trans?.swap||0))}},d=e=>{let t=getComputedStyle(e),i=e.getBoundingClientRect()
return{w:`calc(${e.clientWidth}px - ${t.paddingLeft} - ${t.paddingRight})`,left:`calc(${i.left}px + ${$.scrollX}px)`,top:`calc(${i.top}px + ${$.scrollY}px)`}},p=(e,t)=>{let i=$.MFLD.st.get(e)
return t?i?i.t(e,t):new v(e,t):i||new v(e,t)},$=window
$.MFLD||($.MFLD={st:new Map,mut:new Map,$st:new Proxy(p,{get:(e,t)=>e(t)?.value,set:(e,t,i)=>{let o=t.split(/[\.\[\]\?]{1,}/g).map((e=>parseFloat(e.trim())||e.trim())),n=e(o[0]),s=n.value
for(let e of o.slice(1)||[])s=s[e]
return s=i,n.update(s),!0}}),$fn:{}})
let m=e=>{if(!e)return 0
if("number"==typeof e||!0===e)return e
if(e instanceof Map||e instanceof Set)return m(Array.from(e.entries()||e))
let t=0
for(let i of(new TextEncoder).encode(e?.toString()||""))t=(t<<5)-t+i
return t}
class v{i=void 0
o=new Map
l=void 0
u=new Set
h=new Set
p
$
constructor(e,t){return this.t(e,t)}t(e,t){if(this.name=e,this.p=t?.scope||document.currentScript||"global",$.MFLD.st.set(e,this),this.p instanceof Element){let e=$.MFLD.mut.get(this.p)||{toRemove:new Set,observer:null}
e.observer||(e.observer=new MutationObserver((t=>{for(let i of t)if("childList"==i.type)for(let t of i.removedNodes)if(t instanceof Element)for(let i of e.toRemove)if(i.p==t){let t=this.p
g(i),e.observer?.disconnect(),e.toRemove.delete(i),MFLD.mut.delete(t)}})),e.observer.observe(this.p?.parentElement,{childList:!0})),e.toRemove.add(this),MFLD.mut.set(this.p,e)}return t?.upstream?.map((e=>{let t=p(e)
return this.u.add(t),t.h.add(this),t})),this.value=t?.value,this.i=t?.updater,this.m(),this}sub(e,t,o=!0){this.o.set(t||i(),e),o&&e?.(this.value)}update(e){this.$&&clearTimeout(this.$),this.$=setTimeout((()=>{f((()=>{let t="function"==typeof e?e?.(this.value):e,i=m(t)
if(i!==this.l){this.value=t,this.l=i
for(let e of this.h)e.m()
for(let[e,t]of this?.o||[])t?.(this.value,e)}return this.value}))}),0)}m(){let e=this.i?.(Array.from(this.u)?.map((e=>e?.value))||[],this?.value)
this.update(void 0===e?this.value:e)}}let g=e=>{$.MFLD.st.delete(e?.name||""),e=void 0}
function w(e,t,i,o=!1){let n=o?"previousElementSibling":"nextElementSibling"
return t?.(e)?e:w((i?.(e)||e)?.[n],t,i,o)}let y=(e,t)=>p(i(),{upstream:[...e||[]],updater:()=>t?.func?.(t.observeEl,S,x),scope:t?.observeEl}),b=(e,t,i,o)=>{y(o,{observeEl:e,func:()=>(e.dispatchEvent(new CustomEvent(t)),i?.(e,S,x))})},T=(t,i,o)=>{let n=i=>{o?.(t,S,x),function(t,i,o){i?.preventDefault()
let n=t.dataset?.[`${e}pushstate`],s=o
switch(n){case"":break
case void 0:return
default:s=`#${n}`}history.pushState(null,"",s)}(t,i)}
"$mount"==i?n():t.addEventListener(i,n)},E=(t,i,o,s,r,l)=>{let u,a,c=document.createElement("template"),d=(e=>{let t="TEMPLATE"
if(e.tagName==t)return e
let i=document.createElement(t)
return i.content.appendChild(e.cloneNode(!0)),e.replaceWith(i),i})(t.cloneNode(!0)),p=i.match(/if|else/),$=i.match(/(else|elseif)(\s|$)/),m=[]
if(c.classList.add(`${i}-start`),d.classList.add(`${i}-end`),t.before(c),t.after(d),t.remove(),p){if($){let t=w(c,(t=>t?.classList?.contains(`${e}if-end`)),null,!0)
w(t,(e=>e==d),(t=>{t?.dataset?.[`${e}cstore`]&&m.push(t?.dataset?.[`${e}cstore`])}))}a=(e,t,i)=>{if($)for(let e of m)if(console.log(" --- CHECKING",e,t[e]),t[e])return!1
return console.log(`RETURNING ${"else"==$?.[0]||1==s?.(e,t,i)} FOR`,$?.[0],m),"else"==$?.[0]||1==s?.(e,t,i)}}u=y([...r,...m],{func:p?a:s,observeEl:d}),d.dataset[`${e}cstore`]=u.name,u.sub((e=>{void 0!==e&&f((()=>{w(c?.nextElementSibling,(e=>e?.classList?.contains(`${i}-end`)),(e=>h(e,"out",l,(()=>e?.remove())))),p&&!e||((e,t)=>{if(e instanceof Map)for(const[i,o]of e.entries())t(i,o)
else try{let i=Array.from(e||[])
if(i?.length)i.forEach(t)
else for(let i in e)t(i,e[i])}catch(t){console.error(`${e} is not iterable`)}})(i.match(/each/)?e:[e],((e,i)=>{let s=d.cloneNode(!0)
if(!p){let r=d?.innerHTML?.replace(/\$:{([^}]*)}/g,((s,r)=>n(r,o[0],o[1])?.func?.(t,S,x,e,i)||""))||""
s?.innerHTML&&(s.innerHTML=r)}for(let t of s.content.children)t?.innerHTML||(t.innerHTML=e),d.before(t),h(t,"in",l)}))}))}))},_={},M=["bind","sync","templ","if","elseif","else","each","get","head","post","put","delete","patch"].map((t=>`${e}${t}`))
$.addEventListener("popstate",(()=>{location.reload()}))
let{$fn:x,$st:S}=$.MFLD,A={store:
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
s=>{"string"==typeof s&&(s=document.querySelector(s)),(s=>{if(s?.nodeType==Node.TEXT_NODE)return
let r=(s||document.body).querySelectorAll(`[data-${M.join("],[data-")}],a,form`)
for(let s of r){let r=o(_,s)
if(s.id||(s.id=i()),void 0!==s.dataset?.[`${e}promote`]){let[e,t,i,o]="A"==s.tagName?["get",s.href,[],"click"]:[s.method.toLowerCase(),s.action,"$form","submit"]
if(t)continue}for(let e in s.dataset)if(M.includes(e))for(let i of s.dataset?.[e]?.split(";;")||[]){let[o,l]=i?.split(/\s*->\s*/).reverse(),f=l?.match(/[^\(\)]{1,}/g)?.pop()?.split(t)?.map((e=>e.trim())),u=[...o?.matchAll(/\$st\.(\w{1,})/g)].map((e=>e[1]))
console.log(s,f,o,u)
let{func:a,as:c}=n(o)
if(e.match(/each|templ|if|else/))E(s,e,c||[],a,u,r)
else{f?.length||(f=[""])
for(let t of f)e.match(/bind/)?b(s,t,a,u):e.match(/sync/)&&T(s,t,a)}}}})(s)}}
$.MFLD.$st,$.MFLD.$fn,globalThis.Mfld||(globalThis.Mfld=A)
//# sourceMappingURL=dev.global.mfld.js.map
