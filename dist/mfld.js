let t="mf_",e=/, {0,}/g,o=()=>`${Date.now()}.${Math.floor(1e5*Math.random())}`,n=(e,o)=>{let n=e.profiles?.[o.dataset?.override||""],i={...e,...n}
for(let e in o.dataset)for(let n of["fetch","trans"])if(e.startsWith(`${t}${n}_`))try{let t=e.split("_")[2],r=o.dataset[e]
console.log("OVERRIDE VAL",r),r?.match(/\{|\[/)?r=JSON.parse(r):parseInt(r)&&(r=parseInt(r)),Array.isArray(r)&&(r=r.map((t=>parseInt(t)||t))),console.log("Override",n,t,r),i[n][t]=r}catch(t){console.error(t)}return console.log("Override",i),i},i=(t,o,n)=>{try{let[i,r]=t?.split(/\s{1,}as\s{1,}/)||[t,"value"],s=`let {$el, $st, $fn, ${o||"$val"}, ${n||"$key"}, $body} = ops;return ${i?.match(/^\s{0,}(function)?\(.{0,}\)(=>)?\s{0,}/)?`(${i})()`:i}`,l=r?.split?.(e)?.map?.((t=>t.trim()))||["value"]||[]
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
return e?o?o.t(t,e):new v(t,e):o||new v(t,e)},m=window
m.MFLD||(m.MFLD={st:new Map,mut:new Map,$st:new Proxy(h,{get:(t,e)=>t(e)?.value,set:(t,e,o)=>{let n=e.split(/[\.\[\]\?]{1,}/g).map((t=>parseFloat(t.trim())||t.trim())),i=t(n[0]),r=i.value
for(let t of n.slice(1)||[])r=r[t]
return r=o,i.update(r),!0}}),$fn:{}})
let y=t=>{if(!t)return 0
if("number"==typeof t||!0===t)return t
if(t instanceof Map||t instanceof Set)return y(Array.from(t.entries()||t))
let e=0
for(let o of(new TextEncoder).encode(t?.toString()||""))e=(e<<5)-e+o
return e}
class v{o=void 0
i=new Map
l=void 0
u=new Set
$=new Set
p
h
constructor(t,e){return this.t(t,e)}t(t,e){if(this.name=t,this.p=e?.scope||document.currentScript||"global",m.MFLD.st.set(t,this),this.p instanceof Element){let t=m.MFLD.mut.get(this.p)||{toRemove:new Set,observer:null}
t.observer||(t.observer=new MutationObserver((e=>{for(let o of e)if("childList"==o.type)for(let e of o.removedNodes)if(e instanceof Element)for(let o of t.toRemove)if(o.p==e){let e=this.p
g(o),t.observer?.disconnect(),t.toRemove.delete(o),MFLD.mut.delete(e)}})),t.observer.observe(this.p?.parentElement,{childList:!0})),t.toRemove.add(this),MFLD.mut.set(this.p,t)}return e?.upstream?.map((t=>{let e=h(t)
return this.u.add(e),e.$.add(this),e})),this.value=e?.value,this.o=e?.updater,this.m(),this}sub(t,e,n=!0){this.i.set(e||o(),t),n&&t?.(this.value)}update(t){this.h&&clearTimeout(this.h),this.h=setTimeout((()=>{a((()=>{let e="function"==typeof t?t?.(this.value):t,o=y(e)
if(o!==this.l){this.value=e,this.l=o
for(let t of this.$)t.m()
for(let[t,e]of this?.i||[])e?.(this.value,t)}return this.value}))}),0)}m(){let t=this.o?.(Array.from(this.u)?.map((t=>t?.value))||[],this?.value)
this.update(void 0===t?this.value:t)}}let g=t=>{m.MFLD.st.delete(t?.name||""),t=void 0},w=(e,o,n,s,l,f)=>{let u=async o=>{o?.preventDefault(),o?.stopPropagation(),l||(l=(o?.target)?.method||"get")
let u=n?.fetch?.externals?.find((t=>s?.startsWith(t.domain)))||!s.match(/^https?:\/\//)||s.includes(location.origin)?{scripts:!0,styles:!0}:void 0,c=f?.({$el:e,$st:D,$fn:I}),$="$form"==c?new FormData(e):c
console.log("FETCHING",s,l,$,c,n?.fetch?.request?.headers)
let d=await fetch(s,{...n?.fetch?.request||{},headers:{...n?.fetch?.request?.headers,MFLD:"true"},method:l,body:"$form"==c||"string"==typeof $?$:JSON.stringify($)}).catch((t=>{n?.fetch?.err?.(t)})),p=d?.status
if(p&&0==n?.fetch?.onCode?.(p,d))return
let h=await(d?.[n?.fetch?.resType||"text"]())
for(let o of["append","prepend","inner","outer"]){let i=e.dataset[`${t}${o}`]
if(void 0===i)continue
let[r,s]=i?.split("->").map((t=>t.trim()))||[],l=(new DOMParser)?.parseFromString?.(h,"text/html")
console.log("FULL MARKUP",l,r,s),l&&(u?.styles||l.querySelectorAll("style").forEach((t=>t.parentNode?.removeChild(t))),u?.scripts&&l.querySelectorAll("script").forEach((t=>{let e=document.createElement("script")
e.src=t.src,document.head.appendChild(e)})),a({in:l.querySelector(r||"body"),out:s?document.querySelector(s):e,relation:o,ops:n,done:t=>{L(t)}}))}let m=e.dataset?.[`${t}resolve`],y=i(m||"")?.func
y?.({$el:e,$st:D,$fn:I,$body:h}),r(e,o,s)}
"$mount"==o?u():e.addEventListener(o,u)}
function b(t,e,o,n=!1){let i=n?"previousElementSibling":"nextElementSibling"
return e?.(t)?t:b((o?.(t)||t)?.[i],e,o,n)}let M=(t,e,n)=>h(o(),{upstream:t,updater:()=>e?.({$el:n,$st:F,$fn:A}),scope:n}),x=(t,e,o)=>{M(o,(()=>e?.({$el:t,$st:F,$fn:A})),t)},T=(t,e,o)=>{let n=e=>{o?.({$el:t,$st:F,$fn:A}),r(t,e)}
"$mount"==e?n():t.addEventListener(e,n)},S=(e,o,n,r,s,l)=>{let f,u,c=document.createElement("template"),$=(t=>{let e="TEMPLATE"
if(t.tagName==e)return t
let o=document.createElement(e)
return o.content.appendChild(t.cloneNode(!0)),t.replaceWith(o),o})(e.cloneNode(!0)),p=o.match(/if|else/),h=o.match(/(else|elseif)(\s|$)/),m=[]
if(c.classList.add(`${o}-start`),$.classList.add(`${o}-end`),e.before(c),e.after($),e.remove(),p){if(h){let e=b(c,(e=>e?.classList?.contains(`${t}if-end`)),null,!0)
b(e,(t=>t==$),(e=>{e?.dataset?.[`${t}cstore`]&&m.push(e?.dataset?.[`${t}cstore`])}))}u=({$el:t,$st:e,$fn:o})=>{if(h)for(let t of m)if(e[t])return!1
return"else"==h?.[0]||1==r?.({$el:t,$st:e,$fn:o})}}f=M([...s,...m],p?u:r,$),$.dataset[`${t}cstore`]=f.name,f.sub((t=>{void 0!==t&&a((()=>{b(c?.nextElementSibling,(t=>t?.classList?.contains(`${o}-end`)),(t=>d(t,"out",l,(()=>t?.remove())))),p&&!t||((t,e)=>{if(t instanceof Map)for(const[o,n]of t.entries())e(o,n)
else try{let o=Array.from(t||[])
if(o?.length)o.forEach(e)
else for(let o in t)e(o,t[o])}catch(e){console.error(`${t} is not iterable`)}})(o.match(/each/)?t:[t],((t,o)=>{let r=$.cloneNode(!0)
if(!p){let s=$?.innerHTML?.replace(/\$:{([^}]*)}/g,((r,s)=>i(s,n[0],n[1])?.func?.({$el:e,$st:F,$fn:A,[n[0]]:t,[n[1]]:o})||""))||""
r?.innerHTML&&(r.innerHTML=s)}for(let e of r.content.children)e?.innerHTML||(e.innerHTML=t),$.before(e),d(e,"in",l)}))}))}))},_={},E=["bind","sync","templ","if","elseif","else","each","get","head","post","put","delete","patch","promote"].map((e=>`${t}${e}`))
m.addEventListener("popstate",(()=>{location.reload()}))
let{$fn:A,$st:F}=m.MFLD,L=r=>{if(r?.nodeType==Node.TEXT_NODE)return
let s=(r||document.body).querySelectorAll(`[data-${E.join("],[data-")}],a,form`)
for(let r of s){let s=n(structuredClone(_),r)
if(r.id||(r.id=o()),void 0!==r.dataset?.[`${t}promote`]){let[t,e,o,n]="A"==r.tagName?["get",r.href,void 0,"click"]:[r.method.toLowerCase(),r.action,()=>"$form","submit"]
if(console.log("PROMOTE",r,e,n),e){w(r,n,s,e,t,o)
continue}}for(let o in r.dataset)if(E.includes(o))for(let n of r.dataset?.[o]?.split(";;")||[]){let l=!!o.match(/get|head|post|put|delete|patch/),f=n?.split(/\s*->\s*/g),a=l&&f.pop()||"",u=l||o.match(/sync/)?f.shift()?.match(/[^\(\)]{1,}/g)?.pop()?.split(e)?.map((t=>t.trim())):[]||[],c=f?.[0]||"",$=Array.from(new Set([...c?.matchAll(/\$st\.(\w{1,})/g)].map((t=>t[1])))),{func:d,as:p}=i(c)
if(o.match(/each|templ|if|else/))S(r,o,p||[],d,$,s)
else{u?.length||(u=[""])
for(let e of u)o.match(/bind/)?x(r,d,$):o.match(/sync/)?T(r,e,d):w(r,e,s,a,o.replace(t,""),d)}}}},O={store:(store_name,store_ops)=>(store_ops?.hasOwnProperty("value")||store_ops?.hasOwnProperty("updater")||(store_ops={value:store_ops}),h(store_name,store_ops)),ustore:(store_name,store_ops)=>h(store_name,store_ops),funcs:funcs=>{for(let t in funcs)m.MFLD.$fn[t]=funcs[t]},config:(new_ops,profile_name)=>{return t=new_ops,void((e=profile_name)?_.profiles={..._.profiles,[e]:t}:_={..._,...t})
var t,e},onTick:t=>{var e;(e=t)&&f.push(e)},register:t=>{"string"==typeof t&&(t=document.querySelector(t)),L(t)}},D=m.MFLD.$st,I=m.MFLD.$fn
export{I as $fn,D as $st,O as Mfld}
