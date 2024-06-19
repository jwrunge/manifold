let t="mf_",e=/, {0,}/g,n=()=>`${Date.now()}.${Math.floor(1e5*Math.random())}`,o=(e,n)=>{let o=e.profiles?.[n.dataset?.override||""],i={...e,...o}
for(let e in n.dataset)for(let o of["fetch","trans"])if(e.startsWith(`${t}${o}_`))try{let t=e.split("_")[2],r=n.dataset[e]
r?.match(/\{|\[/)?r=JSON.parse(r):parseInt(r)&&(r=parseInt(r)),Array.isArray(r)&&(r=r.map((t=>parseInt(t)||t))),console.log("Override",o,t,r),i[o][t]=r}catch(t){console.error(t)}return console.log("Override",i),i},i=(t,n,o)=>{try{let[i,r]=t?.split(/\s{1,}as\s{1,}/)||[t,"value"],s=`let {$el, $st, $fn, ${n||"$val"}, ${o||"$key"}, $body} = ops;return ${i?.match(/^\s{0,}(function)?\(.{0,}\)(=>)?\s{0,}/)?`(${i})()`:i}`,l=r?.split?.(e)?.map?.((t=>t.trim()))||["value"]||[]
return{func:new Function("ops",s),as:l}}catch(t){return console.error(t),{}}}
function r(e,n,o){n?.preventDefault()
let i=e.dataset?.[`${t}pushstate`],r=o
switch(i){case"":break
case void 0:return
default:r=`#${i}`}history.pushState(null,"",r)}let s=[],l=0,f=[],a=t=>{s.push(t),l||(l=requestAnimationFrame($))},u=(t,e,n,o)=>{if(!(o.trans?.smart??1))return
let{paddingTop:i,paddingBottom:r}=e instanceof Element?getComputedStyle(e):{paddingTop:0,paddingBottom:0},s=document.createElement("div")
s.style.height=`calc(${Math.abs(n-(t?.clientHeight||0))}px - ${i} - ${r})`,e?.after(s)},c=(t,e)=>{if(!e.trans?.smart??1)return
let n=(e?.trans?.dur?.[0]||e?.trans?.dur||600)/2
a((()=>{t?.animate?.([{height:""},{height:`${t.clientHeight||0}px`}],n)}))},$=()=>{l=0
for(let t of s){if("function"==typeof t){t()
continue}let e=t.out?t.out.clientHeight:0,n="inner"==t.relation
if("prepend"==t.relation)u?.(t.in,t.out,e,t.ops),d(t.in,"in",t.ops,(()=>{t.out?.prepend(t.in),c?.(t.in,t.ops)}))
else{if(["inner","outer"].includes(t.relation)){let e=t.out?.cloneNode(!0)
e&&(t.out?.after(e),n&&(e.style.border="none",t.out.replaceChildren()),d(e,"out",t.ops,void 0,t.out,n))}u?.(t.in,t.out,e,t.ops),d(t.in,"in",t.ops,(()=>{"outer"==t.relation?t.out?.replaceWith(t.in):t.out?.appendChild(t.in),c?.(t.in,t.ops)}))}t.done?.(t.in)}f.forEach((t=>t())),f=[],s=[]},d=(e,n,o,i,r,s=!1,l)=>{if(e?.nodeType==Node.TEXT_NODE&&(e.replaceWith(document?.createElement("div")),e.textContent=e.textContent),e){const f=Array.isArray(o.trans?.dur)?o.trans?.dur["in"==n?0:1]||o.trans?.dur[0]:o.trans?.dur||0,u=o?.trans?.class||`${t}trans`
if(e?.classList?.add(u),o.trans?.hooks?.[`${n}-start`]?.(e),"out"==n){if(!(r=r||e))return
let t={};(o.trans?.smart??1)&&!s&&(t=p(r)),a((()=>{(o.trans?.smart??1)&&s&&r&&(t=p(r)),(o.trans?.smart??1)&&(e.style.position="fixed",e.style.width=t.w,e.style.left=t.left,e.style.top=t.top,e.style.margin="0"),f&&(e.style.transitionDuration=`${f}ms`),e.classList?.add("out")}))}else e?.classList?.add("in"),f&&(e.style.transitionDuration=`${f}ms`),i?.(),setTimeout((()=>{a((()=>{setTimeout((()=>a((()=>e?.classList?.remove(n)))),0)}))}),o.trans?.swap||0)
setTimeout((()=>{a((()=>{"out"==n&&e?.remove(),e?.classList?.remove(u),o.trans?.hooks?.[`${n}-end`]?.(e),e.style.transitionDuration="","in"==n&&l?.(e)}))}),f+("in"==n&&o.trans?.swap||0))}},p=t=>{let e=getComputedStyle(t),n=t.getBoundingClientRect()
return{w:`calc(${t.clientWidth}px - ${e.paddingLeft} - ${e.paddingRight})`,left:`calc(${n.left}px + ${m.scrollX}px)`,top:`calc(${n.top}px + ${m.scrollY}px)`}},h=(t,e)=>{let n=m.MFLD.st.get(t)
return e?n?n.t(t,e):new v(t,e):n||new v(t,e)},m=window
m.MFLD||(m.MFLD={st:new Map,mut:new Map,$st:new Proxy(h,{get:(t,e)=>t(e)?.value,set:(t,e,n)=>{let o=e.split(/[\.\[\]\?]{1,}/g).map((t=>parseFloat(t.trim())||t.trim())),i=t(o[0]),r=i.value
for(let t of o.slice(1)||[])r=r[t]
return r=n,i.update(r),!0}}),$fn:{}})
let y=t=>{if(!t)return 0
if("number"==typeof t||!0===t)return t
if(t instanceof Map||t instanceof Set)return y(Array.from(t.entries()||t))
let e=0
for(let n of(new TextEncoder).encode(t?.toString()||""))e=(e<<5)-e+n
return e}
class v{o=void 0
i=new Map
l=void 0
u=new Set
$=new Set
p
h
constructor(t,e){return this.t(t,e)}t(t,e){if(this.name=t,this.p=e?.scope||document.currentScript||"global",m.MFLD.st.set(t,this),this.p instanceof Element){let t=m.MFLD.mut.get(this.p)||{toRemove:new Set,observer:null}
t.observer||(t.observer=new MutationObserver((e=>{for(let n of e)if("childList"==n.type)for(let e of n.removedNodes)if(e instanceof Element)for(let n of t.toRemove)if(n.p==e){let e=this.p
g(n),t.observer?.disconnect(),t.toRemove.delete(n),MFLD.mut.delete(e)}})),t.observer.observe(this.p?.parentElement,{childList:!0})),t.toRemove.add(this),MFLD.mut.set(this.p,t)}return e?.upstream?.map((t=>{let e=h(t)
return this.u.add(e),e.$.add(this),e})),this.value=e?.value,this.o=e?.updater,this.m(),this}sub(t,e,o=!0){this.i.set(e||n(),t),o&&t?.(this.value)}update(t){this.h&&clearTimeout(this.h),this.h=setTimeout((()=>{a((()=>{let e="function"==typeof t?t?.(this.value):t,n=y(e)
if(n!==this.l){this.value=e,this.l=n
for(let t of this.$)t.m()
for(let[t,e]of this?.i||[])e?.(this.value,t)}return this.value}))}),0)}m(){let t=this.o?.(Array.from(this.u)?.map((t=>t?.value))||[],this?.value)
this.update(void 0===t?this.value:t)}}let g=t=>{m.MFLD.st.delete(t?.name||""),t=void 0},w=(e,n,o,s,l,f)=>{let u=async n=>{n?.preventDefault(),n?.stopPropagation(),l||(l=(n?.target)?.method||"get")
let u=o?.fetch?.externals?.find((t=>s?.startsWith(t.domain)))||!s.match(/^https?:\/\//)||s.includes(location.origin)?{scripts:!0,styles:!0}:void 0,c=f?.({$el:e,$st:O,$fn:k}),$="$form"==c?new FormData(e):c,d=await fetch(s,{...o?.fetch?.request||{},headers:{...o?.fetch?.request?.headers,MFLD:"true"},method:l,body:"$form"==c||"string"==typeof $?$:JSON.stringify($)}).catch((t=>{o?.fetch?.err?.(t)})),p=d?.status
if(p&&0==o?.fetch?.onCode?.(p,d))return
let h=await(d?.[o?.fetch?.resType||"text"]())
for(let n of["append","prepend","inner","outer"]){let i=e.dataset[`${t}${n}`]
if(void 0===i)continue
let[r,s]=i?.split("->").map((t=>t.trim()))||[],l=(new DOMParser)?.parseFromString?.(h,"text/html")
l&&(u?.styles||l.querySelectorAll("style").forEach((t=>t.parentNode?.removeChild(t))),u?.scripts&&l.querySelectorAll("script").forEach((t=>{let e=document.createElement("script")
e.src=t.src,document.head.appendChild(e)})),a({in:l.querySelector(r||"body"),out:s?document.querySelector(s):e,relation:n,ops:o,done:t=>{D(t)}}))}let m=e.dataset?.[`${t}resolve`],y=i(m||"")?.func
y?.({$el:e,$st:O,$fn:k,$body:h}),r(e,n,s)}
"$mount"==n?u():e.addEventListener(n,u)}
function b(t,e,n,o=!1){let i=o?"previousElementSibling":"nextElementSibling"
return e?.(t)?t:b((n?.(t)||t)?.[i],e,n,o)}let x=(t,e,o)=>h(n(),{upstream:t,updater:()=>e?.({$el:o,$st:F,$fn:E}),scope:o}),M=(t,e,n)=>{x(n,(()=>e?.({$el:t,$st:F,$fn:E})),t)},S=(t,e,n)=>{let o=e=>{n?.({$el:t,$st:F,$fn:E}),r(t,e)}
"$mount"==e?o():t.addEventListener(e,o)},_=(e,n,o,r,s,l)=>{let f,u,c=document.createElement("template"),$=(t=>{let e="TEMPLATE"
if(t.tagName==e)return t
let n=document.createElement(e)
return n.content.appendChild(t.cloneNode(!0)),t.replaceWith(n),n})(e.cloneNode(!0)),p=n.match(/if|else/),h=n.match(/(else|elseif)(\s|$)/),m=[]
if(c.classList.add(`${n}-start`),$.classList.add(`${n}-end`),e.before(c),e.after($),e.remove(),p){if(h){let e=b(c,(e=>e?.classList?.contains(`${t}if-end`)),null,!0)
b(e,(t=>t==$),(e=>{e?.dataset?.[`${t}cstore`]&&m.push(e?.dataset?.[`${t}cstore`])}))}u=({$el:t,$st:e,$fn:n})=>{if(h)for(let t of m)if(e[t])return!1
return"else"==h?.[0]||1==r?.({$el:t,$st:e,$fn:n})}}f=x([...s,...m],p?u:r,$),$.dataset[`${t}cstore`]=f.name,f.sub((t=>{void 0!==t&&a((()=>{b(c?.nextElementSibling,(t=>t?.classList?.contains(`${n}-end`)),(t=>d(t,"out",l,(()=>t?.remove())))),p&&!t||((t,e)=>{if(t instanceof Map)for(const[n,o]of t.entries())e(n,o)
else try{let n=Array.from(t||[])
if(n?.length)n.forEach(e)
else for(let n in t)e(n,t[n])}catch(e){console.error(`${t} is not iterable`)}})(n.match(/each/)?t:[t],((t,n)=>{let r=$.cloneNode(!0)
if(!p){let s=$?.innerHTML?.replace(/\$:{([^}]*)}/g,((r,s)=>i(s,o[0],o[1])?.func?.({$el:e,$st:F,$fn:E,[o[0]]:t,[o[1]]:n})||""))||""
r?.innerHTML&&(r.innerHTML=s)}for(let e of r.content.children)e?.innerHTML||(e.innerHTML=t),$.before(e),d(e,"in",l)}))}))}))},T={},A=["bind","sync","templ","if","elseif","else","each","get","head","post","put","delete","patch"].map((e=>`${t}${e}`))
m.addEventListener("popstate",(()=>{location.reload()}))
let{$fn:E,$st:F}=m.MFLD,D=r=>{if(r?.nodeType==Node.TEXT_NODE)return
let s=(r||document.body).querySelectorAll(`[data-${A.join("],[data-")}],a,form`)
for(let r of s){let s=o(structuredClone(T),r)
if(r.id||(r.id=n()),void 0!==r.dataset?.[`${t}promote`]){let[t,e,n,o]="A"==r.tagName?["get",r.href,void 0,"click"]:[r.method.toLowerCase(),r.action,()=>"$form","submit"]
if(e){w(r,o,s,e,t,n)
continue}}for(let n in r.dataset)if(A.includes(n))for(let o of r.dataset?.[n]?.split(";;")||[]){let l=!!n.match(/get|head|post|put|delete|patch/),f=o?.split(/\s*->\s*/g),a=l&&f.pop()||"",u=l||n.match(/sync/)?f.shift()?.match(/[^\(\)]{1,}/g)?.pop()?.split(e)?.map((t=>t.trim())):[]||[],c=f?.[0]||"",$=Array.from(new Set([...c?.matchAll(/\$st\.(\w{1,})/g)].map((t=>t[1])))),{func:d,as:p}=i(c)
if(n.match(/each|templ|if|else/))_(r,n,p||[],d,$,s)
else{u?.length||(u=[""])
for(let e of u)n.match(/bind/)?M(r,d,$):n.match(/sync/)?S(r,e,d):w(r,e,s,a,n.replace(t,""),d)}}}},L={store:(store_name,store_ops)=>(store_ops?.hasOwnProperty("value")||store_ops?.hasOwnProperty("updater")||(store_ops={value:store_ops}),h(store_name,store_ops)),ustore:(store_name,store_ops)=>h(store_name,store_ops),funcs:funcs=>{for(let t in funcs)m.MFLD.$fn[t]=funcs[t]},config:(new_ops,profile_name)=>{return t=new_ops,void((e=profile_name)?T.profiles={...T.profiles,[e]:t}:T={...T,...t})
var t,e},onTick:t=>{var e;(e=t)&&f.push(e)},register:t=>{"string"==typeof t&&(t=document.querySelector(t)),D(t)}},O=m.MFLD.$st,k=m.MFLD.$fn
export{k as $fn,O as $st,L as Mfld}
