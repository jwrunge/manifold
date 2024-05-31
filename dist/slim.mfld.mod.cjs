let t=globalThis.smartOutro,e=[],n=!1,o=[],i=globalThis?.requestAnimationFrame||(t=>setTimeout(t,0))
function r(t){e.push(t),n||(n=!0,i(f))}function f(){n=!1
for(let[t,e]of a){let e=c(t)
for(let[t,n]of e?.t||[])n?.(e.value,t)
for(let[t,e]of MfSt);}a.clear()
for(let n of e)if("function"==typeof n)n()
else{if([">","+"].includes(n.relation)){if(">"==n.relation){let t=document?.createElement("div")
for(let e of Array.from(n.out?.childNodes||[]))t.appendChild(e)
n.out?.replaceChildren(t),s(t,"out",n.ops)}t?.space?.(n.in,n.out),s(n.in,"in",n.ops,(()=>{n.in&&n.out?.appendChild(n.in),t?.adjust?.(n.in,n.ops)}))}else s(n.in,"in",n.ops,(()=>{n.out?.after(n.in),t?.space?.(n.in,n.out),t?.adjust?.(n.in,n.ops),"/"===n.relation&&s(n.out,"out",n.ops)}))
n.done?.(n.in)}o.forEach((t=>t())),o=[],e=[]}function s(e,n,o,i){if(e?.nodeType==Node.TEXT_NODE){let t=e.textContent,n=document?.createElement("div")
n.textContent=t,e.replaceWith(n),e=n}if(e){let f=Array.isArray(o.trans?.dur)?o.trans?.dur["in"==n?0:1]||o.trans?.dur[0]:o.trans?.dur||0,s=o?.trans?.class||"mf-trans"
e?.classList?.add(s),o.trans?.hooks?.[`${n}-start`]?.(e),"out"==n?r((()=>{t?.size?.(e),f&&(e.style.transitionDuration=`${f}ms`),e.classList?.add(n)})):setTimeout((()=>{r((()=>{f&&(e.style.transitionDuration=`${f}ms`),e?.classList?.add(n),i?.(),r((()=>{e?.classList?.remove(n)}))}))}),o.trans?.swap||0),setTimeout((()=>{r((()=>{"out"==n&&e?.remove(),e?.classList?.remove(s),e?.classList?.remove(n),o.trans?.hooks?.[`${n}-end`]?.(e)}))}),f+("in"==n&&o.trans?.swap||0))}}function l(t){if(!t)return 0
if("number"==typeof t)return t
if(!0===t)return 1
if(t instanceof Map)return l(Array.from(t.entries()))
if(t instanceof Set)return l(Array.from(t))
let e=0
for(let n of(new TextEncoder).encode("string"==typeof t?t:t?.toString()||""))e=(e<<5)-e+n
return e}globalThis.MfSt||(globalThis.MfSt=new Map),globalThis.MfFn||(globalThis.MfFn=new Map)
let a=new Map
class u{o=void 0
t=new Map
i=void 0
l
constructor(t,e){return this.u(t,e)}u(t,e){return this.name=t,MfSt.set(t,this),this.l=new Set(e?.upstream||[]),this.value=e?.value,this.o=e?.updater,this}sub(t,e){this.t.set(e||String(Date.now()+Math.random()),t),t?.(this.value)}async update(t){return new Promise((async e=>{let n=new Set
for(let t of a.keys()){if(this.l.has(t))return
c(t)?.l.has(this.name||"")&&n.add(t)}let o="function"==typeof t?(await t)?.(this.value):t,i=l(o)
i!==this.i&&(this.value=o,this.i=i,n.forEach((t=>a.delete(t))),a.set(this.name||"",await t),r((()=>{e(this.value)})))}))}}function c(t,e){let n=MfSt.get(t)
return e?n?n.u(t,e):new u(t,e):n||new u(t,e)}globalThis.DOMParser&&new DOMParser
let h={},d="mf",p=[`${d}bind`,`${d}sync`,...["get","head","post","put","delete","patch"].map((t=>`${d}${t}`))],$=/, {0,}/g,g=0
function m(t,e,n){let o=t
for(let t of e)null==o&&(o="number"==typeof t?[]:{}),null==n||e[e.length-1]!==t?o=o instanceof Map?o?.get(t):o?.[t]:o instanceof Map?o.set(t,n):o[t]=n
return o}function w(t){if(t?.includes("(")){let e=t.match(/[^\(\)]{1,}/g)
t=e?.[e.length-1]||""}return t?.split($)?.map((t=>t.trim()))||[]}function y(t,e){let n=async e=>{e?.preventDefault(),e?.stopPropagation()
let n={...h,...h.profiles?.[t.dataset.overrides||""]||JSON.parse(t.dataset.overrides||"{}")||{}},o=e?.target
if(!n?.fetch?.externals?.some((t=>o?.href?.startsWith(t.domain)))){let e=n.fetch,i=await fetch(o?.href,{...e?.request||{},method:o?.method,body:e?.request?.body?JSON.stringify(e?.request?.body||{}):void 0}).catch((t=>{e?.err?.(t)})),r=i?.status
if(r&&0==e?.onCode?.(r))return
let f=await(i?.[n.fetch?.type||"text"]())
n.fetch?.cb?.(f)
let s=t.getAttribute("mf-resolve");["$append","$prepend","$replace"].includes(s||"")&&globalThis.DOMParser&&(new DOMParser)?.parseFromString?.(f,"text/html")}}
"mount"==e?n():t.addEventListener(e,n)}let b={store:(store_name,store_ops)=>(store_ops?.hasOwnProperty("value")||store_ops?.hasOwnProperty("updater")||(store_ops={value:store_ops}),c(store_name,store_ops)),ustore:(store_name,store_ops)=>c(store_name,store_ops),get:store_name=>c(store_name),func:func_name=>MfFn?.get(func_name),funcs:funcs=>{for(let t in funcs)MfFn.set(t,funcs[t])},config:(new_ops,profile_name)=>{return t=new_ops,void((e=profile_name)?h.profiles={...h.profiles,[e]:t}:h={...h,...t})
var t,e},onTick:t=>{var e;(e=t)&&o.push(e)},register:t=>{"string"==typeof t&&(t=document.querySelector(t)),function(t){let e=(t||document.body).querySelectorAll(`[data-${p.join("],[data-")}]${0!=h.fetch?.auto?",a":""}`)||[]
for(let t of e){t.id||(t.id=""+g++)
for(let e in t.dataset){let n=e!=`${d}bind`,o=`(#${t.id} on ${e})`
t.dataset?.[e]?.split(";").forEach((i=>{let f,s=i?.split(/(?:(?:\)|->) ?){1,}/g)||[],l=n?w(s.splice(0,1)[0]):[],a=s[0]?.includes("(")&&s[0]?.match(/^[^\(]{1,}/)?.[0]||"",u=w(s.splice(e==`${d}sync`?1:0,1)[0]),h=w(s[0])
if(n&&!l?.length)throw`No trigger: ${o}.`
if(a){if(f=globalThis.MfFn?.get(a),!f)throw`"${a}" not registered: ${o}`
if(!n&&u.length>1||n&&h.length>1)throw`Multiple sources: ${o}`}let p=u.map((t=>{let[e,...n]=t.split(/[\.\[\]\?]{1,}/g)
return{name:e,path:n.map((t=>isNaN(parseInt(t))?t:parseInt(t))).filter((t=>t))}}))
l?.length||(l=[""])
for(let n of l){["bind","sync"].includes(e)&&y(t,n),h?.length||(h=[""])
for(let i=0;i<h.length;i++)if(e==`${d}bind`){let e=()=>{r((()=>{let e=f?.(...p.map((t=>m(c(t.name)?.value,t.path))),t)??m(c(p[0].name||"")?.value,p[0].path)
void 0!==e&&(t[h[i]]=e),t.dispatchEvent(new CustomEvent(n))}))}
for(let n of p)c(n.name)?.sub(e,t.id)}else if(e==`${d}sync`){if(p.length>1)throw`Only one store supported: ${o}`
let e=()=>{let e=t[h[i].trim()]
f&&(e=f?.(e,t))
let n=c(p[0]?.name)
void 0!==e&&n?.update?.((t=>p[0]?.path?.length?m(t,p[0]?.path,e):e))}
t.addEventListener(n,e)}}}))}}}(t)}}
exports.Mfld=b
