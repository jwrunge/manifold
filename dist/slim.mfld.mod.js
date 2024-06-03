let t,e=[],n=!1,o=[],i="",r=globalThis?.requestAnimationFrame||(t=>setTimeout(t,0))
function s(t){e.push(t),n||(n=!0,r(f))}function a(e,n,o){t=document.createElement("div")
let{paddingTop:r,paddingBottom:s}=n instanceof Element?window.getComputedStyle(n):{paddingTop:0,paddingBottom:0}
i=t.style.height=`calc(${Math.abs(o-(e?.clientHeight||0))}px - ${r} - ${s})`,n?.after(t)}function l(e){s((()=>{t?.remove(),e?.animate?.([{height:i},{height:`${e.clientHeight||0}px`}],300)}))}function f(){n=!1
for(let t of e)if("function"==typeof t)t()
else{let e=t.out?t.out.clientHeight:0
if(["swapinner","append"].includes(t.relation)){if("swapinner"==t.relation){let e=document?.createElement("div")
for(let n of Array.from(t.out?.childNodes||[]))e.appendChild(n)
t.out?.replaceChildren(e),u(e,"out",t.ops)}a?.(t.in,t.out,e),u(t.in,"in",t.ops,(()=>{t.in&&t.out?.appendChild(t.in),l?.(t.in)}))}else"prepend"==t.relation?(a?.(t.in,t.out,e),u(t.in,"in",t.ops,(()=>{t.in&&t.out?.prepend(t.in),l?.(t.in)}))):(u(t.in,"in",t.ops,(()=>{t.out?.after(t.in),a?.(t.in,t.out,e),l?.(t.in)})),u(t.out,"out",t.ops))
t.done?.(t.in)}o.forEach((t=>t())),o=[],e=[]}function u(t,e,n,o){if(t?.nodeType==Node.TEXT_NODE){let e=t.textContent,n=document?.createElement("div")
n.textContent=e,t.replaceWith(n),t=n}if(t){let i=Array.isArray(n.trans?.dur)?n.trans?.dur["in"==e?0:1]||n.trans?.dur[0]:n.trans?.dur||0,r=n?.trans?.class||"mf-trans"
t?.classList?.add(r),n.trans?.hooks?.[`${e}-start`]?.(t),"out"==e?s((()=>{t.style.width=`${t.clientWidth}px`,t.style.height=`${t.clientHeight}px`,t.style.position="absolute",i&&(t.style.transitionDuration=`${i}ms`),t.classList?.add("out")})):(t?.classList?.add("in"),i&&(t.style.transitionDuration=`${i}ms`),o?.(),setTimeout((()=>{s((()=>{setTimeout((()=>s((()=>t?.classList?.remove(e)))),0)}))}),n.trans?.swap||0)),setTimeout((()=>{s((()=>{"out"==e&&t?.remove(),t?.classList?.remove(r),n.trans?.hooks?.[`${e}-end`]?.(t)}))}),i+("in"==e&&n.trans?.swap||0))}}function d(t){if(!t)return 0
if("number"==typeof t)return t
if(!0===t)return 1
if(t instanceof Map)return d(Array.from(t.entries()))
if(t instanceof Set)return d(Array.from(t))
let e=0
for(let n of(new TextEncoder).encode("string"==typeof t?t:t?.toString()||""))e=(e<<5)-e+n
return e}globalThis.MfSt||(globalThis.MfSt=new Map),globalThis.MfFn||(globalThis.MfFn=new Map)
class c{t=void 0
o=new Map
i=void 0
l
u=new Set
constructor(t,e){return this.h(t,e)}h(t,e){return this.name=t,MfSt.set(t,this),this.l=new Set(e?.upstream?.map((t=>h(t)))||[]),this.l.forEach((t=>t?.u?.add(this))),this.value=e?.value,this.t=e?.updater,this}sub(t,e,n=!0){this.o.set(e||String(Date.now()+Math.random()),t),n&&t?.(this.value)}async update(t){return"(store1, store3)=> return store1 == 'Last one' || store3 == 'three' "===this.name&&console.log("UPDATING WITH VALUE",t),new Promise((async e=>{let n="function"==typeof t?(await t)?.(this.value):t,o=d(n)
if(o!==this.i){this.value=n,this.i=o
for(let t of this.u)await t.p()
s((()=>{for(let[t,e]of this?.o||[])e?.(this.value,t)
e(this.value)}))}else e(this.value)}))}async p(){"(store1, store3)=> return store1 == 'Last one' || store3 == 'three' "===this.name&&console.log("UPDATING AUTO")
let t=await(this.t?.(Array.from(this.l)?.map((t=>t?.value))||[],this?.value))
await this.update(void 0===t?this.value:t)}}function h(t,e){let n=MfSt.get(t)
return e?n?n.h(t,e):new c(t,e):n||new c(t,e)}globalThis.DOMParser&&new DOMParser
let p="mf"
function $(t,e,n,o,i,r){let a=async e=>{e?.preventDefault(),e?.stopPropagation()
let a=t.dataset[`${p}overrides`]||"{}",l=n.profiles?.[a]?.fetch||JSON.parse(a),f=l?{...n,...l}:n
r||(r="string"==typeof i?structuredClone(i):(e?.target)?.href,i=f?.fetch?.request?.body),o||(o=(e?.target)?.method||"get"),f?.fetch?.externals?.find((t=>r?.startsWith(t.domain)))||!r.match(/^https?:\/\//)||r.includes(location.origin)
let u=await fetch(r,{...f?.fetch?.request||{},method:o,body:"string"==typeof i?i:JSON.stringify(i)}).catch((t=>{f?.fetch?.err?.(t)})),d=u?.status
if(d&&0==f?.fetch?.onCode?.(d,u))return
let c=await(u?.[f?.fetch?.type||"text"]())
f?.fetch?.cb?.(c)
for(let e of["append","prepend","swapinner","swapouter"]){let n=t.dataset[`${p}${e}`]
if(void 0===n)continue
let[o,i]=n?.split("->").map((t=>t.trim()))||[],r=(new DOMParser)?.parseFromString?.(c,"text/html")
r&&s({in:r.querySelector(o||"body"),out:i?document.querySelector(i):t,relation:e,ops:f,done:()=>!0})}t.dataset?.[`${p}resolve`]&&alert("RESOLVING")}
"$mount"==e?a():t.addEventListener(e,a)}let g={},w=/, {0,}/g,m=0,y=["bind","sync","if","get","head","post","put","delete","patch"].map((t=>`${p}${t}`))
function v(t,e,n){let o=t
for(let t of e)null==o&&(o="number"==typeof t?[]:{}),null==n||e[e.length-1]!==t?o=o instanceof Map?o?.get(t):o?.[t]:o instanceof Map?o.set(t,n):o[t]=n
return o}function T(t){if(t?.includes("(")){let e=t.match(/[^\(\)]{1,}/g)
t=e?.[e.length-1]||""}return t?.split(w)?.map((t=>t.trim()))||[]}let b={store:(store_name,store_ops)=>(store_ops?.hasOwnProperty("value")||store_ops?.hasOwnProperty("updater")||(store_ops={value:store_ops}),h(store_name,store_ops)),ustore:(store_name,store_ops)=>h(store_name,store_ops),get:store_name=>h(store_name),func:func_name=>MfFn?.get(func_name),funcs:funcs=>{for(let t in funcs)MfFn.set(t,funcs[t])},config:(new_ops,profile_name)=>{return t=new_ops,void((e=profile_name)?g.profiles={...g.profiles,[e]:t}:g={...g,...t})
var t,e},onTick:t=>{var e;(e=t)&&o.push(e)},register:t=>{"string"==typeof t&&(t=document.querySelector(t)),function(t){let e=(t||document.body).querySelectorAll(`[data-${y.join("],[data-")}]${0!=g.fetch?.auto?",a":""}`)||[]
for(let t of e){t.id||(t.id=""+m++)
for(let e in t.dataset){if(!y.includes(e))continue
let n=![`${p}bind`,`${p}if`,`${p}each`].includes(e),o=`(#${t.id} on ${e})`
if([`${p}if`,`${p}each`].includes(e)){let[n,o]=t?.dataset?.[e]?.split("=>").map((t=>t.trim()))||["",""]
o||(o=n.slice(),n="")
let i=n.split(",").map((t=>t.replace(/[()]/g,"").trim())),r=globalThis[o]||MfFn?.get(o)||new Function(...i,o),s=h(t?.dataset?.[e]||"",{upstream:i,updater:(t,e)=>(console.log("Calling updater with value",r(...t)),r(...t))})
return void(e==`${p}if`?s?.sub((t=>t)):alert("FOUND EACH!"))}t.dataset?.[e]?.split(";").forEach((i=>{let r,a=i?.split(/(?:(?:\)|->) ?){1,}/g)||[],l=n?T(a.splice(0,1)[0]):[],f=a[0]?.includes("(")&&a[0]?.match(/^[^\(]{1,}/)?.[0]||"",u=T(a.splice(e==`${p}sync`?1:0,1)[0]),d=T(a[0])
if(n&&!l?.length)throw`No trigger: ${o}.`
if(f&&(r=globalThis[f]||MfFn?.get(f),r||console.warn(`"${f}" not registered: ${o}`),!n&&u.length>1||n&&d.length>1))throw`Multiple sources: ${o}`
let c=u.map((t=>{let[e,...n]=t.split(/[\.\[\]\?]{1,}/g)
return{name:e,path:n.map((t=>isNaN(parseInt(t))?t:parseInt(t))).filter((t=>t))}}))
l?.length||(l=[""])
for(let n of l)if(e.match(/bind|sync/)){d?.length||(d=[""])
for(let i=0;i<d.length;i++)if(e==`${p}bind`){let e=()=>{s((()=>{let e=r?.(...c.map((t=>v(h(t.name)?.value,t.path))),t)??v(h(c[0].name||"")?.value,c[0].path)
void 0!==e&&(t[d[i]]=e),t.dispatchEvent(new CustomEvent(n))}))}
for(let n of c)h(n.name)?.sub(e,t.id)}else if(e==`${p}sync`){if(c.length>1)throw`Only one store supported: ${o}`
let e=()=>{let e=d[i].trim(),n=t[e]??t.getAttribute(e)??t.dataset[e]??void 0
r&&(n=r?.(n,t))
let o=h(c[0]?.name)
void 0!==n&&o?.update?.((t=>c[0]?.path?.length?v(t,c[0]?.path,n):n))}
"$mount"==n?e():t.addEventListener(n,e)}}else{if(d.length>1||u.length>1)throw`Multiple sources: ${o}`
$(t,n,g,e.replace(p,""),d[0],u[0])}}))}}}(t)}}
export{b as Mfld}
