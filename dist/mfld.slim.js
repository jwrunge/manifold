let t,e=[],n=!1,i=[],o="",r=globalThis?.requestAnimationFrame||(t=>setTimeout(t,0)),s=new Map
function l(t){e.push(t),n||(n=!0,r(u))}function a(e,n,i){t=document.createElement("div")
let{paddingTop:r,paddingBottom:s}=window.getComputedStyle(n)
o=t.style.height=`calc(${Math.abs(i-(e?.clientHeight||0))}px - ${r} - ${s})`,n?.after(t)}function f(e,n){l((()=>{t?.remove(),e?.animate?.([{height:o},{height:`${e.clientHeight||0}px`}],300)}))}function u(){n=!1
for(let[t]of s)for(let[e,n]of t?.t||[])n?.(t.value,e)
s.clear()
for(let t of e)if("function"==typeof t)t()
else{let e=t.out?t.out.clientHeight:0
if(["swapinner","append"].includes(t.relation)){if("swapinner"==t.relation){let e=document?.createElement("div")
for(let n of Array.from(t.out?.childNodes||[]))e.appendChild(n)
t.out?.replaceChildren(e),c(e,"out",t.ops)}a?.(t.in,t.out,e),c(t.in,"in",t.ops,(()=>{t.in&&t.out?.appendChild(t.in),f?.(t.in,t.out)}))}else"prepend"==t.relation?(a?.(t.in,t.out,e),c(t.in,"in",t.ops,(()=>{t.in&&t.out?.prepend(t.in),f?.(t.in,t.out)}))):(c(t.in,"in",t.ops,(()=>{t.out?.after(t.in),a?.(t.in,t.out,e),f?.(t.in,t.out)})),c(t.out,"out",t.ops))
t.done?.(t.in)}i.forEach((t=>t())),i=[],e=[]}function c(t,e,n,i){if(t?.nodeType==Node.TEXT_NODE){let e=t.textContent,n=document?.createElement("div")
n.textContent=e,t.replaceWith(n),t=n}if(t){let o=Array.isArray(n.trans?.dur)?n.trans?.dur["in"==e?0:1]||n.trans?.dur[0]:n.trans?.dur||0,r=n?.trans?.class||"mf-trans"
t?.classList?.add(r),n.trans?.hooks?.[`${e}-start`]?.(t),"out"==e?l((()=>{t.style.width=`${t.clientWidth}px`,t.style.height=`${t.clientHeight}px`,t.style.position="absolute",o&&(t.style.transitionDuration=`${o}ms`),t.classList?.add("out")})):(t?.classList?.add("in"),o&&(t.style.transitionDuration=`${o}ms`),i?.(),setTimeout((()=>{l((()=>{setTimeout((()=>l((()=>t?.classList?.remove(e)))),0)}))}),n.trans?.swap||0)),setTimeout((()=>{l((()=>{"out"==e&&t?.remove(),t?.classList?.remove(r),n.trans?.hooks?.[`${e}-end`]?.(t)}))}),o+("in"==e&&n.trans?.swap||0))}}function d(t){if(!t)return 0
if("number"==typeof t)return t
if(!0===t)return 1
if(t instanceof Map)return d(Array.from(t.entries()))
if(t instanceof Set)return d(Array.from(t))
let e=0
for(let n of(new TextEncoder).encode("string"==typeof t?t:t?.toString()||""))e=(e<<5)-e+n
return e}globalThis.MfSt||(globalThis.MfSt=new Map),globalThis.MfFn||(globalThis.MfFn=new Map)
class p{i=void 0
t=new Map
o=void 0
l
u=new Set
constructor(t,e){return this.p(t,e)}p(t,e){return this.name=t,MfSt.set(t,this),this.l=new Set(e?.upstream?.map((t=>h(t)))||[]),this.l.forEach((t=>t?.u?.add(this))),this.value=e?.value,this.i=e?.updater,this}sub(t,e){this.t.set(e||String(Date.now()+Math.random()),t),t?.(this.value)}async update(t){return new Promise((async e=>{let n="function"==typeof t?(await t)?.(this.value):t,i=d(n)
if(i!==this.o){this.value=n,this.o=i,s.set(this,await t)
for(let t of this.u)s.set(t,await t.h())
l((()=>{e(this.value)}))}else e(this.value)}))}async h(){await this.update(await(this.i?.(Array.from(this.l)?.map((t=>t?.value))||[],this?.value))||this.value)}}function h(t,e){let n=MfSt.get(t)
return e?n?n.p(t,e):new p(t,e):n||new p(t,e)}globalThis.DOMParser&&new DOMParser
let $={},g="mf",w=/, {0,}/g,m=0,y=["bind","sync","get","head","post","put","delete","patch"].map((t=>`${g}${t}`))
function b(t,e){e?$.profiles={...$.profiles,[e]:t}:$={...$,...t}}function M(t){let e=(t||document.body).querySelectorAll(`[data-${y.join("],[data-")}]${0!=$.fetch?.auto?",a":""}`)||[]
for(let t of e){t.id||(t.id=""+m++)
for(let e in t.dataset){if(!y.includes(e))continue
let n=e!=`${g}bind`,i=`(#${t.id} on ${e})`
t.dataset?.[e]?.split(";").forEach((o=>{let r,s=o?.split(/(?:(?:\)|->) ?){1,}/g)||[],a=n?T(s.splice(0,1)[0]):[],f=s[0]?.includes("(")&&s[0]?.match(/^[^\(]{1,}/)?.[0]||"",u=T(s.splice(e==`${g}sync`?1:0,1)[0]),c=T(s[0])
if(n&&!a?.length)throw`No trigger: ${i}.`
if(f&&(r=globalThis[f]||MfFn?.get(f),r||console.warn(`"${f}" not registered: ${i}`),!n&&u.length>1||n&&c.length>1))throw`Multiple sources: ${i}`
let d=u.map((t=>{let[e,...n]=t.split(/[\.\[\]\?]{1,}/g)
return{name:e,path:n.map((t=>isNaN(parseInt(t))?t:parseInt(t))).filter((t=>t))}}))
a?.length||(a=[""])
for(let n of a){if(!e.match(/bind|sync/)){if(c.length>1||u.length>1)throw`Multiple sources: ${i}`
return void S(t,n,e.replace(g,""),c[0],u[0])}c?.length||(c=[""])
for(let o=0;o<c.length;o++)if(e==`${g}bind`){let e=()=>{l((()=>{let e=r?.(...d.map((t=>v(h(t.name)?.value,t.path))),t)??v(h(d[0].name||"")?.value,d[0].path)
void 0!==e&&(t[c[o]]=e),t.dispatchEvent(new CustomEvent(n))}))}
for(let n of d)h(n.name)?.sub(e,t.id)}else if(e==`${g}sync`){if(d.length>1)throw`Only one store supported: ${i}`
let e=()=>{let e=c[o].trim(),n=t[e]??t.getAttribute(e)??t.dataset[e]??void 0
r&&(n=r?.(n,t))
let i=h(d[0]?.name)
void 0!==n&&i?.update?.((t=>d[0]?.path?.length?v(t,d[0]?.path,n):n))}
"$mount"==n?e():t.addEventListener(n,e)}}}))}}}function v(t,e,n){let i=t
for(let t of e)null==i&&(i="number"==typeof t?[]:{}),null==n||e[e.length-1]!==t?i=i instanceof Map?i?.get(t):i?.[t]:i instanceof Map?i.set(t,n):i[t]=n
return i}function T(t){if(t?.includes("(")){let e=t.match(/[^\(\)]{1,}/g)
t=e?.[e.length-1]||""}return t?.split(w)?.map((t=>t.trim()))||[]}function S(t,e,n,i,o){let r=async e=>{e?.preventDefault(),e?.stopPropagation()
let r=t.dataset[`${g}overrides`]||"{}",s=$.profiles?.[r]?.fetch||JSON.parse(r),a=s?{...$,...s}:$
o||(o="string"==typeof i?structuredClone(i):(e?.target)?.href,i=a?.fetch?.request?.body),n||(n=(e?.target)?.method||"get"),a?.fetch?.externals?.find((t=>o?.startsWith(t.domain)))||!o.match(/^https?:\/\//)||o.includes(location.origin)
let f=await fetch(o,{...a?.fetch?.request||{},method:n,body:"string"==typeof i?i:JSON.stringify(i)}).catch((t=>{a?.fetch?.err?.(t)})),u=f?.status
if(u&&0==a?.fetch?.onCode?.(u,f))return
let c=await(f?.[a?.fetch?.type||"text"]())
a?.fetch?.cb?.(c)
for(let e of["append","prepend","swapinner","swapouter"]){let n=t.dataset[`${g}${e}`]
if(void 0===n)continue
let[i,o]=n?.split("->").map((t=>t.trim()))||[],r=(new DOMParser)?.parseFromString?.(c,"text/html")
r&&l({in:r.querySelector(i||"body"),out:o?document.querySelector(o):t,relation:e,ops:a,done:()=>!0})}t.dataset?.[`${g}resolve`]&&alert("RESOLVING")}
"$mount"==e?r():t.addEventListener(e,r),console.log("Adding event listener",e,t)}let N={store:(store_name,store_ops)=>(store_ops?.hasOwnProperty("value")||store_ops?.hasOwnProperty("updater")||(store_ops={value:store_ops}),h(store_name,store_ops)),ustore:(store_name,store_ops)=>h(store_name,store_ops),get:store_name=>h(store_name),func:func_name=>MfFn?.get(func_name),funcs:funcs=>{for(let t in funcs)MfFn.set(t,funcs[t])},config:(new_ops,profile_name)=>b(new_ops,profile_name),onTick:t=>{var e;(e=t)&&i.push(e)},register:t=>{"string"==typeof t&&(t=document.querySelector(t)),M(t)}}
globalThis.Mfld=N
let _=globalThis.document?.currentScript?.dataset||{}
if(_?.config)try{b(JSON.parse(_?.config))}catch(t){console.warn("Invalid Mfld params",t)}_?.init&&M(document.querySelector(_.init))
