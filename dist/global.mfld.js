let t="mf_",e=/, {0,}/g,o=()=>`${Date.now()}.${Math.floor(1e5*Math.random())}`,i=(e,o)=>{let i=e.profiles?.[o.dataset?.override||""],n={...e,...i}
for(let e in o.dataset)for(let i of["fetch","trans"])if(e.startsWith(`${t}${i}_`))try{let t=e.split("_")[1],r=o.dataset[e]
r?.match(/\{\[/)&&(r=JSON.parse(r)),parseInt(r)&&(r=parseInt(r)),n[i][t]=r}catch(t){console.error(t)}return n},n=(t,o,i)=>{try{let[n,r]=t?.split(/\s{1,}as\s{1,}/)||[t,"value"],s=`return ${n?.match(/^\s{0,}(function)?\(.{0,}\)(=>)?\s{0,}/)?`(${n})()`:n}`,l=r?.split?.(e)?.map?.((t=>t.trim()))||["value"]||[]
return{func:new Function("$el","$st","$fn",o||"$val",i||"$key",s),as:l}}catch(t){return console.error(t),{}}}
function r(e,o,i){o?.preventDefault()
let n=e.dataset?.[`${t}pushstate`],r=i
switch(n){case"":break
case void 0:return
default:r=`#${n}`}history.pushState(null,"",r)}let s=[],l=0,f=[],a=t=>{s.push(t),l||(l=requestAnimationFrame(d))},u=(t,e,o,i)=>{if(!(i.trans?.smart??1))return
let{paddingTop:n,paddingBottom:r}=e instanceof Element?getComputedStyle(e):{paddingTop:0,paddingBottom:0},s=document.createElement("div")
s.style.height=`calc(${Math.abs(o-(t?.clientHeight||0))}px - ${n} - ${r})`,e?.after(s)},c=(t,e)=>{if(!e.trans?.smart??1)return
let o=(e?.trans?.dur?.[0]||e?.trans?.dur||600)/2
a((()=>{t?.animate?.([{height:""},{height:`${t.clientHeight||0}px`}],o)}))},d=()=>{l=0
for(let t of s){if("function"==typeof t){t()
continue}let e=t.out?t.out.clientHeight:0,o="inner"==t.relation
if("prepend"==t.relation)u?.(t.in,t.out,e,t.ops),h(t.in,"in",t.ops,(()=>{t.out?.prepend(t.in),c?.(t.in,t.ops)}))
else{if(["inner","outer"].includes(t.relation)){let e=t.out?.cloneNode(!0)
e&&(t.out?.after(e),o&&(e.style.border="none",t.out.replaceChildren()),h(e,"out",t.ops,void 0,t.out,o))}u?.(t.in,t.out,e,t.ops),h(t.in,"in",t.ops,(()=>{"outer"==t.relation?t.out?.replaceWith(t.in):t.out?.appendChild(t.in),c?.(t.in,t.ops)}))}t.done?.(t.in)}f.forEach((t=>t())),f=[],s=[]},h=(e,o,i,n,r,s=!1,l)=>{if(e?.nodeType==Node.TEXT_NODE&&(e.replaceWith(document?.createElement("div")),e.textContent=e.textContent),e){const f=Array.isArray(i.trans?.dur)?i.trans?.dur["in"==o?0:1]||i.trans?.dur[0]:i.trans?.dur||0,u=i?.trans?.class||`${t}trans`
if(e?.classList?.add(u),i.trans?.hooks?.[`${o}-start`]?.(e),"out"==o){if(!(r=r||e))return
let t={};(i.trans?.smart??1)&&!s&&(t=p(r)),a((()=>{(i.trans?.smart??1)&&s&&r&&(t=p(r)),(i.trans?.smart??1)&&(e.style.position="fixed",e.style.width=t.w,e.style.left=t.left,e.style.top=t.top,e.style.margin="0"),f&&(e.style.transitionDuration=`${f}ms`),e.classList?.add("out")}))}else e?.classList?.add("in"),f&&(e.style.transitionDuration=`${f}ms`),n?.(),setTimeout((()=>{a((()=>{setTimeout((()=>a((()=>e?.classList?.remove(o)))),0)}))}),i.trans?.swap||0)
setTimeout((()=>{a((()=>{"out"==o&&e?.remove(),e?.classList?.remove(u),i.trans?.hooks?.[`${o}-end`]?.(e),e.style.transitionDuration="","in"==o&&l?.(e)}))}),f+("in"==o&&i.trans?.swap||0))}},p=t=>{let e=getComputedStyle(t),o=t.getBoundingClientRect()
return{w:`calc(${t.clientWidth}px - ${e.paddingLeft} - ${e.paddingRight})`,left:`calc(${o.left}px + ${m.scrollX}px)`,top:`calc(${o.top}px + ${m.scrollY}px)`}},$=(t,e)=>{let o=m.MFLD.st.get(t)
return e?o?o.t(t,e):new v(t,e):o||new v(t,e)},m=window
m.MFLD||(m.MFLD={st:new Map,mut:new Map,$st:new Proxy($,{get:(t,e)=>t(e)?.value,set:(t,e,o)=>{let i=e.split(/[\.\[\]\?]{1,}/g).map((t=>parseFloat(t.trim())||t.trim())),n=t(i[0]),r=n.value
for(let t of i.slice(1)||[])r=r[t]
return r=o,n.update(r),!0}}),$fn:{}})
let g=t=>{if(!t)return 0
if("number"==typeof t||!0===t)return t
if(t instanceof Map||t instanceof Set)return g(Array.from(t.entries()||t))
let e=0
for(let o of(new TextEncoder).encode(t?.toString()||""))e=(e<<5)-e+o
return e}
class v{o=void 0
i=new Map
l=void 0
u=new Set
h=new Set
p
$
constructor(t,e){return this.t(t,e)}t(t,e){if(this.name=t,this.p=e?.scope||document.currentScript||"global",m.MFLD.st.set(t,this),this.p instanceof Element){let t=m.MFLD.mut.get(this.p)||{toRemove:new Set,observer:null}
t.observer||(t.observer=new MutationObserver((e=>{for(let o of e)if("childList"==o.type)for(let e of o.removedNodes)if(e instanceof Element)for(let o of t.toRemove)if(o.p==e){let e=this.p
y(o),t.observer?.disconnect(),t.toRemove.delete(o),MFLD.mut.delete(e)}})),t.observer.observe(this.p?.parentElement,{childList:!0})),t.toRemove.add(this),MFLD.mut.set(this.p,t)}return e?.upstream?.map((t=>{let e=$(t)
return this.u.add(e),e.h.add(this),e})),this.value=e?.value,this.o=e?.updater,this.m(),this}sub(t,e,i=!0){this.i.set(e||o(),t),i&&t?.(this.value)}update(t){this.$&&clearTimeout(this.$),this.$=setTimeout((()=>{a((()=>{let e="function"==typeof t?t?.(this.value):t,o=g(e)
if(o!==this.l){this.value=e,this.l=o
for(let t of this.h)t.m()
for(let[t,e]of this?.i||[])e?.(this.value,t)}return this.value}))}),0)}m(){let t=this.o?.(Array.from(this.u)?.map((t=>t?.value))||[],this?.value)
this.update(void 0===t?this.value:t)}}let y=t=>{m.MFLD.st.delete(t?.name||""),t=void 0},w=(e,o,i,s,l,f,u)=>{let c=async o=>{o?.preventDefault(),o?.stopPropagation(),l||(l=(o?.target)?.method||"get")
let c=i?.fetch?.externals?.find((t=>s?.startsWith(t.domain)))||!s.match(/^https?:\/\//)||s.includes(location.origin)?{scripts:!0,styles:!0}:void 0,d=f?.(...u||[])||u,h=Array.isArray(d)?d[0]:"$form"==d?new FormData(e):d
if(f){let t=Array.isArray(d)?d?.map((t=>$(t).value))||[]:[h]
h=f?.(...t)}let p=await fetch(s,{...i?.fetch?.request||{},headers:{...i?.fetch?.request?.headers,MFLD:"true"},method:l,body:"$form"==d||"string"==typeof h?h:JSON.stringify(h)}).catch((t=>{i?.fetch?.err?.(t)})),m=p?.status
if(m&&0==i?.fetch?.onCode?.(m,p))return
let g=await(p?.[i?.fetch?.resType||"text"]())
for(let o of["append","prepend","inner","outer"]){let n=e.dataset[`${t}${o}`]
if(void 0===n)continue
let[r,s]=n?.split("->").map((t=>t.trim()))||[],l=(new DOMParser)?.parseFromString?.(g,"text/html")
l&&(c?.styles||l.querySelectorAll("style").forEach((t=>t.parentNode?.removeChild(t))),c?.scripts&&l.querySelectorAll("script").forEach((t=>{let e=document.createElement("script")
e.src=t.src,document.head.appendChild(e)})),a({in:l.querySelector(r||"body"),out:s?document.querySelector(s):e,relation:o,ops:i,done:t=>{D(t)}}))}let v=e.dataset?.[`${t}resolve`],y=n(v||"")?.func
y?.(g),r(e,o,s)}
"$mount"==o?c():e.addEventListener(o,c)}
function b(t,e,o,i=!1){let n=i?"previousElementSibling":"nextElementSibling"
return e?.(t)?t:b((o?.(t)||t)?.[n],e,o,i)}let M=(t,e)=>$(o(),{upstream:[...t||[]],updater:()=>e?.func?.(e.observeEl,F,A),scope:e?.observeEl}),T=(t,e,o,i)=>{M(i,{observeEl:t,func:()=>(t.dispatchEvent(new CustomEvent(e)),o?.(t,F,A))})},x=(t,e,o)=>{let i=e=>{o?.(t,F,A),r(t,e)}
"$mount"==e?i():t.addEventListener(e,i)},S=(e,o,i,r,s,l)=>{let f,u,c=document.createElement("template"),d=(t=>{let e="TEMPLATE"
if(t.tagName==e)return t
let o=document.createElement(e)
return o.content.appendChild(t.cloneNode(!0)),t.replaceWith(o),o})(e.cloneNode(!0)),p=o.match(/if|else/),$=o.match(/(else|elseif)(\s|$)/),m=[]
if(c.classList.add(`${o}-start`),d.classList.add(`${o}-end`),e.before(c),e.after(d),e.remove(),p){if($){let e=b(c,(e=>e?.classList?.contains(`${t}if-end`)),null,!0)
b(e,(t=>t==d),(e=>{e?.dataset?.[`${t}cstore`]&&m.push(e?.dataset?.[`${t}cstore`])}))}u=(t,e,o)=>{if($)for(let t of m)if(e[t])return!1
return"else"==$?.[0]||1==r?.(t,e,o)}}f=M([...s,...m],{func:p?u:r,observeEl:d}),d.dataset[`${t}cstore`]=f.name,f.sub((t=>{void 0!==t&&a((()=>{b(c?.nextElementSibling,(t=>t?.classList?.contains(`${o}-end`)),(t=>h(t,"out",l,(()=>t?.remove())))),p&&!t||((t,e)=>{if(t instanceof Map)for(const[o,i]of t.entries())e(o,i)
else try{let o=Array.from(t||[])
if(o?.length)o.forEach(e)
else for(let o in t)e(o,t[o])}catch(e){console.error(`${t} is not iterable`)}})(o.match(/each/)?t:[t],((t,o)=>{let r=d.cloneNode(!0)
if(!p){let s=d?.innerHTML?.replace(/\$:{([^}]*)}/g,((r,s)=>n(s,i[0],i[1])?.func?.(e,F,A,t,o)||""))||""
r?.innerHTML&&(r.innerHTML=s)}for(let e of r.content.children)e?.innerHTML||(e.innerHTML=t),d.before(e),h(e,"in",l)}))}))}))},_={},E=["bind","sync","templ","if","elseif","else","each","get","head","post","put","delete","patch"].map((e=>`${t}${e}`))
m.addEventListener("popstate",(()=>{location.reload()}))
let{$fn:A,$st:F}=m.MFLD,D=r=>{if(r?.nodeType==Node.TEXT_NODE)return
let s=(r||document.body).querySelectorAll(`[data-${E.join("],[data-")}],a,form`)
for(let r of s){let s=i(_,r)
if(r.id||(r.id=o()),void 0!==r.dataset?.[`${t}promote`]){let[t,e,o,i]="A"==r.tagName?["get",r.href,[],"click"]:[r.method.toLowerCase(),r.action,"$form","submit"]
if(e)continue}for(let o in r.dataset)if(E.includes(o))for(let i of r.dataset?.[o]?.split(";;")||[]){let l=i?.split(/\s*->\s*/g),f=o.match(/get|head|post|put|delete|patch/)&&l.pop()||"",[a,u]=l.reverse(),c=u?.match(/[^\(\)]{1,}/g)?.pop()?.split(e)?.map((t=>t.trim())),d=Array.from(new Set([...a?.matchAll(/\$st\.(\w{1,})/g)].map((t=>t[1])))),{func:h,as:p}=n(a)
if(o.match(/each|templ|if|else/))S(r,o,p||[],h,d,s)
else{c?.length||(c=[""])
for(let e of c)o.match(/bind/)?T(r,e,h,d):o.match(/sync/)?x(r,e,h):w(r,e,s,f,o.replace(t,""),h,d)}}}},L={store:(store_name,store_ops)=>(store_ops?.hasOwnProperty("value")||store_ops?.hasOwnProperty("updater")||(store_ops={value:store_ops}),$(store_name,store_ops)),ustore:(store_name,store_ops)=>$(store_name,store_ops),funcs:funcs=>{for(let t in funcs)m.MFLD.$fn[t]=funcs[t]},config:(new_ops,profile_name)=>{return t=new_ops,void((e=profile_name)?_.profiles={..._.profiles,[e]:t}:_={..._,...t})
var t,e},onTick:t=>{var e;(e=t)&&f.push(e)},register:t=>{"string"==typeof t&&(t=document.querySelector(t)),D(t)}}
m.MFLD.$st,m.MFLD.$fn,globalThis.Mfld||(globalThis.Mfld=L)
