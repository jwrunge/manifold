let t=globalThis.smartOutro,e=[],n=!1,o=[],i=globalThis?.requestAnimationFrame||(t=>setTimeout(t,0)),r=new Map
function s(t){e.push(t),n||(n=!0,i(l))}function l(){n=!1
for(let[t]of r)for(let[e,n]of t?.t||[])n?.(t.value,e)
r.clear()
for(let n of e)if("function"==typeof n)n()
else{if([">","+"].includes(n.relation)){if(">"==n.relation){let t=document?.createElement("div")
for(let e of Array.from(n.out?.childNodes||[]))t.appendChild(e)
n.out?.replaceChildren(t),a(t,"out",n.ops)}t?.space?.(n.in,n.out),a(n.in,"in",n.ops,(()=>{n.in&&n.out?.appendChild(n.in),t?.adjust?.(n.in,n.ops)}))}else a(n.in,"in",n.ops,(()=>{n.out?.after(n.in),t?.space?.(n.in,n.out),t?.adjust?.(n.in,n.ops),"/"==n.relation&&a(n.out,"out",n.ops)}))
n.done?.(n.in)}o.forEach((t=>t())),o=[],e=[]}function a(e,n,o,i){if(e?.nodeType==Node.TEXT_NODE){let t=e.textContent,n=document?.createElement("div")
n.textContent=t,e.replaceWith(n),e=n}if(e){let r=Array.isArray(o.trans?.dur)?o.trans?.dur["in"==n?0:1]||o.trans?.dur[0]:o.trans?.dur||0,l=o?.trans?.class||"mf-trans"
e?.classList?.add(l),o.trans?.hooks?.[`${n}-start`]?.(e),"out"==n?s((()=>{t?.size?.(e),r&&(e.style.transitionDuration=`${r}ms`),e.classList?.add(n)})):setTimeout((()=>{s((()=>{r&&(e.style.transitionDuration=`${r}ms`),e?.classList?.add(n),i?.(),s((()=>{e?.classList?.remove(n)}))}))}),o.trans?.swap||0),setTimeout((()=>{s((()=>{"out"==n&&e?.remove(),e?.classList?.remove(l),e?.classList?.remove(n),o.trans?.hooks?.[`${n}-end`]?.(e)}))}),r+("in"==n&&o.trans?.swap||0))}}function f(t){if(!t)return 0
if("number"==typeof t)return t
if(!0===t)return 1
if(t instanceof Map)return f(Array.from(t.entries()))
if(t instanceof Set)return f(Array.from(t))
let e=0
for(let n of(new TextEncoder).encode("string"==typeof t?t:t?.toString()||""))e=(e<<5)-e+n
return e}globalThis.MfSt||(globalThis.MfSt=new Map),globalThis.MfFn||(globalThis.MfFn=new Map)
class u{o=void 0
t=new Map
i=void 0
l
u=new Set
constructor(t,e){return this.h(t,e)}h(t,e){return this.name=t,MfSt.set(t,this),this.l=new Set(e?.upstream?.map((t=>c(t)))||[]),this.l.forEach((t=>t?.u?.add(this))),this.value=e?.value,this.o=e?.updater,this}sub(t,e){this.t.set(e||String(Date.now()+Math.random()),t),t?.(this.value)}async update(t){return new Promise((async e=>{let n="function"==typeof t?(await t)?.(this.value):t,o=f(n)
if(o!==this.i){this.value=n,this.i=o,r.set(this,await t)
for(let t of this.u)r.set(t,await t.p())
s((()=>{e(this.value)}))}else e(this.value)}))}async p(){await this.update(await(this.o?.(Array.from(this.l)?.map((t=>t?.value))||[],this?.value))||this.value)}}function c(t,e){let n=MfSt.get(t)
return e?n?n.h(t,e):new u(t,e):n||new u(t,e)}globalThis.DOMParser&&new DOMParser
let h={},d="mf",p=/, {0,}/g,g=0
function $(t,e){e?h.profiles={...h.profiles,[e]:t}:h={...h,...t}}function y(t){let e=(t||document.body).querySelectorAll(`[data-${d}${["bind","sync","get","head","post","put","delete","patch"].join(`],[data-${d}`)}]${0!=h.fetch?.auto?",a":""}`)||[]
for(let t of e){t.id||(t.id=""+g++)
for(let e in t.dataset){let n=e!=`${d}bind`,o=`(#${t.id} on ${e})`
t.dataset?.[e]?.split(";").forEach((i=>{let r,l=i?.split(/(?:(?:\)|->) ?){1,}/g)||[],a=n?w(l.splice(0,1)[0]):[],f=l[0]?.includes("(")&&l[0]?.match(/^[^\(]{1,}/)?.[0]||"",u=w(l.splice(e==`${d}sync`?1:0,1)[0]),h=w(l[0])
if(n&&!a?.length)throw`No trigger: ${o}.`
if(f&&(r=globalThis[f]||MfFn?.get(f),r||console.warn(`"${f}" not registered: ${o}`),!n&&u.length>1||n&&h.length>1))throw`Multiple sources: ${o}`
let p=u.map((t=>{let[e,...n]=t.split(/[\.\[\]\?]{1,}/g)
return{name:e,path:n.map((t=>isNaN(parseInt(t))?t:parseInt(t))).filter((t=>t))}}))
a?.length||(a=[""])
for(let n of a){if(!e.match(/bind|sync/)){if(h.length>1||u.length>1)throw`Multiple sources: ${o}`
return void b(t,n,e.replace(d,""),h[0],u[0])}h?.length||(h=[""])
for(let i=0;i<h.length;i++)if(e==`${d}bind`){let e=()=>{s((()=>{let e=r?.(...p.map((t=>m(c(t.name)?.value,t.path))),t)??m(c(p[0].name||"")?.value,p[0].path)
void 0!==e&&(t[h[i]]=e),t.dispatchEvent(new CustomEvent(n))}))}
for(let n of p)c(n.name)?.sub(e,t.id)}else if(e==`${d}sync`){if(p.length>1)throw`Only one store supported: ${o}`
let e=()=>{let e=h[i].trim(),n=t[e]??t.getAttribute(e)??t.dataset[e]??void 0
r&&(n=r?.(n,t))
let o=c(p[0]?.name)
void 0!==n&&o?.update?.((t=>p[0]?.path?.length?m(t,p[0]?.path,n):n))}
"$mount"==n?e():t.addEventListener(n,e)}}}))}}}function m(t,e,n){let o=t
for(let t of e)null==o&&(o="number"==typeof t?[]:{}),null==n||e[e.length-1]!==t?o=o instanceof Map?o?.get(t):o?.[t]:o instanceof Map?o.set(t,n):o[t]=n
return o}function w(t){if(t?.includes("(")){let e=t.match(/[^\(\)]{1,}/g)
t=e?.[e.length-1]||""}return t?.split(p)?.map((t=>t.trim()))||[]}function b(t,e,n,o,i){let r=async e=>{e?.preventDefault(),e?.stopPropagation()
let r=t.dataset[`${d}overrides`]||"{}",l={...h.fetch,...h.profiles?.[r]?.fetch||JSON.parse(r)}
i||(i="string"==typeof o?structuredClone(o):(e?.target)?.href,o=l?.request?.body),n||(n=(e?.target)?.method||"get")
let a=l
l?.externals?.find((t=>i?.startsWith(t.domain)))||!i.match(/^https?:\/\//)||i.includes(location.origin)
let f=await fetch(i,{...a?.request||{},method:n,body:"string"==typeof o?o:JSON.stringify(o)}).catch((t=>{a?.err?.(t)})),u=f?.status
if(u&&0==a?.onCode?.(u))return
let c=await(f?.[l?.type||"text"]())
l?.cb?.(c)
let p=t.dataset[`${d}resolve`]
if(["$append","$prepend","$replace"].includes(p||"")&&(console.log("RESOLVE",p,c),"text"==a?.type)){let e=(new DOMParser)?.parseFromString?.(c,"text/html")
e&&s({in:e.querySelector("body"),out:t,relation:p,ops:a,done:()=>!0})}}
"$mount"==e?r():t.addEventListener(e,r)}let M={store:(store_name,store_ops)=>(store_ops?.hasOwnProperty("value")||store_ops?.hasOwnProperty("updater")||(store_ops={value:store_ops}),c(store_name,store_ops)),ustore:(store_name,store_ops)=>c(store_name,store_ops),get:store_name=>c(store_name),func:func_name=>MfFn?.get(func_name),funcs:funcs=>{for(let t in funcs)MfFn.set(t,funcs[t])},config:(new_ops,profile_name)=>$(new_ops,profile_name),onTick:t=>{var e;(e=t)&&o.push(e)},register:t=>{"string"==typeof t&&(t=document.querySelector(t)),y(t)}}
globalThis.Mfld=M
let v=globalThis.document?.currentScript?.dataset||{}
if(v?.config)try{$(JSON.parse(v?.config))}catch(t){console.warn("Invalid Mfld params",t)}v?.init&&y(document.querySelector(v.init))
