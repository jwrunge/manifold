let t,e=[],n=!1,i=[],o="",r=globalThis?.requestAnimationFrame||(t=>setTimeout(t,0)),s=new Map
function a(t){e.push(t),n||(n=!0,r(u))}function f(e,n,i){t=document.createElement("div")
let{paddingTop:r,paddingBottom:s}=window.getComputedStyle(n)
o=t.style.height=`calc(${Math.abs(i-(e?.clientHeight||0))}px - ${r} - ${s})`,n?.after(t)}function l(e,n){a((()=>{t?.remove(),e?.animate?.([{height:o},{height:`${e.clientHeight||0}px`}],300)}))}function u(){n=!1
for(let[t]of s)for(let[e,n]of t?.t||[])n?.(t.value,e)
s.clear()
for(let t of e)if("function"==typeof t)t()
else{let e=t.out?t.out.clientHeight:0
if(["swapinner","append"].includes(t.relation)){if("swapinner"==t.relation){let e=document?.createElement("div")
for(let n of Array.from(t.out?.childNodes||[]))e.appendChild(n)
t.out?.replaceChildren(e),p(e,"out",t.ops)}f?.(t.in,t.out,e),p(t.in,"in",t.ops,(()=>{t.in&&t.out?.appendChild(t.in),l?.(t.in,t.out)}))}else"prepend"==t.relation?(f?.(t.in,t.out,e),p(t.in,"in",t.ops,(()=>{t.in&&t.out?.prepend(t.in),l?.(t.in,t.out)}))):(p(t.in,"in",t.ops,(()=>{t.out?.after(t.in),f?.(t.in,t.out,e),l?.(t.in,t.out)})),p(t.out,"out",t.ops))
t.done?.(t.in)}i.forEach((t=>t())),i=[],e=[]}function p(t,e,n,i){if(t?.nodeType==Node.TEXT_NODE){let e=t.textContent,n=document?.createElement("div")
n.textContent=e,t.replaceWith(n),t=n}if(t){let o=Array.isArray(n.trans?.dur)?n.trans?.dur["in"==e?0:1]||n.trans?.dur[0]:n.trans?.dur||0,r=n?.trans?.class||"mf-trans"
t?.classList?.add(r),n.trans?.hooks?.[`${e}-start`]?.(t),"out"==e?a((()=>{t.style.width=`${t.clientWidth}px`,t.style.height=`${t.clientHeight}px`,t.style.position="absolute",o&&(t.style.transitionDuration=`${o}ms`),t.classList?.add("out")})):(t?.classList?.add("in"),o&&(t.style.transitionDuration=`${o}ms`),i?.(),setTimeout((()=>{a((()=>{setTimeout((()=>a((()=>t?.classList?.remove(e)))),0)}))}),n.trans?.swap||0)),setTimeout((()=>{a((()=>{"out"==e&&t?.remove(),t?.classList?.remove(r),n.trans?.hooks?.[`${e}-end`]?.(t)}))}),o+("in"==e&&n.trans?.swap||0))}}function d(t){if(!t)return 0
if("number"==typeof t)return t
if(!0===t)return 1
if(t instanceof Map)return d(Array.from(t.entries()))
if(t instanceof Set)return d(Array.from(t))
let e=0
for(let n of(new TextEncoder).encode("string"==typeof t?t:t?.toString()||""))e=(e<<5)-e+n
return e}globalThis.MfSt||(globalThis.MfSt=new Map),globalThis.MfFn||(globalThis.MfFn=new Map)
class c{i=void 0
t=new Map
o=void 0
l
u=new Set
constructor(t,e){return this.p(t,e)}p(t,e){return this.name=t,MfSt.set(t,this),this.l=new Set(e?.upstream?.map((t=>h(t)))||[]),this.l.forEach((t=>t?.u?.add(this))),this.value=e?.value,this.i=e?.updater,this}sub(t,e){this.t.set(e||String(Date.now()+Math.random()),t),t?.(this.value)}async update(t){return new Promise((async e=>{let n="function"==typeof t?(await t)?.(this.value):t,i=d(n)
if(i!==this.o){this.value=n,this.o=i,s.set(this,await t)
for(let t of this.u)s.set(t,await t.h())
a((()=>{e(this.value)}))}else e(this.value)}))}async h(){await this.update(await(this.i?.(Array.from(this.l)?.map((t=>t?.value))||[],this?.value))||this.value)}}function h(t,e){let n=MfSt.get(t)
return e?n?n.p(t,e):new c(t,e):n||new c(t,e)}globalThis.DOMParser&&new DOMParser
let $={},w="mf",g=/, {0,}/g,m=0,y=["bind","sync","get","head","post","put","delete","patch"].map((t=>`${w}${t}`))
function b(t,e,n){let i=t
for(let t of e)null==i&&(i="number"==typeof t?[]:{}),null==n||e[e.length-1]!==t?i=i instanceof Map?i?.get(t):i?.[t]:i instanceof Map?i.set(t,n):i[t]=n
return i}function v(t){if(t?.includes("(")){let e=t.match(/[^\(\)]{1,}/g)
t=e?.[e.length-1]||""}return t?.split(g)?.map((t=>t.trim()))||[]}function M(t,e,n,i,o){let r=async e=>{e?.preventDefault(),e?.stopPropagation()
let r=t.dataset[`${w}overrides`]||"{}",s=$.profiles?.[r]?.fetch||JSON.parse(r),f=s?{...$,...s}:$
o||(o="string"==typeof i?structuredClone(i):(e?.target)?.href,i=f?.fetch?.request?.body),n||(n=(e?.target)?.method||"get"),f?.fetch?.externals?.find((t=>o?.startsWith(t.domain)))||!o.match(/^https?:\/\//)||o.includes(location.origin)
let l=await fetch(o,{...f?.fetch?.request||{},method:n,body:"string"==typeof i?i:JSON.stringify(i)}).catch((t=>{f?.fetch?.err?.(t)})),u=l?.status
if(u&&0==f?.fetch?.onCode?.(u,l))return
let p=await(l?.[f?.fetch?.type||"text"]())
f?.fetch?.cb?.(p)
for(let e of["append","prepend","swapinner","swapouter"]){let n=t.dataset[`${w}${e}`]
if(void 0===n)continue
let[i,o]=n?.split("->").map((t=>t.trim()))||[],r=(new DOMParser)?.parseFromString?.(p,"text/html")
r&&a({in:r.querySelector(i||"body"),out:o?document.querySelector(o):t,relation:e,ops:f,done:()=>!0})}t.dataset?.[`${w}resolve`]&&alert("RESOLVING")}
"$mount"==e?r():t.addEventListener(e,r)}let T={store:(store_name,store_ops)=>(store_ops?.hasOwnProperty("value")||store_ops?.hasOwnProperty("updater")||(store_ops={value:store_ops}),h(store_name,store_ops)),ustore:(store_name,store_ops)=>h(store_name,store_ops),get:store_name=>h(store_name),func:func_name=>MfFn?.get(func_name),funcs:funcs=>{for(let t in funcs)MfFn.set(t,funcs[t])},config:(new_ops,profile_name)=>{return t=new_ops,void((e=profile_name)?$.profiles={...$.profiles,[e]:t}:$={...$,...t})
var t,e},onTick:t=>{var e;(e=t)&&i.push(e)},register:t=>{"string"==typeof t&&(t=document.querySelector(t)),function(t){let e=(t||document.body).querySelectorAll(`[data-${y.join("],[data-")}]${0!=$.fetch?.auto?",a":""}`)||[]
for(let t of e){t.id||(t.id=""+m++)
for(let e in t.dataset){if(!y.includes(e))continue
let n=e!=`${w}bind`,i=`(#${t.id} on ${e})`
t.dataset?.[e]?.split(";").forEach((o=>{let r,s=o?.split(/(?:(?:\)|->) ?){1,}/g)||[],f=n?v(s.splice(0,1)[0]):[],l=s[0]?.includes("(")&&s[0]?.match(/^[^\(]{1,}/)?.[0]||"",u=v(s.splice(e==`${w}sync`?1:0,1)[0]),p=v(s[0])
if(n&&!f?.length)throw`No trigger: ${i}.`
if(l&&(r=globalThis[l]||MfFn?.get(l),r||console.warn(`"${l}" not registered: ${i}`),!n&&u.length>1||n&&p.length>1))throw`Multiple sources: ${i}`
let d=u.map((t=>{let[e,...n]=t.split(/[\.\[\]\?]{1,}/g)
return{name:e,path:n.map((t=>isNaN(parseInt(t))?t:parseInt(t))).filter((t=>t))}}))
f?.length||(f=[""])
for(let n of f){if(!e.match(/bind|sync/)){if(p.length>1||u.length>1)throw`Multiple sources: ${i}`
return void M(t,n,e.replace(w,""),p[0],u[0])}p?.length||(p=[""])
for(let o=0;o<p.length;o++)if(e==`${w}bind`){let e=()=>{a((()=>{let e=r?.(...d.map((t=>b(h(t.name)?.value,t.path))),t)??b(h(d[0].name||"")?.value,d[0].path)
void 0!==e&&(t[p[o]]=e),t.dispatchEvent(new CustomEvent(n))}))}
for(let n of d)h(n.name)?.sub(e,t.id)}else if(e==`${w}sync`){if(d.length>1)throw`Only one store supported: ${i}`
let e=()=>{let e=p[o].trim(),n=t[e]??t.getAttribute(e)??t.dataset[e]??void 0
r&&(n=r?.(n,t))
let i=h(d[0]?.name)
void 0!==n&&i?.update?.((t=>d[0]?.path?.length?b(t,d[0]?.path,n):n))}
"$mount"==n?e():t.addEventListener(n,e)}}}))}}}(t)}}
exports.Mfld=T
