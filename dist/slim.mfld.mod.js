let t="mf_",e=/[\.\[\]\?]{1,}/g
function n(t,e,n){let o=t
for(let t of e)null==o&&(o="number"==typeof t?[]:{}),null==n||e[e.length-1]!==t?o=o instanceof Map?o?.get(t):o?.[t]:o instanceof Map?o.set(t,n):o[t]=n
return o}function o(t){let[n,...o]=t?.split(e)
return[n,o?.map((t=>isNaN(parseInt(t))?t:parseInt(t))).filter((t=>t))||[]]}function i(e,n,o,i=!0,r="{}",l){let s=n.dataset[`${t}${e}`]
if(s)return"overrides"==e?o.profiles?.[s||""]?.fetch||JSON.parse(s||"{}"):i?JSON.parse(s||r):"num"==l?parseInt(s)||void 0:"bool"==l?"true"==s||"false"!=s&&void 0:s}function r(t,e){let n=i("overrides",e,t)
return{profiles:t.profiles,fetch:{...t.fetch,responseType:i("responsetype",e,t,!1)||t.fetch?.responseType,...n?.fetch||{},...i("fetch",e,t)||{}},trans:{...t.trans,dur:i("transdur",e,t,!0,"[]","num")||t.trans?.dur,swap:i("transswap",e,t,!1,"","num")||t.trans?.swap,class:i("transclass",e,t,!1)||t.trans?.class,smartTransition:i("transsmart",e,t,!1,void 0,"bool")||t.trans?.smartTransition,...n?.trans||{},...i("trans",e,t)||{}}}}function l(e){let n="",o=""
if("string"==typeof e?(n=e,o=e):(n=e?.el?.dataset?.[e?.datakey]||"",o=n,n||void 0===e?.el?.dataset?.[`${t}else`]||(n="return true",o=`ELSE:${e?.el?.dataset?.[e?.datakey]||""}`)),!n)return{}
let[i,r]=n?.split("=>")?.map((t=>t.trim()))||["",""]
r||(r=i.slice(),i="")
let l=i?.split(",")?.map((t=>t.replace(/[()]/g,"").trim())),s=globalThis[r]||MfFn?.get(r)
return s||(r.match(/^\s{0,}\{/)||r.includes("return")||(r=r.replace(/^\s{0,}/,"return ")),s=new Function(...l,r)),{storeList:l,func:s,storeName:o}}let s,f=[],a=!1,u=[],c="",d=globalThis?.requestAnimationFrame||(t=>setTimeout(t,0))
function p(t){f.push(t),a||(a=!0,d(m))}function $(t,e,n,o=!1,i){if(!i.trans?.smartTransition??1)return
s=document.createElement("div")
let{paddingTop:r,paddingBottom:l}=e instanceof Element?window.getComputedStyle(e):{paddingTop:0,paddingBottom:0}
c=s.style.height=`calc(${Math.abs(n-(t?.clientHeight||0))}px - ${r} - ${l})`,e?.after(s)}function h(t,e){if(!e.trans?.smartTransition??1)return
let n=(e?.trans?.dur?.[0]||e?.trans?.dur||600)/2
p((()=>{s?.remove(),t?.animate?.([{height:c},{height:`${t.clientHeight||0}px`}],n)}))}function m(){a=!1
for(let t of f)if("function"==typeof t)t()
else{let e=t.out?t.out.clientHeight:0
if("prepend"==t.relation)$?.(t.in,t.out,e,!1,t.ops),w(t.in,"in",t.ops,(()=>{t.in&&t.out?.prepend(t.in),h?.(t.in,t.ops)}))
else{if(["swapinner","swapouter"].includes(t.relation)){let e=t.out?.cloneNode(!0)
if(e){t.out?.after(e)
let n="swapinner"==t.relation
"swapinner"==t.relation&&(e.style.border="none",t.out.replaceChildren()),w(e,"out",t.ops,void 0,t.out,n)}}$?.(t.in,t.out,e,!1,t.ops),w(t.in,"in",t.ops,(()=>{t.in&&("swapouter"==t.relation?t.out?.replaceWith(t.in):t.out?.appendChild(t.in)),h?.(t.in,t.ops)}))}t.done?.(t.in)}for(let t of u)t()
u=[],f=[]}function w(e,n,o,i,r,l=!1){if(e?.nodeType==Node.TEXT_NODE){let t=e.textContent,n=document?.createElement("div")
n.textContent=t,e.replaceWith(n),e=n}if(e){let s=Array.isArray(o.trans?.dur)?o.trans?.dur["in"==n?0:1]||o.trans?.dur[0]:o.trans?.dur||0,f=o?.trans?.class||`${t}trans`
if(e?.classList?.add(f),o.trans?.hooks?.[`${n}-start`]?.(e),"out"==n){if(r||(r=e),!r)return
let t={}
if((o.trans?.smartTransition??1)&&0==l){let e=getComputedStyle(r)
t.w=`calc(${r.clientWidth}px - ${e.paddingLeft} - ${e.paddingRight})`,t.left=`calc(${r.getBoundingClientRect().left}px + ${window.scrollX}px)`,t.top=`calc(${r.getBoundingClientRect().top}px + ${window.scrollY}px)`}p((()=>{if(o.trans?.smartTransition??1){if(l&&r){let e=getComputedStyle(r)
t.w=`calc(${r.clientWidth}px - ${e.paddingLeft} - ${e.paddingRight})`,t.left=`calc(${r.getBoundingClientRect().left}px + ${window.scrollX}px)`,t.top=`calc(${r.getBoundingClientRect().top}px + ${window.scrollY}px)`}e.style.position="fixed",e.style.width=t.w,e.style.left=t.left,e.style.top=t.top,e.style.margin="0"}s&&(e.style.transitionDuration=`${s}ms`),e.classList?.add("out")}))}else e?.classList?.add("in"),s&&(e.style.transitionDuration=`${s}ms`),i?.(),setTimeout((()=>{p((()=>{setTimeout((()=>p((()=>e?.classList?.remove(n)))),0)}))}),o.trans?.swap||0)
setTimeout((()=>{p((()=>{"out"==n&&e?.remove(),e?.classList?.remove(f),o.trans?.hooks?.[`${n}-end`]?.(e)}))}),s+("in"==n&&o.trans?.swap||0))}}function g(t){if(!t)return 0
if("number"==typeof t)return t
if(!0===t)return 1
if(t instanceof Map)return g(Array.from(t.entries()))
if(t instanceof Set)return g(Array.from(t))
let e=0
for(let n of(new TextEncoder).encode("string"==typeof t?t:t?.toString()||""))e=(e<<5)-e+n
return e}globalThis.MfSt||(globalThis.MfSt=new Map),globalThis.MfFn||(globalThis.MfFn=new Map)
class y{t=void 0
o=new Map
i=void 0
l=new Set
u=new Set
constructor(t,e){return this.p(t,e)}p(t,e){return this.name=t,MfSt.set(t,this),e?.upstream?.map((t=>{let e=v(t)
return this.l.add(e),e.u.add(this),e})),this.value=e?.value,this.t=e?.updater,this.$(),this}sub(t,e,n=!0){this.o.set(e||String(Date.now()+Math.random()),t),n&&t?.(this.value)}async update(t){return new Promise((async e=>{let n="function"==typeof t?(await t)?.(this.value):t,o=g(n)
if(o!==this.i){this.value=n,this.i=o
for(let t of this.u)await t.$()
p((()=>{for(let[t,e]of this?.o||[])e?.(this.value,t)
e(this.value)}))}else e(this.value)}))}async $(){let t=await(this.t?.(Array.from(this.l)?.map((t=>t?.value))||[],this?.value))
await this.update(void 0===t?this.value:t)}}function v(t,e){let n=MfSt.get(t)
return e?n?n.p(t,e):new y(t,e):n||new y(t,e)}function b(e,n,o,i,r,s,f){let a=async n=>{n?.preventDefault(),n?.stopPropagation(),r||(r=(n?.target)?.method||"get"),o?.fetch?.externals?.find((t=>i?.startsWith(t.domain)))||!i.match(/^https?:\/\//)||i.includes(location.origin)
let a=Array.isArray(s)?s[0]:"$form"==s?new FormData(e):s
if(f){let t=Array.isArray(s)?s?.map((t=>v(t).value))||[]:[a]
a=f?.(...t)}let u=await fetch(i,{...o?.fetch?.request||{},headers:{...o?.fetch?.request?.headers,"Manifold-App-Fetch":"true"},method:r,body:"$form"==s||"string"==typeof a?a:JSON.stringify(a)}).catch((t=>{o?.fetch?.err?.(t)||console.error("FETCH ERROR",t)})),c=u?.status
if(c&&0==o?.fetch?.onCode?.(c,u))return
let d=await(u?.[o?.fetch?.responseType||"text"]())
for(let n of["append","prepend","swapinner","swapouter"]){let i=e.dataset[`${t}${n}`]
if(void 0===i)continue
let[r,l]=i?.split("->").map((t=>t.trim()))||[],s=(new DOMParser)?.parseFromString?.(d,"text/html")
s&&p({in:s.querySelector(r||"body"),out:l?document.querySelector(l):e,relation:n,ops:o,done:t=>{L(t)}})}void 0!==e.dataset?.[`${t}pushstate`]&&history.pushState({},"",i)
let $=e.dataset?.[`${t}resolve`],h=l($||"")?.func
h?.(d)}
"$mount"==n?a():e.addEventListener(n,a)}function T(e,i,r,l,s,f){if(s==`${t}bind`){let t=i.map(o),s=()=>{p((()=>{let o=t.map((t=>n(v(t[0])?.value,t[1]))),i=f?.(...o,e)??o[0]
if(r&&void 0!==i){let t=r.split(":")
if(t.length>1)switch(t[0]){case"style":e.style[t[1]]=i
break
case"attr":e.setAttribute(t[1],i)
break
default:e[r]=i}else e[r]=i}e.dispatchEvent(new CustomEvent(l))}))}
for(let e of t)v(e?.[0]||"")?.sub(s)}else if(s==`${t}sync`){let[t,s]=o(r||""),a=()=>{let o=i.map((t=>{let n=(t=t.trim()).split(":")
if(!(n.length>1))return e[t]??void 0
switch(n[0]){case"style":return e.style[t]??void 0
case"attr":return e.getAttribute(t)??void 0
default:return e[t]??void 0}})),r=f?.(...o)??o[0]
t&&void 0!==r&&v(t)?.update?.((t=>s?.length?n(t,s,r):r))}
"$mount"==l?a():e.addEventListener(l,a)}}function M(t){if("TEMPLATE"!=t.tagName){let e=document.createElement("template")
e.innerHTML=t.innerHTML
for(let n of t.attributes)e.setAttribute(n.name,n.value)
return t.replaceWith(e),e}return t}function x(t,e,n){e(t)||(t=n(t)||t,x(t?.nextElementSibling,e,n))}function S(t,e,n,o,i){return v(t||"",{upstream:[...e||[],...n||[]],updater:n=>{if(o)for(let t of n.slice(e?.length||0)||[])if(t)return!1
return console.log("UPDATING ",t,n,i?.(...n)),i?.(...n)}})}function N(e,n,o){let i=document.createElement("template"),r=document.createElement("template")
if(i.classList.add("mfld-start"),r.classList.add("mfld-end"),e.before(i),n==`${t}if`){let s=[],f=s.length,a=!1
x(i?.nextElementSibling,(e=>null==e?.dataset[`${t}if`]&&null==e?.dataset[`${t}elseif`]&&null==e?.dataset[`${t}else`]),(e=>{if(null!=e?.dataset[`${t}else`]||a)a=!0
else{console.log("ADDING IMPLICIT ELSE"),a=!0
let n=document.createElement("template")
n.dataset[`${t}else`]="()=> true",n.innerHTML="<div>VISIBLE IF NO CONDITIONS</div>",e.after(n)}})),x(i?.nextElementSibling,(e=>{let n=0
for(let o of["if","elseif","else"])null==e?.dataset[`${t}${o}`]&&n++
return!(n<3)&&(e?.before(r),!0)}),(a=>{console.log("Handling sibling",a)
let{storeList:u,func:c,storeName:d}=l({el:a,datakey:s.length?e.dataset?.[`${t}elseif`]?`${t}elseif`:`${t}else`:n})
if(!u&&!c)return
a=M(a)
let $=S(d,u,s,f,c)
return s.push($.name),$?.sub((t=>{t&&(p((()=>{x(i?.nextElementSibling,(t=>t?.classList?.contains("mfld-end")),(t=>{"TEMPLATE"!=t?.nodeName&&w(t,"out",o,(()=>t?.remove()))}))})),p((()=>{let t=a.cloneNode(!0)
for(let e of t.content.children)r.before(e),w(e,"in",o,(()=>L(e)))})))})),a}))}if(n==`${t}each`){e.before(r)
let[n,s]=e.dataset[`${t}each`]?.split("as")?.map((t=>t.trim()))||[],[f,a]=s.split(/\s{0,},\s{0,}/)?.map((t=>t.trim()))||["value","key"],{storeList:u,func:c,storeName:d}=l(n)
e=M(e)
let $=S(`LOOP:${d}`,u,[],0,c)
$?.sub((t=>{p((()=>{x(i?.nextElementSibling,(t=>t?.classList?.contains("mfld-end")),(t=>w(t,"out",o,(()=>t?.remove()))))})),p((()=>{!function(t,e){if(t instanceof Map)for(const[n,o]of t.entries())e(n,o)
else try{let n=Array.from(t)
if(n?.length)n.forEach(e)
else for(let n in t)e(n,t[n])}catch(e){console.error(`${t} is not iterable`)}}(t||[],((t,n)=>{let i=e.innerHTML,s=e.innerHTML.match(/\${[^}]*}/g)||[]
for(let e of s){let o=e.replace(/^\$\{|\}$/g,"")
try{let r=l(`(${a}, ${f})=> ${o}`)?.func
i=i.replace(e,r?.(n,t)||"")}catch(t){console.error("Syntax error in loop function",t)}}let u=e.cloneNode(!0)
u.innerHTML=i
for(let t of u.content.children)r.before(t),w(t,"in",o,(()=>L(t)))}))}))}))}}let E={},A=/, {0,}/g,I=["bind","sync","if","each","get","head","post","put","delete","patch"].map((e=>`${t}${e}`))
function L(e){if(e&&e.nodeType==Node.TEXT_NODE)return
let n=(e||document.body).querySelectorAll(`[data-${I.join("],[data-")}],a,form`)||[]
for(let e of n){let n=r(E,e)
if(void 0!==e.dataset?.[`${t}promote`]){let[t,o,i,r]="A"==e.tagName?["get",e.href,"","click"]:[e.method.toLowerCase(),e.action,"$form","submit"]
if(o){b(e,r,n,o,t,i)
continue}}for(let o in e.dataset){if([`${t}if`,`${t}each`].includes(o)){N(e,o,n)
continue}if(!I.includes(o))continue
let i=![`${t}bind`].includes(o)
for(let r of e.dataset?.[o]?.split(";")||[]){let[s,f]=r?.split("->")?.map((t=>t.trim()))||[],a=i?O(s.slice(0,s.indexOf(")"))):[],u=i?s.slice(s.indexOf(")")+1):s,c=u.includes("=>")?u:u.includes("(")&&u.match(/^[^\(]{1,}/)?.[0]||"",d=c?O(u.slice(0,(u.indexOf(")")||-2)+1)):u.split(A)?.map((t=>t.trim()))
if(i&&!a?.length){console.error("No trigger",e)
break}let p=l(c)?.func
c?p||console.warn(`"${c}" not registered`,e):d.length>1&&console.warn("Multiple inputs without function",e),a?.length||(a=[""])
for(let i of a)o.match(/bind|sync/)?T(e,d,f,i,o,p):(f||(f=d[0],d=[]),b(e,i,n,f,o.replace(t,""),d,p))}}}}function O(t){if(t?.includes("(")){let e=t.match(/[^\(\)]{1,}/g)
t=e?.[e.length-1]||""}return t?.split(A)?.map((t=>t.trim()))||[]}globalThis.addEventListener("popstate",(t=>{}))
let _={store:(store_name,store_ops)=>(store_ops?.hasOwnProperty("value")||store_ops?.hasOwnProperty("updater")||(store_ops={value:store_ops}),v(store_name,store_ops)),ustore:(store_name,store_ops)=>v(store_name,store_ops),get:store_name=>v(store_name),func:func_name=>MfFn?.get(func_name),funcs:funcs=>{for(let t in funcs)MfFn.set(t,funcs[t])},config:(new_ops,profile_name)=>{return t=new_ops,void((e=profile_name)?E.profiles={...E.profiles,[e]:t}:E={...E,...t})
var t,e},onTick:t=>{var e;(e=t)&&u.push(e)},register:t=>{"string"==typeof t&&(t=document.querySelector(t)),L(t)}}
export{_ as Mfld}
