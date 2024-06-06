let t,e=[],n=!1,o=[],i="",r=globalThis?.requestAnimationFrame||(t=>setTimeout(t,0))
function s(t){e.push(t),n||(n=!0,r(f))}function l(e,n,o,r=!1,s){if(!s.trans?.smartTransition??1)return
t=document.createElement("div")
let{paddingTop:l,paddingBottom:a}=n instanceof Element?window.getComputedStyle(n):{paddingTop:0,paddingBottom:0}
i=t.style.height=`calc(${Math.abs(o-(e?.clientHeight||0))}px - ${l} - ${a})`,n?.after(t)}function a(e,n){if(!n.trans?.smartTransition??1)return
let o=(n?.trans?.dur?.[0]||n?.trans?.dur||600)/2
s((()=>{t?.remove(),e?.animate?.([{height:i},{height:`${e.clientHeight||0}px`}],o)}))}function f(){n=!1
for(let t of e)if("function"==typeof t)t()
else{let e=t.out?t.out.clientHeight:0
if("prepend"==t.relation)l?.(t.in,t.out,e,!1,t.ops),u(t.in,"in",t.ops,(()=>{t.in&&t.out?.prepend(t.in),a?.(t.in,t.ops)}))
else{if(["swapinner","swapouter"].includes(t.relation)){let e=t.out?.cloneNode(!0)
t.out?.after(e)
let n="swapinner"==t.relation
"swapinner"==t.relation&&(e.style.border="none",t.out.replaceChildren()),u(e,"out",t.ops,void 0,t.out,n)}l?.(t.in,t.out,e,!1,t.ops),u(t.in,"in",t.ops,(()=>{t.in&&("swapouter"==t.relation?t.out?.replaceWith(t.in):t.out?.appendChild(t.in)),a?.(t.in,t.ops)}))}t.done?.(t.in)}o.forEach((t=>t())),o=[],e=[]}function u(t,e,n,o,i,r=!1){if(t?.nodeType==Node.TEXT_NODE){let e=t.textContent,n=document?.createElement("div")
n.textContent=e,t.replaceWith(n),t=n}if(t){let l=Array.isArray(n.trans?.dur)?n.trans?.dur["in"==e?0:1]||n.trans?.dur[0]:n.trans?.dur||0,a=n?.trans?.class||"mf-trans"
if(console.log("CLASS",a),t?.classList?.add(a),n.trans?.hooks?.[`${e}-start`]?.(t),"out"==e){if(i||(i=t),!i)return
let e={}
if((n.trans?.smartTransition??1)&&0==r){let t=getComputedStyle(i)
e.w=`calc(${i.clientWidth}px - ${t.paddingLeft} - ${t.paddingRight})`,e.left=`calc(${i.getBoundingClientRect().left}px + ${window.scrollX}px)`,e.top=`calc(${i.getBoundingClientRect().top}px + ${window.scrollY}px)`}s((()=>{if(n.trans?.smartTransition??1){if(r&&i){let t=getComputedStyle(i)
e.w=`calc(${i.clientWidth}px - ${t.paddingLeft} - ${t.paddingRight})`,e.left=`calc(${i.getBoundingClientRect().left}px + ${window.scrollX}px)`,e.top=`calc(${i.getBoundingClientRect().top}px + ${window.scrollY}px)`}t.style.position="fixed",t.style.width=e.w,t.style.left=e.left,t.style.top=e.top,t.style.margin="0"}l&&(t.style.transitionDuration=`${l}ms`),t.classList?.add("out")}))}else t?.classList?.add("in"),l&&(t.style.transitionDuration=`${l}ms`),o?.(),setTimeout((()=>{s((()=>{setTimeout((()=>s((()=>t?.classList?.remove(e)))),0)}))}),n.trans?.swap||0)
setTimeout((()=>{s((()=>{"out"==e&&t?.remove(),t?.classList?.remove(a),n.trans?.hooks?.[`${e}-end`]?.(t)}))}),l+("in"==e&&n.trans?.swap||0))}}function c(t){if(!t)return 0
if("number"==typeof t)return t
if(!0===t)return 1
if(t instanceof Map)return c(Array.from(t.entries()))
if(t instanceof Set)return c(Array.from(t))
let e=0
for(let n of(new TextEncoder).encode("string"==typeof t?t:t?.toString()||""))e=(e<<5)-e+n
return e}globalThis.MfSt||(globalThis.MfSt=new Map),globalThis.MfFn||(globalThis.MfFn=new Map)
class d{t=void 0
o=new Map
i=void 0
l
u=new Set
constructor(t,e){return this.p(t,e)}p(t,e){return this.name=t,MfSt.set(t,this),this.l=new Set(e?.upstream?.map((t=>p(t)))||[]),this.l.forEach((t=>t?.u?.add(this))),this.value=e?.value,this.t=e?.updater,this}sub(t,e,n=!0){this.o.set(e||String(Date.now()+Math.random()),t),n&&t?.(this.value)}async update(t){return new Promise((async e=>{let n="function"==typeof t?(await t)?.(this.value):t,o=c(n)
if(o!==this.i){this.value=n,this.i=o
for(let t of this.u)await t.$()
s((()=>{for(let[t,e]of this?.o||[])e?.(this.value,t)
e(this.value)}))}else e(this.value)}))}async $(){let t=await(this.t?.(Array.from(this.l)?.map((t=>t?.value))||[],this?.value))
await this.update(void 0===t?this.value:t)}}function p(t,e){let n=MfSt.get(t)
return e?n?n.p(t,e):new d(t,e):n||new d(t,e)}let $="mf",h=/[\.\[\]\?]{1,}/g
function m(t,e,n){let o=t
for(let t of e)null==o&&(o="number"==typeof t?[]:{}),null==n||e[e.length-1]!==t?o=o instanceof Map?o?.get(t):o?.[t]:o instanceof Map?o.set(t,n):o[t]=n
return o}function w(t){let[e,...n]=t?.split(h)
return[e,n?.map((t=>isNaN(parseInt(t))?t:parseInt(t))).filter((t=>t))||[]]}function g(t,e,n,o=!0,i="{}",r){let s=e.dataset[`${$}${t}`]
if(s)return"overrides"==t?n.profiles?.[s||""]?.fetch||JSON.parse(s||"{}"):o?JSON.parse(s||i):"num"==r?parseInt(s)||void 0:"bool"==r?"true"==s||"false"!=s&&void 0:s}function y(t,e){let n=g("overrides",e,t),o={profiles:t.profiles,fetch:{...t.fetch,responseType:g("responsetype",e,t,!1)||t.fetch?.responseType,...n?.fetch||{},...g("fetch",e,t)||{}},trans:{...t.trans,dur:g("transdur",e,t,!0,"[]","num")||t.trans?.dur,swap:g("transswap",e,t,!1,"","num")||t.trans?.swap,class:g("transclass",e,t,!1)||t.trans?.class,smartTransition:g("transsmart",e,t,!1,void 0,"bool")||t.trans?.smartTransition,...n?.trans||{},...g("trans",e,t)||{}}}
return console.log("New ops",o),o}function v(t){let e="",n=""
if("string"==typeof t?(e=t,n=t):(e=t?.el?.dataset?.[t?.datakey]||"",n=e,e||void 0===t?.el?.dataset?.[`${$}else`]||(e="return true",n=`ELSE:${t?.el?.dataset?.[t?.datakey]||""}`)),!e)return{}
let[o,i]=e?.split("=>")?.map((t=>t.trim()))||["",""]
i||(i=o.slice(),o="")
let r=o?.split(",")?.map((t=>t.replace(/[()]/g,"").trim())),s=globalThis[i]||MfFn?.get(i)
return s||(i.match(/^\s{0,}\{/)||i.includes("return")||(i=i.replace(/^\s{0,}/,"return ")),s=new Function(...r,i)),{storeList:r,func:s,storeName:n}}function b(t,e,n,o,i,r){let l=async e=>{e?.preventDefault(),e?.stopPropagation()
let l=y(n,t)
i||(i=(e?.target)?.method||"get"),l?.fetch?.externals?.find((t=>o?.startsWith(t.domain)))||!o.match(/^https?:\/\//)||o.includes(location.origin)
let a=await fetch(o,{...l?.fetch?.request||{},method:i,body:"string"==typeof r?r:JSON.stringify(r)}).catch((t=>{l?.fetch?.err?.(t)})),f=a?.status
if(f&&0==l?.fetch?.onCode?.(f,a))return
let u=await(a?.[l?.fetch?.responseType||"text"]())
l?.fetch?.cb?.(u)
for(let e of["append","prepend","swapinner","swapouter"]){let n=t.dataset[`${$}${e}`]
if(void 0===n)continue
let[o,i]=n?.split("->").map((t=>t.trim()))||[],r=(new DOMParser)?.parseFromString?.(u,"text/html")
r&&s({in:r.querySelector(o||"body"),out:i?document.querySelector(i):t,relation:e,ops:l,done:t=>{_(t)}})}t.dataset?.[`${$}resolve`]&&alert("RESOLVING")}
"$mount"==e?l():t.addEventListener(e,l)}function T(t,e,n,o,i,r){if(i==`${$}bind`){let i=e.map(w),l=()=>{s((()=>{let e=i.map((t=>m(p(t[0])?.value,t[1]))),s=r?.(...e,t)??e[0]
n&&void 0!==s&&(t[n]=s),t.dispatchEvent(new CustomEvent(o))}))}
for(let e of i)p(e?.[0]||"")?.sub(l,t.id)}else if(i==`${$}sync`){let[i,s]=w(n||""),l=()=>{let n=e.map((e=>(e=e.trim(),t[e]??t.getAttribute(e)??t.dataset[e]??void 0))),o=r?.(...n)??n[0]
i&&void 0!==o&&p(i)?.update?.((t=>s?.length?m(t,s,o):o))}
"$mount"==o?l():t.addEventListener(o,l)}}function M(t,e){if("TEMPLATE"!=t.tagName){let n=document.createElement("template")
n.innerHTML=t.innerHTML
for(let e of t.attributes)n.setAttribute(e.name,e.value)
return t.replaceWith(n),e.innerHTML=t.innerHTML,n}return t}function x(t,e,n,o,i){return p(t||"",{upstream:[...e||[],...n||[]],updater:t=>{if(o)for(let e of t.slice(-o)||[])if(e)return!1
return i?.(...t)}})}function S(t,e,n){let o=y(n,t),i=document.createElement("div")
if(t.before(i),e==`${$}if`){i.classList.add("mfld-active-condition")
let n=t,r=[]
for(;n&&n;){let{storeList:t,func:l,storeName:a}=v({el:n,datakey:r.length?`${$}elseif`:e})
if(!t&&!l)break
n=M(n,i)
let f=x(a,t,r,r.length,l)
r.push(f.name)
let u=n.cloneNode(!0)
f?.sub((t=>{if(!t)return
let e=document.createElement("div")
e.innerHTML=u.innerHTML,"TEMPLATE"==u?.tagName&&s({in:e,out:i,relation:"swapinner",ops:o,done:t=>_(t)})})),n=n?.nextElementSibling}}if(e==`${$}each`){i.classList.add("mfld-loop-result")
let[e,n]=t.dataset[`${$}each`]?.split("as")?.map((t=>t.trim()))||[],[r,l]=n.split(/\s{0,},\s{0,}/)?.map((t=>t.trim()))||["value","key"],{storeList:a,func:f,storeName:u}=v(e)
t=M(t,i)
let c=x(`LOOP:${u}`,a,[],0,f)
c?.sub((e=>{i.replaceChildren(),function(t,e){if(t instanceof Map)for(const[n,o]of t.entries())e(n,o)
else try{let n=Array.from(t)
if(n?.length)n.forEach(e)
else for(let n in t)e(n,t[n])}catch(e){console.error(`${t} is not iterable`)}}(e||[],((e,n)=>{let a=document.createElement("div")
a.innerHTML=t.innerHTML.replace(`\${${l}}`,e).replace(`\${${r}}`,n),s({in:a,out:i,relation:"append",ops:o,done:t=>_(t)})}))}))}}let N={},E=/, {0,}/g,L=0,A=["bind","sync","if","each","get","head","post","put","delete","patch"].map((t=>`${$}${t}`))
function _(t){let e=(t||document.body).querySelectorAll(`[data-${A.join("],[data-")}]${0!=N.fetch?.auto?",a":""}`)||[]
for(let t of e){t.id||(t.id=""+L++)
for(let e in t.dataset){if([`${$}if`,`${$}each`].includes(e)){console.log("Handling conditionals",e),S(t,e,N)
continue}if(!A.includes(e))continue
let n=![`${$}bind`].includes(e),o=`(#${t.id} on ${e})`
t.dataset?.[e]?.split(";").forEach((i=>{let[r,s]=i?.split("->")?.map((t=>t.trim()))||[],l=n?O(r.slice(0,r.indexOf(")"))):[],a=n?r.slice(r.indexOf(")")+1):r,f=a.includes("=>")?a:a.includes("(")&&a.match(/^[^\(]{1,}/)?.[0]||"",u=f?O(a.slice(0,(a.indexOf(")")||-2)+1)):a.split(E)?.map((t=>t.trim()))
if(console.log(i,f),n&&!l?.length)return console.error(`No trigger: ${o}.`)
let c=v(f)?.func
f?c||console.warn(`"${f}" not registered: ${o}`):u.length>1&&console.warn(`Multiple inputs without function: ${o}`),l?.length||(l=[""])
for(let n of l)e.match(/bind|sync/)?T(t,u,s,n,e,c):b(t,n,N,u[0],e.replace($,""),s)}))}}}function O(t){if(t?.includes("(")){let e=t.match(/[^\(\)]{1,}/g)
t=e?.[e.length-1]||""}return t?.split(E)?.map((t=>t.trim()))||[]}let P={store:(store_name,store_ops)=>(store_ops?.hasOwnProperty("value")||store_ops?.hasOwnProperty("updater")||(store_ops={value:store_ops}),p(store_name,store_ops)),ustore:(store_name,store_ops)=>p(store_name,store_ops),get:store_name=>p(store_name),func:func_name=>MfFn?.get(func_name),funcs:funcs=>{for(let t in funcs)MfFn.set(t,funcs[t])},config:(new_ops,profile_name)=>{return t=new_ops,void((e=profile_name)?N.profiles={...N.profiles,[e]:t}:N={...N,...t})
var t,e},onTick:t=>{var e;(e=t)&&o.push(e)},register:t=>{"string"==typeof t&&(t=document.querySelector(t)),_(t)}}
exports.Mfld=P
