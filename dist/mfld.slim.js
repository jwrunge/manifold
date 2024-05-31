let t=globalThis.smartOutro,e=[],n=!1,i=[],o=globalThis?.requestAnimationFrame||(t=>setTimeout(t,0)),r=new Map
function s(t){e.push(t),n||(n=!0,o(l))}function l(){n=!1
for(let[t]of r)for(let[e,n]of t?.t||[])n?.(t.value,e)
r.clear()
for(let n of e)if("function"==typeof n)n()
else{if([">","+"].includes(n.relation)){if(">"==n.relation){let t=document?.createElement("div")
for(let e of Array.from(n.out?.childNodes||[]))t.appendChild(e)
n.out?.replaceChildren(t),a(t,"out",n.ops)}t?.space?.(n.in,n.out),a(n.in,"in",n.ops,(()=>{n.in&&n.out?.appendChild(n.in),t?.adjust?.(n.in,n.ops)}))}else a(n.in,"in",n.ops,(()=>{n.out?.after(n.in),t?.space?.(n.in,n.out),t?.adjust?.(n.in,n.ops),"/"===n.relation&&a(n.out,"out",n.ops)}))
n.done?.(n.in)}i.forEach((t=>t())),i=[],e=[]}function a(e,n,i,o){if(e?.nodeType==Node.TEXT_NODE){let t=e.textContent,n=document?.createElement("div")
n.textContent=t,e.replaceWith(n),e=n}if(e){let r=Array.isArray(i.trans?.dur)?i.trans?.dur["in"==n?0:1]||i.trans?.dur[0]:i.trans?.dur||0,l=i?.trans?.class||"mf-trans"
e?.classList?.add(l),i.trans?.hooks?.[`${n}-start`]?.(e),"out"==n?s((()=>{t?.size?.(e),r&&(e.style.transitionDuration=`${r}ms`),e.classList?.add(n)})):setTimeout((()=>{s((()=>{r&&(e.style.transitionDuration=`${r}ms`),e?.classList?.add(n),o?.(),s((()=>{e?.classList?.remove(n)}))}))}),i.trans?.swap||0),setTimeout((()=>{s((()=>{"out"==n&&e?.remove(),e?.classList?.remove(l),e?.classList?.remove(n),i.trans?.hooks?.[`${n}-end`]?.(e)}))}),r+("in"==n&&i.trans?.swap||0))}}function f(t){if(!t)return 0
if("number"==typeof t)return t
if(!0===t)return 1
if(t instanceof Map)return f(Array.from(t.entries()))
if(t instanceof Set)return f(Array.from(t))
let e=0
for(let n of(new TextEncoder).encode("string"==typeof t?t:t?.toString()||""))e=(e<<5)-e+n
return e}globalThis.MfSt||(globalThis.MfSt=new Map),globalThis.MfFn||(globalThis.MfFn=new Map)
class u{i=void 0
t=new Map
o=void 0
l
u=new Set
constructor(t,e){return this.h(t,e)}h(t,e){return this.name=t,MfSt.set(t,this),this.l=new Set(e?.upstream?.map((t=>c(t)))||[]),this.l.forEach((t=>t?.u?.add(this))),this.value=e?.value,this.i=e?.updater,this}sub(t,e){this.t.set(e||String(Date.now()+Math.random()),t),t?.(this.value)}async update(t){return new Promise((async e=>{let n="function"==typeof t?(await t)?.(this.value):t,i=f(n)
if(i!==this.o){this.value=n,this.o=i,r.set(this,await t)
for(let t of this.u)r.set(t,await t.p())
s((()=>{e(this.value)}))}else e(this.value)}))}async p(){await this.update(await(this.i?.(Array.from(this.l)?.map((t=>t?.value))||[],this?.value))||this.value)}}function c(t,e){let n=MfSt.get(t)
return e?n?n.h(t,e):new u(t,e):n||new u(t,e)}globalThis.DOMParser&&new DOMParser
let h={},d="mf",p=[`${d}bind`,`${d}sync`,...["get","head","post","put","delete","patch"].map((t=>`${d}${t}`))],m=/, {0,}/g,$=0
function g(t,e){e?h.profiles={...h.profiles,[e]:t}:h={...h,...t}}function w(t){let e=(t||document.body).querySelectorAll(`[data-${p.join("],[data-")}]${0!=h.fetch?.auto?",a":""}`)||[]
for(let t of e){t.id||(t.id=""+$++)
for(let e in t.dataset){let n=e!=`${d}bind`,i=`(#${t.id} on ${e})`
t.dataset?.[e]?.split(";").forEach((o=>{let r,l=o?.split(/(?:(?:\)|->) ?){1,}/g)||[],a=n?b(l.splice(0,1)[0]):[],f=l[0]?.includes("(")&&l[0]?.match(/^[^\(]{1,}/)?.[0]||"",u=b(l.splice(e==`${d}sync`?1:0,1)[0]),h=b(l[0])
if(n&&!a?.length)throw`No trigger: ${i}.`
if(f&&(r=globalThis[f]||MfFn?.get(f),r||console.warn(`"${f}" not registered: ${i}`),!n&&u.length>1||n&&h.length>1))throw`Multiple sources: ${i}`
let p=u.map((t=>{let[e,...n]=t.split(/[\.\[\]\?]{1,}/g)
return{name:e,path:n.map((t=>isNaN(parseInt(t))?t:parseInt(t))).filter((t=>t))}}))
a?.length||(a=[""])
for(let n of a){["bind","sync"].includes(e)&&M(t,n),h?.length||(h=[""])
for(let o=0;o<h.length;o++)if(e==`${d}bind`){let e=()=>{s((()=>{let e=r?.(...p.map((t=>y(c(t.name)?.value,t.path))),t)??y(c(p[0].name||"")?.value,p[0].path)
void 0!==e&&(t[h[o]]=e),t.dispatchEvent(new CustomEvent(n))}))}
for(let n of p)c(n.name)?.sub(e,t.id)}else if(e==`${d}sync`){if(p.length>1)throw`Only one store supported: ${i}`
let e=()=>{let e=h[o].trim()
console.log(e,t,t[e],t.getAttribute(e),t.dataset[e])
let n=t[e]??t.getAttribute(e)??t.dataset[e]??void 0
r&&(n=r?.(n,t))
let i=c(p[0]?.name)
void 0!==n&&i?.update?.((t=>p[0]?.path?.length?y(t,p[0]?.path,n):n))}
"$mount"==n?e():t.addEventListener(n,e)}}}))}}}function y(t,e,n){let i=t
for(let t of e)null==i&&(i="number"==typeof t?[]:{}),null==n||e[e.length-1]!==t?i=i instanceof Map?i?.get(t):i?.[t]:i instanceof Map?i.set(t,n):i[t]=n
return i}function b(t){if(t?.includes("(")){let e=t.match(/[^\(\)]{1,}/g)
t=e?.[e.length-1]||""}return t?.split(m)?.map((t=>t.trim()))||[]}function M(t,e){let n=async e=>{e?.preventDefault(),e?.stopPropagation()
let n={...h,...h.profiles?.[t.dataset.overrides||""]||JSON.parse(t.dataset.overrides||"{}")||{}},i=e?.target
if(!n?.fetch?.externals?.some((t=>i?.href?.startsWith(t.domain)))){let e=n.fetch,o=await fetch(i?.href,{...e?.request||{},method:i?.method,body:e?.request?.body?JSON.stringify(e?.request?.body||{}):void 0}).catch((t=>{e?.err?.(t)})),r=o?.status
if(r&&0==e?.onCode?.(r))return
let s=await(o?.[n.fetch?.type||"text"]())
n.fetch?.cb?.(s)
let l=t.getAttribute("mf-resolve");["$append","$prepend","$replace"].includes(l||"")&&globalThis.DOMParser&&(new DOMParser)?.parseFromString?.(s,"text/html")}}
"$mount"==e?n():t.addEventListener(e,n)}let T={store:(store_name,store_ops)=>(store_ops?.hasOwnProperty("value")||store_ops?.hasOwnProperty("updater")||(store_ops={value:store_ops}),c(store_name,store_ops)),ustore:(store_name,store_ops)=>c(store_name,store_ops),get:store_name=>c(store_name),func:func_name=>MfFn?.get(func_name),funcs:funcs=>{for(let t in funcs)MfFn.set(t,funcs[t])},config:(new_ops,profile_name)=>g(new_ops,profile_name),onTick:t=>{var e;(e=t)&&i.push(e)},register:t=>{"string"==typeof t&&(t=document.querySelector(t)),w(t)}}
globalThis.Mfld=T
let v=globalThis.document?.currentScript?.dataset||{}
if(v?.config)try{g(JSON.parse(v?.config))}catch(t){console.warn("Invalid Mfld params",t)}v?.init&&w(document.querySelector(v.init))
