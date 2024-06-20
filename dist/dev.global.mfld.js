let t="mf_",e=/, {0,}/g,o=()=>`${Date.now()}.${Math.floor(1e5*Math.random())}`,s=(e,o)=>{let s=e.profiles?.[o.dataset?.override||""],i={...e,...s}
for(let e in o.dataset)for(let s of["fetch","trans"])if(e.startsWith(`${t}${s}_`))try{let t=e.split("_")[2],n=o.dataset[e]
n?.match(/\{|\[/)?n=JSON.parse(n):parseInt(n)&&(n=parseInt(n)),Array.isArray(n)&&(n=n.map((t=>parseInt(t)||t))),i[s][t]=n}catch(t){console.error(t)}return i},i=(t,o,s)=>{try{let[i,n]=t?.split(/\s{1,}as\s{1,}/)||[t,"value"],l=`let {$el, $st, $fn, ${o||"$val"}, ${s||"$key"}, $body} = ops;return ${i?.match(/^\s{0,}(function)?\(.{0,}\)(=>)?\s{0,}/)?`(${i})()`:i}`,r=n?.split?.(e)?.map?.((t=>t.trim()))||["value"]||[]
return{func:new Function("ops",l),as:r}}catch(t){return console.error(t),{}}}
function n(e,o,s){o?.preventDefault()
let i=e.dataset?.[`${t}pushstate`],n=s
switch(i){case"":break
case void 0:return
default:n=`#${i}`}history.pushState(null,"",n)}let l=[],r=0,a=[],f=t=>{l.push(t),r||(r=requestAnimationFrame(d))},u=(t,e,o,s)=>{if(!(s.trans?.smart??1))return
let{paddingTop:i,paddingBottom:n}=e instanceof Element?getComputedStyle(e):{paddingTop:0,paddingBottom:0},l=document.createElement("div")
l.style.height=`calc(${Math.abs(o-(t?.clientHeight||0))}px - ${i} - ${n})`,e?.after(l)},c=(t,e)=>{if(!e.trans?.smart??1)return
let o=(e?.trans?.dur?.[0]||e?.trans?.dur||600)/2
f((()=>{t?.animate?.([{height:""},{height:`${t.clientHeight||0}px`}],o)}))},d=()=>{r=0
for(let t of l){if("function"==typeof t){t()
continue}let e=t.out?t.out.clientHeight:0,o="inner"==t.relation
if("prepend"==t.relation)u?.(t.in,t.out,e,t.ops),$(t.in,"in",t.ops,(()=>{t.out?.prepend(t.in),c?.(t.in,t.ops)}))
else{if(["inner","outer"].includes(t.relation)){let e=t.out?.cloneNode(!0)
e&&(t.out?.after(e),o&&(e.style.border="none",t.out.replaceChildren()),$(e,"out",t.ops,void 0,t.out,o))}u?.(t.in,t.out,e,t.ops),$(t.in,"in",t.ops,(()=>{"outer"==t.relation?t.out?.replaceWith(t.in):t.out?.appendChild(t.in),c?.(t.in,t.ops)}))}t.done?.(t.in)}a.forEach((t=>t())),a=[],l=[]},$=(e,o,s,i,n,l=!1,r)=>{if(e?.nodeType==Node.TEXT_NODE&&(e.replaceWith(document?.createElement("div")),e.textContent=e.textContent),e){const a=Array.isArray(s.trans?.dur)?s.trans?.dur["in"==o?0:1]||s.trans?.dur[0]:s.trans?.dur||0,u=s?.trans?.class||`${t}trans`
if(e?.classList?.add(u),s.trans?.hooks?.[`${o}-start`]?.(e),"out"==o){if(!(n=n||e))return
let t={};(s.trans?.smart??1)&&!l&&(t=h(n)),f((()=>{(s.trans?.smart??1)&&l&&n&&(t=h(n)),(s.trans?.smart??1)&&(e.style.position="fixed",e.style.width=t.w,e.style.left=t.left,e.style.top=t.top,e.style.margin="0"),a&&(e.style.transitionDuration=`${a}ms`),e.classList?.add("out")}))}else e?.classList?.add("in"),a&&(e.style.transitionDuration=`${a}ms`),i?.(),setTimeout((()=>{f((()=>{setTimeout((()=>f((()=>e?.classList?.remove(o)))),0)}))}),s.trans?.swap||0)
setTimeout((()=>{f((()=>{"out"==o&&e?.remove(),e?.classList?.remove(u),s.trans?.hooks?.[`${o}-end`]?.(e),e.style.transitionDuration="","in"==o&&r?.(e)}))}),a+("in"==o&&s.trans?.swap||0))}},h=t=>{let e=getComputedStyle(t),o=t.getBoundingClientRect()
return{w:`calc(${t.clientWidth}px - ${e.paddingLeft} - ${e.paddingRight})`,left:`calc(${o.left}px + ${m.scrollX}px)`,top:`calc(${o.top}px + ${m.scrollY}px)`}},p=(t,e)=>{let o=m.MFLD.st.get(t)
return e?o?o.t(t,e):new y(t,e):o||new y(t,e)},m=window
m.MFLD||(m.MFLD={st:new Map,$st:new Proxy(p,{get:(t,e)=>t(e)?.value,set:(t,e,o)=>{let s=e.split(/[\.\[\]\?]{1,}/g).map((t=>parseFloat(t.trim())||t.trim())),i=t(s[0]),n=i.value
for(let t of s.slice(1)||[])n=n[t]
return n=o,i.update(n),!0}}),$fn:{},comp:{}})
let g=t=>{if(!t)return 0
if("number"==typeof t||!0===t)return t
if(t instanceof Map||t instanceof Set)return g(Array.from(t.entries()||t))
let e=0
for(let o of(new TextEncoder).encode(t?.toString()||""))e=(e<<5)-e+o
return e}
class y{o=void 0
i=new Map
l=void 0
u=new Set
$=new Set
h
p
constructor(t,e){return this.t(t,e)}t(t,e){return this.name=t,this.h=e?.scope||document.currentScript||"global",m.MFLD.st.set(t,this),e?.upstream?.map((t=>{let e=p(t)
return this.u.add(e),e.$.add(this),e})),this.value=e?.value,this.o=e?.updater,this.m(),this}sub(t,e,s=!0){this.i.set(e||o(),t),s&&t?.(this.value)}update(t){this.p&&clearTimeout(this.p),this.p=setTimeout((()=>{f((()=>{let e="function"==typeof t?t?.(this.value):t,o=g(e)
if(o!==this.l){this.value=e,this.l=o
for(let t of this.$)t.m()
for(let[t,e]of this?.i||[])e?.(this.value,t)}return this.value}))}),0)}m(){let t=this.o?.(Array.from(this.u)?.map((t=>t?.value))||[],this?.value)
this.update(void 0===t?this.value:t)}}let b=(t,e,o,s,i,n)=>{let l=e=>T(e,i,o,s,t,!0,n)
"$mount"==e?l():t.addEventListener(e,l)},T=async(e,o,s,l,r,a,u)=>{e?.preventDefault(),e?.stopPropagation(),o||(o=(e?.target)?.method||"get")
let c=s?.fetch?.externals?.find((t=>"$origin"==t.domain&&(l.startsWith(location.origin)||!l.match(/^(https?):\/\//))||l?.startsWith(t.domain)))
c||(c=l.startsWith(location.origin)?{domain:"$origin",scripts:"selected",styles:"selected"}:void 0)
let d=u?.({$el:r,$st:F,$fn:P}),$="$form"==d?new FormData(r):d,h=await fetch(l,{...s?.fetch?.request||{},headers:{...s?.fetch?.request?.headers,MFLD:"true"},method:o,body:"$form"==d||"string"==typeof $?$:JSON.stringify($)}).catch((t=>{s?.fetch?.err?.(t)})),p=h?.status
if(p&&0==s?.fetch?.onCode?.(p,h))return
let m=await(h?.[s?.fetch?.resType||"text"]())
for(let e of["append","prepend","inner","outer"]){let o=r.dataset[`${t}${e}`]
if(void 0===o)continue
let[i,n]=o?.split("->").map((t=>t.trim()))||[],l=(new DOMParser)?.parseFromString?.(m,"text/html"),u=l.querySelector(i||"body")
if(l){let t=[]
if(c?.styles&&"none"!=c?.styles||l.querySelectorAll("style").forEach((t=>t.parentNode?.removeChild(t))),"all"==c?.styles&&l.querySelectorAll("style").forEach((t=>u.appendChild(t))),("all"==c?.scripts?l:u).querySelectorAll("script")?.forEach((e=>{["all","selected"].includes(c?.scripts||"")&&t.push(e),e.parentNode?.removeChild(e)})),a)f({in:u,out:n?document.querySelector(n):r,relation:e,ops:s,done:e=>{C(e)
for(let o of t){let t=document.createElement("script")
t.textContent=o.textContent,e.appendChild(t)}}})
else{document.body.appendChild(u)
for(let e of t){let t=document.createElement("script")
for(let o of e.attributes)t.setAttribute(o.name,o.value)
t.textContent=e.textContent,u.before(t)}}}}let g=r.dataset?.[`${t}resolve`],y=i(g||"")?.func
y?.({$el:r,$st:F,$fn:P,$body:m}),a&&n(r,e,l)}
function v(t,e,o,s=!1){let i=s?"previousElementSibling":"nextElementSibling"
return e?.(t)?t:v((o?.(t)||t)?.[i],e,o,s)}let w=(t,e,s)=>p(o(),{upstream:t,updater:()=>e?.({$el:s,$st:k,$fn:A}),scope:s}),x=(t,e,o)=>{w(o,(()=>e?.({$el:t,$st:k,$fn:A})),t)},M=(t,e,o)=>{let s=e=>{o?.({$el:t,$st:k,$fn:A}),n(t,e)}
"$mount"==e?s():t.addEventListener(e,s)},S=(e,o,s,n,l,r)=>{let a,u,c=document.createElement("template"),d=(t=>{let e="TEMPLATE"
if(t.tagName==e)return t
let o=document.createElement(e)
return o.content.appendChild(t.cloneNode(!0)),t.replaceWith(o),o})(e.cloneNode(!0)),h=o.match(/if|else/),p=o.match(/(else|elseif)(\s|$)/),m=[]
if(c.classList.add(`${o}-start`),d.classList.add(`${o}-end`),e.before(c),e.after(d),e.remove(),h){if(p){let e=v(c,(e=>e?.classList?.contains(`${t}if-end`)),null,!0)
v(e,(t=>t==d),(e=>{e?.dataset?.[`${t}cstore`]&&m.push(e?.dataset?.[`${t}cstore`])}))}u=({$el:t,$st:e,$fn:o})=>{if(p)for(let t of m)if(e[t])return!1
return"else"==p?.[0]||1==n?.({$el:t,$st:e,$fn:o})}}a=w([...l,...m],h?u:n,d),d.dataset[`${t}cstore`]=a.name,a.sub((t=>{void 0!==t&&f((()=>{v(c?.nextElementSibling,(t=>t?.classList?.contains(`${o}-end`)),(t=>$(t,"out",r,(()=>t?.remove())))),h&&!t||((t,e)=>{if(t instanceof Map)for(const[o,s]of t.entries())e(o,s)
else try{let o=Array.from(t||[])
if(o?.length)o.forEach(e)
else for(let o in t)e(o,t[o])}catch(e){console.error(`${t} is not iterable`)}})(o.match(/each/)?t:[t],((t,o)=>{let n=d.cloneNode(!0)
if(!h){let l=d?.innerHTML?.replace(/\$:{([^}]*)}/g,((n,l)=>i(l,s[0],s[1])?.func?.({$el:e,$st:k,$fn:A,[s[0]]:t,[s[1]]:o})||""))||""
n?.innerHTML&&(n.innerHTML=l)}for(let e of n.content.children)e?.innerHTML||(e.innerHTML=t),d.before(e),$(e,"in",r)}))}))}))},_={},E=["bind","sync","templ","if","elseif","else","each","get","head","post","put","delete","patch","promote"].map((e=>`${t}${e}`))
m.addEventListener("popstate",(()=>{location.reload()}))
let{$fn:A,$st:k}=m.MFLD,C=n=>{if(n?.nodeType==Node.TEXT_NODE)return
let l=(n||document.body).querySelectorAll(`[data-${E.join("],[data-")}],a,form`)
for(let r of[n,...l]){let n=s(structuredClone(_),r)
if(r.id||(r.id=o()),void 0!==r.dataset?.[`${t}promote`]){let[t,e,o,s]="A"==r.tagName?["get",r.href,void 0,"click"]:[r.method.toLowerCase(),r.action,()=>"$form","submit"]
if(e){b(r,s,n,e,t,o)
continue}}for(let o in r.dataset)if(E.includes(o))for(let s of r.dataset?.[o]?.split(";;")||[]){let l=!!o.match(/get|head|post|put|delete|patch/),a=s?.split(/\s*->\s*/g),f=l&&a.pop()||"",u=l||o.match(/sync/)?a.shift()?.match(/[^\(\)]{1,}/g)?.pop()?.split(e)?.map((t=>t.trim())):[]||[],c=a?.[0]||"",d=Array.from(new Set([...c?.matchAll(/\$st\.(\w{1,})/g)].map((t=>t[1])))),{func:$,as:h}=i(c)
if(o.match(/each|templ|if|else/))S(r,o,h||[],$,d,n)
else{u?.length||(u=[""])
for(let e of u)o.match(/bind/)?x(r,$,d):o.match(/sync/)?M(r,e,$):b(r,e,n,f,o.replace(t,""),$)}}}},L={store:
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
funcs=>{for(let t in funcs)m.MFLD.$fn[t]=funcs[t]},config:
/**!
 * - Set Manifold configuration options, including `trans` (DOM transition settings), `fetch` (fetch options), and `profiles` (configuration option overrides that can be set on elements ad-hoc via `mfOverrides`).
 * - Providing the optional `profileName` parameter allows you to save the configuration as a named profile. Otherwise, the profile is saved as the default configuration.
 * @param {MfldOps} new_ops
 * @param {string} [profile_name]
 */
(new_ops,profile_name)=>{return t=new_ops,void((e=profile_name)?_.profiles={..._.profiles,[e]:t}:_={..._,...t})
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
t=>{"string"==typeof t&&(t=document.querySelector(t)),C(t)}},F=m.MFLD.$st,P=m.MFLD.$fn,D=(t,e)=>{m.MFLD.comp[t]=class extends HTMLElement{template
constructor(){super(),e?.constructor?.bind(this)?.(),this.connected=e?.connected?.bind(this),this.disconnected=e?.disconnected?.bind(this),this.attributeChanged=e?.attributeChanged?.bind(this),this.template=e?.templ||document.getElementById(e?.selector||t),"TEMPLATE"!=this.template?.nodeName&&(this.template=null)}connectedCallback(){const t=this.attachShadow({mode:e?.shadow||"closed"}),o=this.template?.content.cloneNode(!0)
if(o){t.append(o)
for(let e of t.children)if("SLOT"==e.nodeName)for(let t of e.assignedNodes())C(t)
else"TEMPLATE"!=e.nodeName&&C(e)}}attributeChangedCallback(t,e,o){this.attributeChanged?.(t,e,o)}disconnectedCallback(){this.disconnected?.()}},m.MFLD.comp[t]&&customElements.define(t,m.MFLD.comp[t])},N=async e=>{await T(void 0,"get",{fetch:{externals:[{domain:"$origin",scripts:"all",styles:"all"}]}},e,{dataset:{[`${t}append`]:"template -> body"}},!1)}
globalThis.Mfld||(globalThis.Mfld=L),globalThis.$st||(globalThis.$st=F),globalThis.$fn||(globalThis.$fn=P),globalThis.makeComponent||(globalThis.makeComponent=D),globalThis.component||(globalThis.component=N)
//# sourceMappingURL=dev.global.mfld.js.map
