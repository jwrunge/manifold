let t,e=[],n=!1,i=[],o="",r=globalThis?.requestAnimationFrame||(t=>setTimeout(t,0))
function l(t){e.push(t),n||(n=!0,r(a))}function s(e,n,i,r=!1,l){if(!l.trans?.smartTransition??1)return
t=document.createElement("div")
let{paddingTop:s,paddingBottom:f}=n instanceof Element?window.getComputedStyle(n):{paddingTop:0,paddingBottom:0}
o=t.style.height=`calc(${Math.abs(i-(e?.clientHeight||0))}px - ${s} - ${f})`,n?.after(t)}function f(e,n){if(!n.trans?.smartTransition??1)return
let i=(n?.trans?.dur?.[0]||n?.trans?.dur||600)/2
l((()=>{t?.remove(),e?.animate?.([{height:o},{height:`${e.clientHeight||0}px`}],i)}))}function a(){n=!1
for(let t of e)if("function"==typeof t)t()
else{let e=t.out?t.out.clientHeight:0
if("prepend"==t.relation)s?.(t.in,t.out,e,!1,t.ops),u(t.in,"in",t.ops,(()=>{t.in&&t.out?.prepend(t.in),f?.(t.in,t.ops)}))
else{if(["swapinner","swapouter"].includes(t.relation)){let e=t.out?.cloneNode(!0)
t.out?.after(e)
let n="swapinner"==t.relation
"swapinner"==t.relation&&(e.style.border="none",t.out.replaceChildren()),u(e,"out",t.ops,void 0,t.out,n)}s?.(t.in,t.out,e,!1,t.ops),u(t.in,"in",t.ops,(()=>{t.in&&("swapouter"==t.relation?t.out?.replaceWith(t.in):t.out?.appendChild(t.in)),f?.(t.in,t.ops)}))}t.done?.(t.in)}i.forEach((t=>t())),i=[],e=[]}function u(t,e,n,i,o,r=!1){if(t?.nodeType==Node.TEXT_NODE){let e=t.textContent,n=document?.createElement("div")
n.textContent=e,t.replaceWith(n),t=n}if(t){let s=Array.isArray(n.trans?.dur)?n.trans?.dur["in"==e?0:1]||n.trans?.dur[0]:n.trans?.dur||0,f=n?.trans?.class||"mf-trans"
if(t?.classList?.add(f),n.trans?.hooks?.[`${e}-start`]?.(t),"out"==e){if(o||(o=t),!o)return
let e={}
if((n.trans?.smartTransition??1)&&0==r){let t=getComputedStyle(o)
e.w=`calc(${o.clientWidth}px - ${t.paddingLeft} - ${t.paddingRight})`,e.left=`calc(${o.getBoundingClientRect().left}px + ${window.scrollX}px)`,e.top=`calc(${o.getBoundingClientRect().top}px + ${window.scrollY}px)`}l((()=>{if(n.trans?.smartTransition??1){if(r&&o){let t=getComputedStyle(o)
e.w=`calc(${o.clientWidth}px - ${t.paddingLeft} - ${t.paddingRight})`,e.left=`calc(${o.getBoundingClientRect().left}px + ${window.scrollX}px)`,e.top=`calc(${o.getBoundingClientRect().top}px + ${window.scrollY}px)`}t.style.position="fixed",t.style.width=e.w,t.style.left=e.left,t.style.top=e.top,t.style.margin="0"}s&&(t.style.transitionDuration=`${s}ms`),t.classList?.add("out")}))}else t?.classList?.add("in"),s&&(t.style.transitionDuration=`${s}ms`),i?.(),setTimeout((()=>{l((()=>{setTimeout((()=>l((()=>t?.classList?.remove(e)))),0)}))}),n.trans?.swap||0)
setTimeout((()=>{l((()=>{"out"==e&&t?.remove(),t?.classList?.remove(f),n.trans?.hooks?.[`${e}-end`]?.(t)}))}),s+("in"==e&&n.trans?.swap||0))}}function c(t){if(!t)return 0
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
for(let t of this.u)await t.h()
l((()=>{for(let[t,e]of this?.i||[])e?.(this.value,t)
e(this.value)}))}else e(this.value)}))}async h(){let t=await(this.t?.(Array.from(this.l)?.map((t=>t?.value))||[],this?.value))
await this.update(void 0===t?this.value:t)}}function p(t,e){let n=MfSt.get(t)
return e?n?n.p(t,e):new d(t,e):n||new d(t,e)}let h="mf",$=/[\.\[\]\?]{1,}/g
function m(t,e,n){let i=t
for(let t of e)null==i&&(i="number"==typeof t?[]:{}),null==n||e[e.length-1]!==t?i=i instanceof Map?i?.get(t):i?.[t]:i instanceof Map?i.set(t,n):i[t]=n
return i}function w(t){let[e,...n]=t?.split($)
return[e,n?.map((t=>isNaN(parseInt(t))?t:parseInt(t))).filter((t=>t))||[]]}function g(t,e){let n=e.dataset[`${h}overrides`]||"{}",i=t.profiles?.[n]?.fetch||JSON.parse(n)
return i?{...t,...i}:t}function y(t){let e="",n=""
if("string"==typeof t?e=t:(e=t?.el?.dataset?.[t?.datakey]||"",n=e,e||void 0===t?.el?.dataset?.[`${h}else`]||(e="return true",n=`ELSE:${t?.el?.dataset?.[t?.datakey]||""}`)),!e)return{}
let[i,o]=e?.split("=>")?.map((t=>t.trim()))||["",""]
o||(o=i.slice(),i="")
let r=i?.split(",")?.map((t=>t.replace(/[()]/g,"").trim()))
return{storeList:r,func:globalThis[o]||MfFn?.get(o)||new Function(...r,o),storeName:n}}function v(t,e,n,i,o,r){let s=async e=>{e?.preventDefault(),e?.stopPropagation()
let s=g(n,t)
o||(o=(e?.target)?.method||"get"),s?.fetch?.externals?.find((t=>i?.startsWith(t.domain)))||!i.match(/^https?:\/\//)||i.includes(location.origin)
let f=await fetch(i,{...s?.fetch?.request||{},method:o,body:"string"==typeof r?r:JSON.stringify(r)}).catch((t=>{s?.fetch?.err?.(t)})),a=f?.status
if(a&&0==s?.fetch?.onCode?.(a,f))return
let u=await(f?.[s?.fetch?.type||"text"]())
s?.fetch?.cb?.(u)
for(let e of["append","prepend","swapinner","swapouter"]){let n=t.dataset[`${h}${e}`]
if(void 0===n)continue
let[i,o]=n?.split("->").map((t=>t.trim()))||[],r=(new DOMParser)?.parseFromString?.(u,"text/html")
r&&l({in:r.querySelector(i||"body"),out:o?document.querySelector(o):t,relation:e,ops:s,done:t=>{_(t)}})}t.dataset?.[`${h}resolve`]&&alert("RESOLVING")}
"$mount"==e?s():t.addEventListener(e,s)}function T(t,e,n,i,o,r){if(o==`${h}bind`){let o=e.map(w),s=()=>{l((()=>{let e=o.map((t=>m(p(t[0])?.value,t[1]))),l=r?.(...e,t)??e[0]
n&&void 0!==l&&(t[n]=l),t.dispatchEvent(new CustomEvent(i))}))}
for(let e of o)p(e?.[0]||"")?.sub(s,t.id)}else if(o==`${h}sync`){let[o,l]=w(n||""),s=()=>{let n=e.map((e=>(e=e.trim(),t[e]??t.getAttribute(e)??t.dataset[e]??void 0))),i=r?.(...n)??n[0]
o&&void 0!==i&&p(o)?.update?.((t=>l?.length?m(t,l,i):i))}
"$mount"==i?s():t.addEventListener(i,s)}}function b(t,e,n){if(e==`${h}if`){let i=g(n,t),o=document.createElement("div")
o.classList.add("mfld-active-condition"),t.before(o)
let r=t,s=[]
for(;r&&r;){let{storeList:t,func:n,storeName:f}=y({el:r,datakey:s.length?`${h}elseif`:e})
if(!t&&!n)break
if("TEMPLATE"!=r.tagName){let t=document.createElement("template")
t.innerHTML=r.innerHTML
for(let e of r.attributes)t.setAttribute(e.name,e.value)
r.replaceWith(t),r=t,o.innerHTML=r.innerHTML}let a=s.length,u=p(f||"",{upstream:[...t||[],...s],updater:t=>{if(a)for(let e of t.slice(-a)||[])if(e)return!1
return n?.(...t.slice(0,-1))}})
s.push(u.name)
let c=r.cloneNode(!0)
u?.sub((t=>{if(!t)return
let e=document.createElement("div")
e.innerHTML=c.innerHTML,"TEMPLATE"==c?.tagName&&l({in:e,out:o,relation:"swapinner",ops:i,done:t=>_(t)})})),r=r?.nextElementSibling}}else alert("Not set up for loops yet")}let M={},x=/, {0,}/g,S=0,N=["bind","sync","if","get","head","post","put","delete","patch"].map((t=>`${h}${t}`))
function E(t,e){e?M.profiles={...M.profiles,[e]:t}:M={...M,...t}}function _(t){let e=(t||document.body).querySelectorAll(`[data-${N.join("],[data-")}]${0!=M.fetch?.auto?",a":""}`)||[]
for(let t of e){t.id||(t.id=""+S++)
for(let e in t.dataset){if([`${h}if`,`${h}each`].includes(e)){b(t,e,M)
continue}if(!N.includes(e))continue
let n=![`${h}bind`].includes(e),i=`(#${t.id} on ${e})`
t.dataset?.[e]?.split(";").forEach((o=>{let[r,l]=o?.split("->")?.map((t=>t.trim()))||[],s=n?A(r.slice(0,r.indexOf(")"))):[],f=n?r.slice(r.indexOf(")")+1):r,a=f.includes("=>")?f:f.includes("(")&&f.match(/^[^\(]{1,}/)?.[0]||"",u=a?A(f.slice(0,(f.indexOf(")")||-2)+1)):f.split(x)?.map((t=>t.trim()))
if(n&&!s?.length)return console.error(`No trigger: ${i}.`)
let c=y(a)?.func
a?c||console.warn(`"${a}" not registered: ${i}`):u.length>1&&console.warn(`Multiple inputs without function: ${i}`),s?.length||(s=[""])
for(let n of s)e.match(/bind|sync/)?T(t,u,l,n,e,c):v(t,n,M,u[0],e.replace(h,""),l)}))}}}function A(t){if(t?.includes("(")){let e=t.match(/[^\(\)]{1,}/g)
t=e?.[e.length-1]||""}return t?.split(x)?.map((t=>t.trim()))||[]}let L={store:(store_name,store_ops)=>(store_ops?.hasOwnProperty("value")||store_ops?.hasOwnProperty("updater")||(store_ops={value:store_ops}),p(store_name,store_ops)),ustore:(store_name,store_ops)=>p(store_name,store_ops),get:store_name=>p(store_name),func:func_name=>MfFn?.get(func_name),funcs:funcs=>{for(let t in funcs)MfFn.set(t,funcs[t])},config:(new_ops,profile_name)=>E(new_ops,profile_name),onTick:t=>{var e;(e=t)&&i.push(e)},register:t=>{"string"==typeof t&&(t=document.querySelector(t)),_(t)}}
globalThis.Mfld=L
let O=globalThis.document?.currentScript?.dataset||{}
if(O?.config)try{E(JSON.parse(O?.config))}catch(t){console.warn("Invalid Mfld params",t)}O?.init&&_(document.querySelector(O.init))
