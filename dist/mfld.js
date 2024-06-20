let t="mf_",e=/, {0,}/g,o=()=>`${Date.now()}.${Math.floor(1e5*Math.random())}`,n=(e,o)=>{let n=e.profiles?.[o.dataset?.override||""],s={...e,...n}
for(let e in o.dataset)for(let n of["fetch","trans"])if(e.startsWith(`${t}${n}_`))try{let t=e.split("_")[2],i=o.dataset[e]
i?.match(/\{|\[/)?i=JSON.parse(i):parseInt(i)&&(i=parseInt(i)),Array.isArray(i)&&(i=i.map((t=>parseInt(t)||t))),s[n][t]=i}catch(t){console.error(t)}return s},s=(t,o,n)=>{try{let[s,i]=t?.split(/\s{1,}as\s{1,}/)||[t,"value"],r=`let {$el, $st, $fn, ${o||"$val"}, ${n||"$key"}, $body} = ops;return ${s?.match(/^\s{0,}(function)?\(.{0,}\)(=>)?\s{0,}/)?`(${s})()`:s}`,l=i?.split?.(e)?.map?.((t=>t.trim()))||["value"]||[]
return{func:new Function("ops",r),as:l}}catch(t){return console.error(t),{}}}
function i(e,o,n){o?.preventDefault()
let s=e.dataset?.[`${t}pushstate`],i=n
switch(s){case"":break
case void 0:return
default:i=`#${s}`}history.pushState(null,"",i)}let r=[],l=0,a=[],f=t=>{r.push(t),l||(l=requestAnimationFrame(d))},c=(t,e,o,n)=>{if(!(n.trans?.smart??1))return
let{paddingTop:s,paddingBottom:i}=e instanceof Element?getComputedStyle(e):{paddingTop:0,paddingBottom:0},r=document.createElement("div")
r.style.height=`calc(${Math.abs(o-(t?.clientHeight||0))}px - ${s} - ${i})`,e?.after(r)},u=(t,e)=>{if(!e.trans?.smart??1)return
let o=(e?.trans?.dur?.[0]||e?.trans?.dur||600)/2
f((()=>{t?.animate?.([{height:""},{height:`${t.clientHeight||0}px`}],o)}))},d=()=>{l=0
for(let t of r){if("function"==typeof t){t()
continue}let e=t.out?t.out.clientHeight:0,o="inner"==t.relation
if("prepend"==t.relation)c?.(t.in,t.out,e,t.ops),$(t.in,"in",t.ops,(()=>{t.out?.prepend(t.in),u?.(t.in,t.ops)}))
else{if(["inner","outer"].includes(t.relation)){let e=t.out?.cloneNode(!0)
e&&(t.out?.after(e),o&&(e.style.border="none",t.out.replaceChildren()),$(e,"out",t.ops,void 0,t.out,o))}c?.(t.in,t.out,e,t.ops),$(t.in,"in",t.ops,(()=>{"outer"==t.relation?t.out?.replaceWith(t.in):t.out?.appendChild(t.in),u?.(t.in,t.ops)}))}t.done?.(t.in)}a.forEach((t=>t())),a=[],r=[]},$=(e,o,n,s,i,r=!1,l)=>{if(e?.nodeType==Node.TEXT_NODE&&(e.replaceWith(document?.createElement("div")),e.textContent=e.textContent),e){const a=Array.isArray(n.trans?.dur)?n.trans?.dur["in"==o?0:1]||n.trans?.dur[0]:n.trans?.dur||0,c=n?.trans?.class||`${t}trans`
if(e?.classList?.add(c),n.trans?.hooks?.[`${o}-start`]?.(e),"out"==o){if(!(i=i||e))return
let t={};(n.trans?.smart??1)&&!r&&(t=p(i)),f((()=>{(n.trans?.smart??1)&&r&&i&&(t=p(i)),(n.trans?.smart??1)&&(e.style.position="fixed",e.style.width=t.w,e.style.left=t.left,e.style.top=t.top,e.style.margin="0"),a&&(e.style.transitionDuration=`${a}ms`),e.classList?.add("out")}))}else e?.classList?.add("in"),a&&(e.style.transitionDuration=`${a}ms`),s?.(),setTimeout((()=>{f((()=>{setTimeout((()=>f((()=>e?.classList?.remove(o)))),0)}))}),n.trans?.swap||0)
setTimeout((()=>{f((()=>{"out"==o&&e?.remove(),e?.classList?.remove(c),n.trans?.hooks?.[`${o}-end`]?.(e),e.style.transitionDuration="","in"==o&&l?.(e)}))}),a+("in"==o&&n.trans?.swap||0))}},p=t=>{let e=getComputedStyle(t),o=t.getBoundingClientRect()
return{w:`calc(${t.clientWidth}px - ${e.paddingLeft} - ${e.paddingRight})`,left:`calc(${o.left}px + ${m.scrollX}px)`,top:`calc(${o.top}px + ${m.scrollY}px)`}},h=(t,e)=>{let o=m.MFLD.st.get(t)
return e?o?o.t(t,e):new g(t,e):o||new g(t,e)},m=window
m.MFLD||(m.MFLD={st:new Map,$st:new Proxy(h,{get:(t,e)=>t(e)?.value,set:(t,e,o)=>{let n=e.split(/[\.\[\]\?]{1,}/g).map((t=>parseFloat(t.trim())||t.trim())),s=t(n[0]),i=s.value
for(let t of n.slice(1)||[])i=i[t]
return i=o,s.update(i),!0}}),$fn:{},comp:{}})
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
constructor(t,e){return this.t(t,e)}t(t,e){return this.name=t,this.p=e?.scope||document.currentScript||"global",m.MFLD.st.set(t,this),e?.upstream?.map((t=>{let e=h(t)
return this.u.add(e),e.$.add(this),e})),this.value=e?.value,this.o=e?.updater,this.m(),this}sub(t,e,n=!0){this.i.set(e||o(),t),n&&t?.(this.value)}update(t){this.h&&clearTimeout(this.h),this.h=setTimeout((()=>{f((()=>{let e="function"==typeof t?t?.(this.value):t,o=y(e)
if(o!==this.l){this.value=e,this.l=o
for(let t of this.$)t.m()
for(let[t,e]of this?.i||[])e?.(this.value,t)}return this.value}))}),0)}m(){let t=this.o?.(Array.from(this.u)?.map((t=>t?.value))||[],this?.value)
this.update(void 0===t?this.value:t)}}let v=(t,e,o,n,s,i)=>{let r=e=>b(e,s,o,n,t,!0,i)
"$mount"==e?r():t.addEventListener(e,r)},b=async(e,o,n,r,l,a,c)=>{e?.preventDefault(),e?.stopPropagation(),o||(o=(e?.target)?.method||"get")
let u=n?.fetch?.externals?.find((t=>"$origin"==t.domain&&(r.startsWith(location.origin)||!r.match(/^(https?):\/\//))||r?.startsWith(t.domain)))
u||(u=r.startsWith(location.origin)?{domain:"$origin",scripts:"selected",styles:"selected"}:void 0)
let d=c?.({$el:l,$st:F,$fn:P}),$="$form"==d?new FormData(l):d,p=await fetch(r,{...n?.fetch?.request||{},headers:{...n?.fetch?.request?.headers,MFLD:"true"},method:o,body:"$form"==d||"string"==typeof $?$:JSON.stringify($)}).catch((t=>{n?.fetch?.err?.(t)})),h=p?.status
if(h&&0==n?.fetch?.onCode?.(h,p))return
let m=await(p?.[n?.fetch?.resType||"text"]())
for(let e of["append","prepend","inner","outer"]){let o=l.dataset[`${t}${e}`]
if(void 0===o)continue
let[s,i]=o?.split("->").map((t=>t.trim()))||[],r=(new DOMParser)?.parseFromString?.(m,"text/html"),c=r.querySelector(s||"body")
if(r){let t=[]
if(u?.styles&&"none"!=u?.styles||r.querySelectorAll("style").forEach((t=>t.parentNode?.removeChild(t))),"all"==u?.styles&&r.querySelectorAll("style").forEach((t=>c.appendChild(t))),("all"==u?.scripts?r:c).querySelectorAll("script")?.forEach((e=>{["all","selected"].includes(u?.scripts||"")&&t.push(e),e.parentNode?.removeChild(e)})),a)f({in:c,out:i?document.querySelector(i):l,relation:e,ops:n,done:e=>{C(e)
for(let o of t){let t=document.createElement("script")
t.textContent=o.textContent,e.appendChild(t)}}})
else{document.body.appendChild(c)
for(let e of t){let t=document.createElement("script")
for(let o of e.attributes)t.setAttribute(o.name,o.value)
t.textContent=e.textContent,c.before(t)}}}}let y=l.dataset?.[`${t}resolve`],g=s(y||"")?.func
g?.({$el:l,$st:F,$fn:P,$body:m}),a&&i(l,e,r)}
function w(t,e,o,n=!1){let s=n?"previousElementSibling":"nextElementSibling"
return e?.(t)?t:w((o?.(t)||t)?.[s],e,o,n)}let T=(t,e,n)=>h(o(),{upstream:t,updater:()=>e?.({$el:n,$st:k,$fn:E}),scope:n}),x=(t,e,o)=>{T(o,(()=>e?.({$el:t,$st:k,$fn:E})),t)},M=(t,e,o)=>{let n=e=>{o?.({$el:t,$st:k,$fn:E}),i(t,e)}
"$mount"==e?n():t.addEventListener(e,n)},S=(e,o,n,i,r,l)=>{let a,c,u=document.createElement("template"),d=(t=>{let e="TEMPLATE"
if(t.tagName==e)return t
let o=document.createElement(e)
return o.content.appendChild(t.cloneNode(!0)),t.replaceWith(o),o})(e.cloneNode(!0)),p=o.match(/if|else/),h=o.match(/(else|elseif)(\s|$)/),m=[]
if(u.classList.add(`${o}-start`),d.classList.add(`${o}-end`),e.before(u),e.after(d),e.remove(),p){if(h){let e=w(u,(e=>e?.classList?.contains(`${t}if-end`)),null,!0)
w(e,(t=>t==d),(e=>{e?.dataset?.[`${t}cstore`]&&m.push(e?.dataset?.[`${t}cstore`])}))}c=({$el:t,$st:e,$fn:o})=>{if(h)for(let t of m)if(e[t])return!1
return"else"==h?.[0]||1==i?.({$el:t,$st:e,$fn:o})}}a=T([...r,...m],p?c:i,d),d.dataset[`${t}cstore`]=a.name,a.sub((t=>{void 0!==t&&f((()=>{w(u?.nextElementSibling,(t=>t?.classList?.contains(`${o}-end`)),(t=>$(t,"out",l,(()=>t?.remove())))),p&&!t||((t,e)=>{if(t instanceof Map)for(const[o,n]of t.entries())e(o,n)
else try{let o=Array.from(t||[])
if(o?.length)o.forEach(e)
else for(let o in t)e(o,t[o])}catch(e){console.error(`${t} is not iterable`)}})(o.match(/each/)?t:[t],((t,o)=>{let i=d.cloneNode(!0)
if(!p){let r=d?.innerHTML?.replace(/\$:{([^}]*)}/g,((i,r)=>s(r,n[0],n[1])?.func?.({$el:e,$st:k,$fn:E,[n[0]]:t,[n[1]]:o})||""))||""
i?.innerHTML&&(i.innerHTML=r)}for(let e of i.content.children)e?.innerHTML||(e.innerHTML=t),d.before(e),$(e,"in",l)}))}))}))},_={},A=["bind","sync","templ","if","elseif","else","each","get","head","post","put","delete","patch","promote"].map((e=>`${t}${e}`))
m.addEventListener("popstate",(()=>{location.reload()}))
let{$fn:E,$st:k}=m.MFLD,C=i=>{if(i?.nodeType==Node.TEXT_NODE)return
let r=(i||document.body).querySelectorAll(`[data-${A.join("],[data-")}],a,form`)
for(let l of[i,...r]){let i=n(structuredClone(_),l)
if(l.id||(l.id=o()),void 0!==l.dataset?.[`${t}promote`]){let[t,e,o,n]="A"==l.tagName?["get",l.href,void 0,"click"]:[l.method.toLowerCase(),l.action,()=>"$form","submit"]
if(e){v(l,n,i,e,t,o)
continue}}for(let o in l.dataset)if(A.includes(o))for(let n of l.dataset?.[o]?.split(";;")||[]){let r=!!o.match(/get|head|post|put|delete|patch/),a=n?.split(/\s*->\s*/g),f=r&&a.pop()||"",c=r||o.match(/sync/)?a.shift()?.match(/[^\(\)]{1,}/g)?.pop()?.split(e)?.map((t=>t.trim())):[]||[],u=a?.[0]||"",d=Array.from(new Set([...u?.matchAll(/\$st\.(\w{1,})/g)].map((t=>t[1])))),{func:$,as:p}=s(u)
if(o.match(/each|templ|if|else/))S(l,o,p||[],$,d,i)
else{c?.length||(c=[""])
for(let e of c)o.match(/bind/)?x(l,$,d):o.match(/sync/)?M(l,e,$):v(l,e,i,f,o.replace(t,""),$)}}}},L={store:(store_name,store_ops)=>(store_ops?.hasOwnProperty("value")||store_ops?.hasOwnProperty("updater")||(store_ops={value:store_ops}),h(store_name,store_ops)),ustore:(store_name,store_ops)=>h(store_name,store_ops),funcs:funcs=>{for(let t in funcs)m.MFLD.$fn[t]=funcs[t]},config:(new_ops,profile_name)=>{return t=new_ops,void((e=profile_name)?_.profiles={..._.profiles,[e]:t}:_={..._,...t})
var t,e},onTick:t=>{var e;(e=t)&&a.push(e)},register:t=>{"string"==typeof t&&(t=document.querySelector(t)),C(t)}},F=m.MFLD.$st,P=m.MFLD.$fn,D=(t,e)=>{m.MFLD.comp[t]=class extends HTMLElement{template
constructor(){super(),e?.constructor?.bind(this)?.(),this.connected=e?.connected?.bind(this),this.adopted=e?.adopted?.bind(this),this.disconnected=e?.disconnected?.bind(this),this.attributeChanged=e?.attributeChanged?.bind(this),this.template=e?.templ||document.getElementById(e?.selector||t),"TEMPLATE"!=this.template?.nodeName&&(this.template=null)}connectedCallback(){const t=this.attachShadow({mode:e?.shadow||"closed"}),o=this.template?.content.cloneNode(!0)
if(o){t.append(o)
for(let e of t.children)if("SLOT"==e.nodeName)for(let t of e.assignedNodes())C(t)
else"TEMPLATE"!=e.nodeName&&C(e)}}attributeChangedCallback(t,e,o){this.attributeChanged?.(t,e,o)}disconnectedCallback(){this.disconnected?.()}adoptedCallback(){this.adopted?.()}static get observedAttributes(){return e?.observedAttributes||[]}},m.MFLD.comp[t]&&customElements.define(t,m.MFLD.comp[t])},N=async e=>{await b(void 0,"get",{fetch:{externals:[{domain:"$origin",scripts:"all",styles:"selected"}]}},e,{dataset:{[`${t}append`]:"template -> body"}},!1)}
export{P as $fn,F as $st,L as Mfld,N as component,D as makeComponent}
