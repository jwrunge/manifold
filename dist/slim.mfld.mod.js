let t=globalThis.smartOutro,e=[],n=!1,o=[],i=globalThis?.requestAnimationFrame||(t=>setTimeout(t,0)),r=new Map
function s(t){e.push(t),n||(n=!0,i(a))}function a(){n=!1
for(let[t]of r)for(let[e,n]of t?.t||[])n?.(t.value,e)
r.clear()
for(let n of e)if("function"==typeof n)n()
else{if(["swapinner","append"].includes(n.relation)){if("swapinner"==n.relation){let t=document?.createElement("div")
for(let e of Array.from(n.out?.childNodes||[]))t.appendChild(e)
n.out?.replaceChildren(t),l(t,"out",n.ops)}t?.space?.(n.in,n.out),l(n.in,"in",n.ops,(()=>{n.in&&n.out?.appendChild(n.in),t?.adjust?.(n.in,n.ops)}))}else"prepend"==n.relation?(t?.space?.(n.in,n.out),l(n.in,"in",n.ops,(()=>{n.in&&n.out?.prepend(n.in),t?.adjust?.(n.in,n.ops)}))):l(n.in,"in",n.ops,(()=>{n.out?.after(n.in),t?.space?.(n.in,n.out),t?.adjust?.(n.in,n.ops),"swapouter"==n.relation&&l(n.out,"out",n.ops)}))
n.done?.(n.in)}o.forEach((t=>t())),o=[],e=[]}function l(e,n,o,i){if(console.log("Applying transition",e,n,o,i),e?.nodeType==Node.TEXT_NODE){let t=e.textContent,n=document?.createElement("div")
n.textContent=t,e.replaceWith(n),e=n}if(e){let r=Array.isArray(o.trans?.dur)?o.trans?.dur["in"==n?0:1]||o.trans?.dur[0]:o.trans?.dur||0,a=o?.trans?.class||"mf-trans"
e?.classList?.add(a),o.trans?.hooks?.[`${n}-start`]?.(e),"out"==n?s((()=>{t?.size?.(e),r&&(e.style.transitionDuration=`${r}ms`),e.classList?.add(n)})):setTimeout((()=>{s((()=>{r&&(e.style.transitionDuration=`${r}ms`),e?.classList?.add(n),i?.(),s((()=>{e?.classList?.remove(n)}))}))}),o.trans?.swap||0),setTimeout((()=>{s((()=>{"out"==n&&e?.remove(),e?.classList?.remove(a),e?.classList?.remove(n),o.trans?.hooks?.[`${n}-end`]?.(e)}))}),r+("in"==n&&o.trans?.swap||0))}}function f(t){if(!t)return 0
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
constructor(t,e){return this.p(t,e)}p(t,e){return this.name=t,MfSt.set(t,this),this.l=new Set(e?.upstream?.map((t=>p(t)))||[]),this.l.forEach((t=>t?.u?.add(this))),this.value=e?.value,this.o=e?.updater,this}sub(t,e){this.t.set(e||String(Date.now()+Math.random()),t),t?.(this.value)}async update(t){return new Promise((async e=>{let n="function"==typeof t?(await t)?.(this.value):t,o=f(n)
if(o!==this.i){this.value=n,this.i=o,r.set(this,await t)
for(let t of this.u)r.set(t,await t.h())
s((()=>{e(this.value)}))}else e(this.value)}))}async h(){await this.update(await(this.o?.(Array.from(this.l)?.map((t=>t?.value))||[],this?.value))||this.value)}}function p(t,e){let n=MfSt.get(t)
return e?n?n.p(t,e):new u(t,e):n||new u(t,e)}globalThis.DOMParser&&new DOMParser
let c={},h="mf",d=/, {0,}/g,w=0
function g(t,e,n){let o=t
for(let t of e)null==o&&(o="number"==typeof t?[]:{}),null==n||e[e.length-1]!==t?o=o instanceof Map?o?.get(t):o?.[t]:o instanceof Map?o.set(t,n):o[t]=n
return o}function y(t){if(t?.includes("(")){let e=t.match(/[^\(\)]{1,}/g)
t=e?.[e.length-1]||""}return t?.split(d)?.map((t=>t.trim()))||[]}function $(t,e,n,o,i){let r=async e=>{e?.preventDefault(),e?.stopPropagation()
let r=t.dataset[`${h}overrides`]||"{}",a=c.profiles?.[r]?.fetch||JSON.parse(r),l=a?{...c,...a}:c
i||(i="string"==typeof o?structuredClone(o):(e?.target)?.href,o=l?.fetch?.request?.body),n||(n=(e?.target)?.method||"get"),l?.fetch?.externals?.find((t=>i?.startsWith(t.domain)))||!i.match(/^https?:\/\//)||i.includes(location.origin)
let f=await fetch(i,{...l?.fetch?.request||{},method:n,body:"string"==typeof o?o:JSON.stringify(o)}).catch((t=>{l?.fetch?.err?.(t)})),u=f?.status
if(u&&0==l?.fetch?.onCode?.(u,f))return
let p=await(f?.[l?.fetch?.type||"text"]())
l?.fetch?.cb?.(p)
for(let e of["append","prepend","swapinner","swapouter"]){let[n,o]=t.dataset[`${h}${e}`]?.split("->").map((t=>t.trim()))||[],i=(new DOMParser)?.parseFromString?.(p,"text/html")
i&&s({in:i.querySelector(n||"body"),out:o?document.querySelector(o):t,relation:e,ops:l,done:()=>!0})}t.dataset?.[`${h}resolve`]&&alert("RESOLVING")}
"$mount"==e?r():t.addEventListener(e,r)}let m={store:(store_name,store_ops)=>(store_ops?.hasOwnProperty("value")||store_ops?.hasOwnProperty("updater")||(store_ops={value:store_ops}),p(store_name,store_ops)),ustore:(store_name,store_ops)=>p(store_name,store_ops),get:store_name=>p(store_name),func:func_name=>MfFn?.get(func_name),funcs:funcs=>{for(let t in funcs)MfFn.set(t,funcs[t])},config:(new_ops,profile_name)=>{return t=new_ops,void((e=profile_name)?c.profiles={...c.profiles,[e]:t}:c={...c,...t})
var t,e},onTick:t=>{var e;(e=t)&&o.push(e)},register:t=>{"string"==typeof t&&(t=document.querySelector(t)),function(t){let e=(t||document.body).querySelectorAll(`[data-${h}${["bind","sync","get","head","post","put","delete","patch"].join(`],[data-${h}`)}]${0!=c.fetch?.auto?",a":""}`)||[]
for(let t of e){t.id||(t.id=""+w++)
for(let e in t.dataset){let n=e!=`${h}bind`,o=`(#${t.id} on ${e})`
t.dataset?.[e]?.split(";").forEach((i=>{let r,a=i?.split(/(?:(?:\)|->) ?){1,}/g)||[],l=n?y(a.splice(0,1)[0]):[],f=a[0]?.includes("(")&&a[0]?.match(/^[^\(]{1,}/)?.[0]||"",u=y(a.splice(e==`${h}sync`?1:0,1)[0]),c=y(a[0])
if(n&&!l?.length)throw`No trigger: ${o}.`
if(f&&(r=globalThis[f]||MfFn?.get(f),r||console.warn(`"${f}" not registered: ${o}`),!n&&u.length>1||n&&c.length>1))throw`Multiple sources: ${o}`
let d=u.map((t=>{let[e,...n]=t.split(/[\.\[\]\?]{1,}/g)
return{name:e,path:n.map((t=>isNaN(parseInt(t))?t:parseInt(t))).filter((t=>t))}}))
l?.length||(l=[""])
for(let n of l){if(!e.match(/bind|sync/)){if(c.length>1||u.length>1)throw`Multiple sources: ${o}`
return void $(t,n,e.replace(h,""),c[0],u[0])}c?.length||(c=[""])
for(let i=0;i<c.length;i++)if(e==`${h}bind`){let e=()=>{s((()=>{let e=r?.(...d.map((t=>g(p(t.name)?.value,t.path))),t)??g(p(d[0].name||"")?.value,d[0].path)
void 0!==e&&(t[c[i]]=e),t.dispatchEvent(new CustomEvent(n))}))}
for(let n of d)p(n.name)?.sub(e,t.id)}else if(e==`${h}sync`){if(d.length>1)throw`Only one store supported: ${o}`
let e=()=>{let e=c[i].trim(),n=t[e]??t.getAttribute(e)??t.dataset[e]??void 0
r&&(n=r?.(n,t))
let o=p(d[0]?.name)
void 0!==n&&o?.update?.((t=>d[0]?.path?.length?g(t,d[0]?.path,n):n))}
"$mount"==n?e():t.addEventListener(n,e)}}}))}}}(t)}}
export{m as Mfld}
