function t(e){if("number"==typeof e)return e
if(!0===e)return 1
if("object"==typeof e)return e instanceof Map?t(e.entries()):e instanceof Set?t(Array.from(e)):Date.now()
let o=0
for(const t of(new TextEncoder).encode("string"==typeof e?e:e?.toString()||""))o=(o<<5)-o+t
return o}let e=[]
let o,i=new Map,n=new Map,r=new Map
class s{#t=void 0
t=new Map
o=void 0
i=[]
l=[]
constructor(t,e){this.name=t,i.set(t,this),this.l=e?.upstream||[]
for(let t of this.l)f(t)?.i?.push(this.name||"")
return this.value=e?.value,this.#t=e?.updater,this}u(t,e){this.t.set(t,e),e?.()}sub(t){let e="x".repeat(5).replace(/./g,(t=>"ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"[Math.floor(36*Math.random())]))
this.t.set(e,t),t?.(this.value)}async update(i){return new Promise((n=>{r.set(this.name||"",i),clearTimeout(o),o=setTimeout((async()=>{for(let[t,e]of r){const e=f(t)
e.i.forEach((t=>r.delete(t))),e.l.forEach((e=>!r.has(e)||r.delete(t)))}let o=[]
for(let[e,i]of r){let n=f(e),r="function"==typeof i?await(i?.(n.value)):i,s=(n.value?.length||n.value?.size||void 0)!==(r?.length||r?.size||void 0),l=""
if(s||(l=t(n.value),s=l!==n.o),s){n.value=r,n.o=l
for(let t of n.i)o.push(t)
for(let[t,e]of n.t)e?.(n.value,t)}}r.clear()
for(let t of o)f(t)&&await f(t).h()
e.forEach((t=>t())),e=[],n(this.value)}),0)}))}async h(){await this.update(await(this.#t?.(this.l?.map((t=>f(t)?.value))||[],this?.value)||this.value))}}function f(t,e){return e?new s(t,e):i.get(t)||new s(t,e)}let l=globalThis.smartOutro,a=[],u=!1
function c(t){a.push(t),u||(u=!0,globalThis.requestAnimationFrame?.(h))}function h(){u=!1
for(let t of a)if("function"==typeof t)t()
else{if([">","+"].includes(t.relation)){if(">"==t.relation){let e=globalThis.document?.createElement("div")
for(let o of Array.from(t.out?.childNodes||[]))e.appendChild(o)
t.out?.replaceChildren(e),d(e,"out",t.ops)}l?.space?.(t.in,t.out),d(t.in,"in",t.ops,(()=>{t.in&&t.out?.appendChild(t.in),l?.adjust?.(t.in,t.ops)}))}else d(t.in,"in",t.ops,(()=>{t.out?.after(t.in),l?.space?.(t.in,t.out),l?.adjust?.(t.in,t.ops),"/"===t.relation&&d(t.out,"out",t.ops)}))
t.done?.(t.in)}a=[]}function d(t,e,o,i){if(t?.nodeType==Node.TEXT_NODE){let e=t.textContent,o=globalThis.document?.createElement("div")
o.textContent=e,t.replaceWith(o),t=o}if(t){let n=Array.isArray(o.trans?.dur)?o.trans?.dur["in"==e?0:1]||o.trans?.dur[0]:o.trans?.dur||0,r=o?.trans?.class||"cu-trans"
t?.classList?.add(r),o.trans?.hooks?.[`${e}-start`]?.(t),"out"==e?c((()=>{l?.size?.(t),n&&(t.style.transitionDuration=`${n}ms`),t.classList?.add(e)})):setTimeout((()=>{c((()=>{n&&(t.style.transitionDuration=`${n}ms`),t?.classList?.add(e),i?.(),c((()=>{t?.classList?.remove(e)}))}))}),o.trans?.swap||0),setTimeout((()=>{c((()=>{"out"==e&&t?.remove(),t?.classList?.remove(r),t?.classList?.remove(e),o.trans?.hooks?.[`${e}-end`]?.(t)}))}),n+("in"==e&&o.trans?.swap||0))}}let p=globalThis.DOMParser?new DOMParser:void 0
let w=/, {0,}/g,g=0
!function(){let t=globalThis.document?.currentScript?.dataset
if(t?.config)try{m(JSON.parse(t?.config))}catch(t){console.warn("Invalid Mfld params",t)}t?.init&&function(t){let e=t?.querySelectorAll(`[data-${b.join("],[data-")}]${0!=y.fetch?.auto?",a":""}`)||[]
for(let t of e){t.id||(t.id="cu-"+g++)
for(let e in t.dataset){if(!b.includes(e))continue
let o="bind"!=e,i=`(#${t.id} on ${e})`
t?.dataset?.[e]?.split(";").forEach((r=>{let s,l=r?.split(/(?:(?:\)|->) ?){1,}/g)||[],a=o?T(l.splice(0,1)[0]):[],u=l[0]?.includes("(")&&l[0]?.match(/^[^\(]{1,}/)?.[0]||"",h=T(l.splice("sync"==e?1:0,1)[0]),d=T(l[0])
if(o&&!a?.length)throw`No trigger: ${i}.`
if(u){if(s=globalThis[u]||n.get(u),!s)throw`"${u}" not registered: ${i}`
if(!o&&h.length>1||o&&d.length>1)throw`Multiple sources: ${i}`}let p=h.map((t=>{let[e,...o]=t.split(/[\.\[\]\?]{1,}/g)
return{name:e,path:o.map((t=>isNaN(parseInt(t))?t:parseInt(t))).filter((t=>t))}}))
a?.length||(a=[""])
for(let o of a){"fetch"==e&&v(t,o,h,d,y),d?.length||(d=[""])
for(let n=0;n<d.length;n++)if("bind"==e){let e=()=>{c((()=>{t[d[n]]=s?.(...p.map((t=>M(f(t.name)?.value,t.path))),t)??M(f(p[0].name||"")?.value,p[0].path),t.dispatchEvent(new MfldstomEvent(o))}))}
for(let o of p)f(o.name)?.u(t.id,e)}else if("sync"==e){if(p.length>1)throw`Only one store supported: ${i}`
let e=()=>{let e=t[d[n].trim()]
s&&(e=s?.(e,t))
const o=f(p[0]?.name)
void 0!==e&&o?.update?.((t=>p[0]?.path?.length?M(t,p[0]?.path,e):e))}
t.addEventListener(o,e)}}}))}}}()}()
let y={},b=["bind","sync","fetch"]
function m(t,e){e?y.profiles={...y.profiles,[e]:t}:y={...y,...t}}function M(t,e,o){let i=t
for(let t of e)null==i&&(i="number"==typeof t?[]:{}),null==o||e[e.length-1]!==t?i=i instanceof Map?i?.get(t):i?.[t]:i instanceof Map?i.set(t,o):i[t]=o
return i}function T(t){if(t?.includes("(")){let e=t.match(/[^\(\)]{1,}/g)
t=e?.[e.length-1]||""}return t?.split(w)||[]}function v(t,e,o,i,n){let r=o=>{o?.preventDefault(),o?.stopPropagation()
let i={...n,...n.profiles?.[t.dataset.overrides||""]||JSON.parse(t.dataset.overrides||"{}")||{}},r=o?.target;(["click","submit"].includes(e)||["A","FORM"].includes(r?.nodeName))&&history.pushState({fetchData:i,elId:t.id},"",r?.href||r?.action||""),async function(t,e,o){if(p&&!e.fetch?.externals?.some((e=>t?.href?.startsWith(e.domain)))){let o=e.fetch,i=await fetch(t?.href,{...o?.request||{},method:t?.method,body:o?.request?.body?JSON.stringify(o?.request?.body||{}):void 0}).catch((t=>{o?.err?.(t)})),n=i?.status
if(n&&0==o?.onCode?.(n))return
let r=await(i?.[e.fetch?.type||"text"]())
e.fetch?.cb?.(r),"json"!=e?.fetch?.type&&p.parseFromString(r,"text/html").body}}({method:t.dataset.method?.toLowerCase()||"get",href:r?.href,el:t},i)}
"mount"==e?r():t.addEventListener(e,r)}const $={store:(store_name,store_ops)=>(store_ops?.hasOwnProperty("value")||store_ops?.hasOwnProperty("updater")||(store_ops={value:store_ops}),f(store_name,store_ops)),ustore:(store_name,store_ops)=>f(store_name,store_ops),getFunc:func_name=>n.get(func_name),addFuncs:funcs=>{for(let t in funcs)n.set(t,funcs[t])},config:(new_ops,profile_name)=>m(new_ops,profile_name),onTick:t=>{var o;(o=t)&&e.push(o)}}
globalThis.Mfld=$
