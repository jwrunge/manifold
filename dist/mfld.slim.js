let t,e=[],n=!1,i=[],o="",r=globalThis?.requestAnimationFrame||(t=>setTimeout(t,0))
function l(t){e.push(t),n||(n=!0,r(a))}function s(e,n,i,r=!1){t=document.createElement("div")
let{paddingTop:l,paddingBottom:s}=n instanceof Element?window.getComputedStyle(n):{paddingTop:0,paddingBottom:0}
o=t.style.height=`calc(${Math.abs(i-(e?.clientHeight||0))}px - ${l} - ${s})`,n?.after(t)}function f(e,n){let i=(n?.trans?.dur?.[0]||n?.trans?.dur||600)/2
l((()=>{t?.remove(),e?.animate?.([{height:o},{height:`${e.clientHeight||0}px`}],i)}))}function a(){n=!1
for(let t of e)if("function"==typeof t)t()
else{let e=t.out?t.out.clientHeight:0
if("prepend"==t.relation)s?.(t.in,t.out,e),u(t.in,"in",t.ops,(()=>{t.in&&t.out?.prepend(t.in),f?.(t.in,t.ops)}))
else{if(["swapinner","swapouter"].includes(t.relation)){let e=t.out?.cloneNode(!0)
t.out?.after(e)
let n="swapinner"==t.relation
"swapinner"==t.relation&&(e.style.border="none",t.out.replaceChildren()),u(e,"out",t.ops,void 0,t.out,n)}s?.(t.in,t.out,e),u(t.in,"in",t.ops,(()=>{t.in&&("swapouter"==t.relation?t.out?.replaceWith(t.in):t.out?.appendChild(t.in)),f?.(t.in,t.ops)}))}t.done?.(t.in)}i.forEach((t=>t())),i=[],e=[]}function u(t,e,n,i,o,r=!1){if(t?.nodeType==Node.TEXT_NODE){let e=t.textContent,n=document?.createElement("div")
n.textContent=e,t.replaceWith(n),t=n}if(t){let s=Array.isArray(n.trans?.dur)?n.trans?.dur["in"==e?0:1]||n.trans?.dur[0]:n.trans?.dur||0,f=n?.trans?.class||"mf-trans"
if(t?.classList?.add(f),n.trans?.hooks?.[`${e}-start`]?.(t),"out"==e){if(o||(o=t),!o)return
let e={}
if(0==r){let t=getComputedStyle(o)
e.w=`calc(${o.clientWidth}px - ${t.paddingLeft} - ${t.paddingRight})`,e.left=`calc(${o.getBoundingClientRect().left}px + ${window.scrollX}px)`,e.top=`calc(${o.getBoundingClientRect().top}px + ${window.scrollY}px)`}l((()=>{if(r&&o){let t=getComputedStyle(o)
e.w=`calc(${o.clientWidth}px - ${t.paddingLeft} - ${t.paddingRight})`,e.left=`calc(${o.getBoundingClientRect().left}px + ${window.scrollX}px)`,e.top=`calc(${o.getBoundingClientRect().top}px + ${window.scrollY}px)`}t.style.position="fixed",t.style.width=e.w,t.style.left=e.left,t.style.top=e.top,t.style.margin="0",s&&(t.style.transitionDuration=`${s}ms`),t.classList?.add("out")}))}else t?.classList?.add("in"),s&&(t.style.transitionDuration=`${s}ms`),i?.(),setTimeout((()=>{l((()=>{setTimeout((()=>l((()=>t?.classList?.remove(e)))),0)}))}),n.trans?.swap||0)
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
return e?n?n.p(t,e):new d(t,e):n||new d(t,e)}globalThis.DOMParser&&new DOMParser
let h="mf"
function $(t,e,n){let i=t
for(let t of e)null==i&&(i="number"==typeof t?[]:{}),null==n||e[e.length-1]!==t?i=i instanceof Map?i?.get(t):i?.[t]:i instanceof Map?i.set(t,n):i[t]=n
return i}function w(t,e,n,i,o,r){let s=async e=>{e?.preventDefault(),e?.stopPropagation()
let s=t.dataset[`${h}overrides`]||"{}",f=n.profiles?.[s]?.fetch||JSON.parse(s),a=f?{...n,...f}:n
r||(r="string"==typeof o?structuredClone(o):(e?.target)?.href,o=a?.fetch?.request?.body),i||(i=(e?.target)?.method||"get"),a?.fetch?.externals?.find((t=>r?.startsWith(t.domain)))||!r.match(/^https?:\/\//)||r.includes(location.origin)
let u=await fetch(r,{...a?.fetch?.request||{},method:i,body:"string"==typeof o?o:JSON.stringify(o)}).catch((t=>{a?.fetch?.err?.(t)})),c=u?.status
if(c&&0==a?.fetch?.onCode?.(c,u))return
let d=await(u?.[a?.fetch?.type||"text"]())
a?.fetch?.cb?.(d)
for(let e of["append","prepend","swapinner","swapouter"]){let n=t.dataset[`${h}${e}`]
if(void 0===n)continue
let[i,o]=n?.split("->").map((t=>t.trim()))||[],r=(new DOMParser)?.parseFromString?.(d,"text/html")
r&&l({in:r.querySelector(i||"body"),out:o?document.querySelector(o):t,relation:e,ops:a,done:()=>!0})}t.dataset?.[`${h}resolve`]&&alert("RESOLVING")}
"$mount"==e?s():t.addEventListener(e,s)}function m(t,e,n,i,o,r,s){e?.length||(e=[""])
for(let f=0;f<e.length;f++)if(o==`${h}bind`){let o=()=>{l((()=>{let o=r?.(...n.map((t=>$(p(t.name)?.value,t.path))),t)??$(p(n[0].name||"")?.value,n[0].path)
void 0!==o&&(t[e[f]]=o),t.dispatchEvent(new CustomEvent(i))}))}
for(let e of n)p(e.name)?.sub(o,t.id)}else if(o==`${h}sync`){if(n.length>1)throw`Only one store supported: ${s}`
let o=()=>{let i=e[f].trim(),o=t[i]??t.getAttribute(i)??t.dataset[i]??void 0
r&&(o=r?.(o,t))
let l=p(n[0]?.name)
void 0!==o&&l?.update?.((t=>n[0]?.path?.length?$(t,n[0]?.path,o):o))}
"$mount"==i?o():t.addEventListener(i,o)}}function g(t,e){let n=t?.dataset?.[e],i=n
if(n||void 0===t?.dataset?.[`${h}else`]||(n="return true",i=`ELSE:${t?.dataset?.[e]||""}`),!n)return{}
let[o,r]=n?.split("=>")?.map((t=>t.trim()))||["",""]
r||(r=o.slice(),o="")
let l=o?.split(",")?.map((t=>t.replace(/[()]/g,"").trim()))
return{storeList:l,execFunc:globalThis[r]||MfFn?.get(r)||new Function(...l,r),storeName:i}}function y(t,e,n){if(e==`${h}if`){let i=document.createElement("div")
i.classList.add("mfld-active-condition"),t.before(i)
let o=t,r=[]
for(;o&&o;){let{storeList:t,execFunc:s,storeName:f}=g(o,r.length?`${h}elseif`:e)
if(!t&&!s)break
if("TEMPLATE"!=o.tagName){let t=document.createElement("template")
t.innerHTML=o.innerHTML
for(let e of o.attributes)t.setAttribute(e.name,e.value)
o.replaceWith(t),o=t,i.innerHTML=o.innerHTML}let a=r.length,u=p(f||"",{upstream:[...t,...r],updater:t=>{if(a)for(let e of t.slice(-a)||[])if(e)return!1
return s(...t.slice(0,-1))}})
r.push(u.name)
let c=o.cloneNode(!0)
u?.sub((t=>{if(!t)return
let e=document.createElement("div")
e.innerHTML=c.innerHTML,"TEMPLATE"==c?.tagName&&l({in:e,out:i,relation:"swapinner",ops:n,done:t=>!0})})),o=o?.nextElementSibling}}else alert("Not set up for loops yet")}let T={},b=/, {0,}/g,v=0,M=["bind","sync","if","get","head","post","put","delete","patch"].map((t=>`${h}${t}`))
function x(t,e){e?T.profiles={...T.profiles,[e]:t}:T={...T,...t}}function S(t){let e=(t||document.body).querySelectorAll(`[data-${M.join("],[data-")}]${0!=T.fetch?.auto?",a":""}`)||[]
for(let t of e){t.id||(t.id=""+v++)
for(let e in t.dataset){if([`${h}if`,`${h}each`].includes(e)){y(t,e,T)
continue}if(!M.includes(e))continue
let n=![`${h}bind`].includes(e),i=`(#${t.id} on ${e})`
t.dataset?.[e]?.split(";").forEach((o=>{let r,l=o?.split(/(?:(?:\)|->) ?){1,}/g)||[],s=n?N(l.splice(0,1)[0]):[],f=l[0]?.includes("(")&&l[0]?.match(/^[^\(]{1,}/)?.[0]||"",a=N(l.splice(e==`${h}sync`?1:0,1)[0]),u=N(l[0])
if(n&&!s?.length)throw`No trigger: ${i}.`
if(f&&(r=globalThis[f]||MfFn?.get(f),r||console.warn(`"${f}" not registered: ${i}`),!n&&a.length>1||n&&u.length>1))throw`Multiple sources: ${i}`
let c=a.map((t=>{let[e,...n]=t.split(/[\.\[\]\?]{1,}/g)
return{name:e,path:n.map((t=>isNaN(parseInt(t))?t:parseInt(t))).filter((t=>t))}}))
s?.length||(s=[""])
for(let n of s)if(e.match(/bind|sync/))m(t,u,c,n,e,r,i)
else{if(u.length>1||a.length>1)throw`Multiple sources: ${i}`
w(t,n,T,e.replace(h,""),u[0],a[0])}}))}}}function N(t){if(t?.includes("(")){let e=t.match(/[^\(\)]{1,}/g)
t=e?.[e.length-1]||""}return t?.split(b)?.map((t=>t.trim()))||[]}let E={store:(store_name,store_ops)=>(store_ops?.hasOwnProperty("value")||store_ops?.hasOwnProperty("updater")||(store_ops={value:store_ops}),p(store_name,store_ops)),ustore:(store_name,store_ops)=>p(store_name,store_ops),get:store_name=>p(store_name),func:func_name=>MfFn?.get(func_name),funcs:funcs=>{for(let t in funcs)MfFn.set(t,funcs[t])},config:(new_ops,profile_name)=>x(new_ops,profile_name),onTick:t=>{var e;(e=t)&&i.push(e)},register:t=>{"string"==typeof t&&(t=document.querySelector(t)),S(t)}}
globalThis.Mfld=E
let _=globalThis.document?.currentScript?.dataset||{}
if(_?.config)try{x(JSON.parse(_?.config))}catch(t){console.warn("Invalid Mfld params",t)}_?.init&&S(document.querySelector(_.init))
