let t,e=[],n=!1,i=[],o="",r=globalThis?.requestAnimationFrame||(t=>setTimeout(t,0))
function s(t){e.push(t),n||(n=!0,r(u))}function l(e,n,i,r=!1,s){if(!s.trans?.smartTransition??1)return
t=document.createElement("div")
let{paddingTop:l,paddingBottom:f}=n instanceof Element?window.getComputedStyle(n):{paddingTop:0,paddingBottom:0}
o=t.style.height=`calc(${Math.abs(i-(e?.clientHeight||0))}px - ${l} - ${f})`,n?.after(t)}function f(e,n){if(!n.trans?.smartTransition??1)return
let i=(n?.trans?.dur?.[0]||n?.trans?.dur||600)/2
s((()=>{t?.remove(),e?.animate?.([{height:o},{height:`${e.clientHeight||0}px`}],i)}))}function u(){n=!1
for(let t of e)if("function"==typeof t)t()
else{let e=t.out?t.out.clientHeight:0
if("prepend"==t.relation)l?.(t.in,t.out,e,!1,t.ops),a(t.in,"in",t.ops,(()=>{t.in&&t.out?.prepend(t.in),f?.(t.in,t.ops)}))
else{if(["swapinner","swapouter"].includes(t.relation)){let e=t.out?.cloneNode(!0)
t.out?.after(e)
let n="swapinner"==t.relation
"swapinner"==t.relation&&(e.style.border="none",t.out.replaceChildren()),a(e,"out",t.ops,void 0,t.out,n)}l?.(t.in,t.out,e,!1,t.ops),a(t.in,"in",t.ops,(()=>{t.in&&("swapouter"==t.relation?t.out?.replaceWith(t.in):t.out?.appendChild(t.in)),f?.(t.in,t.ops)}))}t.done?.(t.in)}i.forEach((t=>t())),i=[],e=[]}function a(t,e,n,i,o,r=!1){if(t?.nodeType==Node.TEXT_NODE){let e=t.textContent,n=document?.createElement("div")
n.textContent=e,t.replaceWith(n),t=n}if(t){let l=Array.isArray(n.trans?.dur)?n.trans?.dur["in"==e?0:1]||n.trans?.dur[0]:n.trans?.dur||0,f=n?.trans?.class||"mf-trans"
if(t?.classList?.add(f),n.trans?.hooks?.[`${e}-start`]?.(t),"out"==e){if(o||(o=t),!o)return
let e={}
if((n.trans?.smartTransition??1)&&0==r){let t=getComputedStyle(o)
e.w=`calc(${o.clientWidth}px - ${t.paddingLeft} - ${t.paddingRight})`,e.left=`calc(${o.getBoundingClientRect().left}px + ${window.scrollX}px)`,e.top=`calc(${o.getBoundingClientRect().top}px + ${window.scrollY}px)`}s((()=>{if(n.trans?.smartTransition??1){if(r&&o){let t=getComputedStyle(o)
e.w=`calc(${o.clientWidth}px - ${t.paddingLeft} - ${t.paddingRight})`,e.left=`calc(${o.getBoundingClientRect().left}px + ${window.scrollX}px)`,e.top=`calc(${o.getBoundingClientRect().top}px + ${window.scrollY}px)`}t.style.position="fixed",t.style.width=e.w,t.style.left=e.left,t.style.top=e.top,t.style.margin="0"}l&&(t.style.transitionDuration=`${l}ms`),t.classList?.add("out")}))}else t?.classList?.add("in"),l&&(t.style.transitionDuration=`${l}ms`),i?.(),setTimeout((()=>{s((()=>{setTimeout((()=>s((()=>t?.classList?.remove(e)))),0)}))}),n.trans?.swap||0)
setTimeout((()=>{s((()=>{"out"==e&&t?.remove(),t?.classList?.remove(f),n.trans?.hooks?.[`${e}-end`]?.(t)}))}),l+("in"==e&&n.trans?.swap||0))}}function c(t){if(!t)return 0
if("number"==typeof t)return t
if(!0===t)return 1
if(t instanceof Map)return c(Array.from(t.entries()))
if(t instanceof Set)return c(Array.from(t))
let e=0
for(let n of(new TextEncoder).encode("string"==typeof t?t:t?.toString()||""))e=(e<<5)-e+n
return e}globalThis.MfSt||(globalThis.MfSt=new Map),globalThis.MfFn||(globalThis.MfFn=new Map)
class d{t=void 0
i=new Map
o=void 0
l
u=new Set
constructor(t,e){return this.p(t,e)}p(t,e){return this.name=t,MfSt.set(t,this),this.l=new Set(e?.upstream?.map((t=>p(t)))||[]),this.l.forEach((t=>t?.u?.add(this))),this.value=e?.value,this.t=e?.updater,this}sub(t,e,n=!0){this.i.set(e||String(Date.now()+Math.random()),t),n&&t?.(this.value)}async update(t){return new Promise((async e=>{let n="function"==typeof t?(await t)?.(this.value):t,i=c(n)
if(i!==this.o){this.value=n,this.o=i
for(let t of this.u)await t.$()
s((()=>{for(let[t,e]of this?.i||[])e?.(this.value,t)
e(this.value)}))}else e(this.value)}))}async $(){let t=await(this.t?.(Array.from(this.l)?.map((t=>t?.value))||[],this?.value))
await this.update(void 0===t?this.value:t)}}function p(t,e){let n=MfSt.get(t)
return e?n?n.p(t,e):new d(t,e):n||new d(t,e)}let $="mf",h=/[\.\[\]\?]{1,}/g
function w(t,e,n){let i=t
for(let t of e)null==i&&(i="number"==typeof t?[]:{}),null==n||e[e.length-1]!==t?i=i instanceof Map?i?.get(t):i?.[t]:i instanceof Map?i.set(t,n):i[t]=n
return i}function m(t){let[e,...n]=t?.split(h)
return[e,n?.map((t=>isNaN(parseInt(t))?t:parseInt(t))).filter((t=>t))||[]]}function g(t,e){let n=e.dataset[`${$}overrides`]||"{}",i=t.profiles?.[n]?.fetch||JSON.parse(n)
return i?{...t,...i}:t}function y(t){let e="",n=""
if("string"==typeof t?e=t:(e=t?.el?.dataset?.[t?.datakey]||"",n=e,e||void 0===t?.el?.dataset?.[`${$}else`]||(e="return true",n=`ELSE:${t?.el?.dataset?.[t?.datakey]||""}`)),!e)return{}
let[i,o]=e?.split("=>")?.map((t=>t.trim()))||["",""]
o||(o=i.slice(),i="")
let r=i?.split(",")?.map((t=>t.replace(/[()]/g,"").trim()))
return{storeList:r,func:globalThis[o]||MfFn?.get(o)||new Function(...r,o),storeName:n}}function v(t,e,n,i,o,r){let l=async e=>{e?.preventDefault(),e?.stopPropagation()
let l=g(n,t)
o||(o=(e?.target)?.method||"get"),l?.fetch?.externals?.find((t=>i?.startsWith(t.domain)))||!i.match(/^https?:\/\//)||i.includes(location.origin)
let f=await fetch(i,{...l?.fetch?.request||{},method:o,body:"string"==typeof r?r:JSON.stringify(r)}).catch((t=>{l?.fetch?.err?.(t)})),u=f?.status
if(u&&0==l?.fetch?.onCode?.(u,f))return
let a=await(f?.[l?.fetch?.type||"text"]())
l?.fetch?.cb?.(a)
for(let e of["append","prepend","swapinner","swapouter"]){let n=t.dataset[`${$}${e}`]
if(void 0===n)continue
let[i,o]=n?.split("->").map((t=>t.trim()))||[],r=(new DOMParser)?.parseFromString?.(a,"text/html")
r&&s({in:r.querySelector(i||"body"),out:o?document.querySelector(o):t,relation:e,ops:l,done:t=>{N(t)}})}t.dataset?.[`${$}resolve`]&&alert("RESOLVING")}
"$mount"==e?l():t.addEventListener(e,l)}function T(t,e,n,i,o,r){if(o==`${$}bind`){let o=e.map(m),l=()=>{s((()=>{let e=o.map((t=>w(p(t[0])?.value,t[1]))),s=r?.(...e,t)??e[0]
n&&void 0!==s&&(t[n]=s),t.dispatchEvent(new CustomEvent(i))}))}
for(let e of o)p(e?.[0]||"")?.sub(l,t.id)}else if(o==`${$}sync`){let[o,s]=m(n||""),l=()=>{let n=e.map((e=>(e=e.trim(),t[e]??t.getAttribute(e)??t.dataset[e]??void 0))),i=r?.(...n)??n[0]
o&&void 0!==i&&p(o)?.update?.((t=>s?.length?w(t,s,i):i))}
"$mount"==i?l():t.addEventListener(i,l)}}function b(t,e,n){if(e==`${$}if`){let i=g(n,t),o=document.createElement("div")
o.classList.add("mfld-active-condition"),t.before(o)
let r=t,l=[]
for(;r&&r;){let{storeList:t,func:n,storeName:f}=y({el:r,datakey:l.length?`${$}elseif`:e})
if(!t&&!n)break
if("TEMPLATE"!=r.tagName){let t=document.createElement("template")
t.innerHTML=r.innerHTML
for(let e of r.attributes)t.setAttribute(e.name,e.value)
r.replaceWith(t),r=t,o.innerHTML=r.innerHTML}let u=l.length,a=p(f||"",{upstream:[...t||[],...l],updater:t=>{if(u)for(let e of t.slice(-u)||[])if(e)return!1
return n?.(...t.slice(0,-1))}})
l.push(a.name)
let c=r.cloneNode(!0)
a?.sub((t=>{if(!t)return
let e=document.createElement("div")
e.innerHTML=c.innerHTML,"TEMPLATE"==c?.tagName&&s({in:e,out:o,relation:"swapinner",ops:i,done:t=>N(t)})})),r=r?.nextElementSibling}}else alert("Not set up for loops yet")}let x={},M=/, {0,}/g,S=0,E=["bind","sync","if","get","head","post","put","delete","patch"].map((t=>`${$}${t}`))
function N(t){let e=(t||document.body).querySelectorAll(`[data-${E.join("],[data-")}]${0!=x.fetch?.auto?",a":""}`)||[]
for(let t of e){t.id||(t.id=""+S++)
for(let e in t.dataset){if([`${$}if`,`${$}each`].includes(e)){b(t,e,x)
continue}if(!E.includes(e))continue
let n=![`${$}bind`].includes(e),i=`(#${t.id} on ${e})`
t.dataset?.[e]?.split(";").forEach((o=>{let[r,s]=o?.split("->")?.map((t=>t.trim()))||[],l=n?_(r.slice(0,r.indexOf(")"))):[],f=n?r.slice(r.indexOf(")")+1):r,u=f.includes("=>")?f:f.includes("(")&&f.match(/^[^\(]{1,}/)?.[0]||"",a=u?_(f.slice(0,(f.indexOf(")")||-2)+1)):f.split(M)?.map((t=>t.trim()))
if(n&&!l?.length)return console.error(`No trigger: ${i}.`)
let c=y(u)?.func
u?c||console.warn(`"${u}" not registered: ${i}`):a.length>1&&console.warn(`Multiple inputs without function: ${i}`),l?.length||(l=[""])
for(let n of l)e.match(/bind|sync/)?T(t,a,s,n,e,c):v(t,n,x,a[0],e.replace($,""),s)}))}}}function _(t){if(t?.includes("(")){let e=t.match(/[^\(\)]{1,}/g)
t=e?.[e.length-1]||""}return t?.split(M)?.map((t=>t.trim()))||[]}let A={store:(store_name,store_ops)=>(store_ops?.hasOwnProperty("value")||store_ops?.hasOwnProperty("updater")||(store_ops={value:store_ops}),p(store_name,store_ops)),ustore:(store_name,store_ops)=>p(store_name,store_ops),get:store_name=>p(store_name),func:func_name=>MfFn?.get(func_name),funcs:funcs=>{for(let t in funcs)MfFn.set(t,funcs[t])},config:(new_ops,profile_name)=>{return t=new_ops,void((e=profile_name)?x.profiles={...x.profiles,[e]:t}:x={...x,...t})
var t,e},onTick:t=>{var e;(e=t)&&i.push(e)},register:t=>{"string"==typeof t&&(t=document.querySelector(t)),N(t)}}
exports.Mfld=A
