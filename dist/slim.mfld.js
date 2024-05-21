function t(e){if("number"==typeof e)return e
if(!0===e)return 1
if("object"==typeof e)return e instanceof Map?t(e.entries()):e instanceof Set?t(Array.from(e)):Date.now()
let o=0
for(const t of(new TextEncoder).encode("string"==typeof e?e:e?.toString()||""))o=(o<<5)-o+t
return o}let e=[]
globalThis.Mfld_stores||(globalThis.Mfld_stores=new Map),globalThis.Mfld_funcs&&(globalThis.Mfld_funcs=new Map)
let o,i=new Map
class n{#t=void 0
t=new Map
o=void 0
i=[]
l=[]
constructor(t,e){this.name=t,globalThis.Mfld_stores.set(t,this),this.l=e?.upstream||[]
for(let t of this.l)l(t)?.i?.push(this.name||"")
return this.value=e?.value,console.log("Setting updater",t,e?.updater),this.#t=e?.updater,console.log("Constructed store",this),this}u(t,e){this.t.set(t,e),e?.()}sub(t){let e="x".repeat(5).replace(/./g,(t=>"ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"[Math.floor(36*Math.random())]))
this.t.set(e,t),t?.(this.value)}async update(n){return new Promise((s=>{i.set(this.name||"",n),clearTimeout(o),o=setTimeout((async()=>{for(let[t,e]of i){const e=l(t)
e.i.forEach((t=>i.delete(t))),e.l.forEach((e=>!i.has(e)||i.delete(t)))}let o=[]
for(let[e,n]of i){let i=l(e),s="function"==typeof n?await(n?.(i.value)):n,r=(i.value?.length||i.value?.size||void 0)!==(s?.length||s?.size||void 0),a=""
if(r||(a=t(i.value),r=a!==i.o),r){i.value=s,i.o=a
for(let t of i.i)o.push(t)
for(let[t,e]of i.t)e?.(i.value,t)}}i.clear()
for(let t of o)l(t)&&await l(t).h()
e.forEach((t=>t())),e=[],s(this.value)}),0)}))}async h(){await this.update(await(this.#t?.(this.l?.map((t=>l(t)?.value))||[],this?.value)||this.value))}}function l(t,e){return e?new n(t,e):globalThis.Mfld_stores.get(t)||new n(t,e)}let s=globalThis.smartOutro,r=[],a=!1
function f(t){r.push(t),a||(a=!0,globalThis.requestAnimationFrame?.(u))}function u(){a=!1
for(let t of r)if("function"==typeof t)t()
else{if([">","+"].includes(t.relation)){if(">"==t.relation){let e=globalThis.document?.createElement("div")
for(let o of Array.from(t.out?.childNodes||[]))e.appendChild(o)
t.out?.replaceChildren(e),c(e,"out",t.ops)}s?.space?.(t.in,t.out),c(t.in,"in",t.ops,(()=>{t.in&&t.out?.appendChild(t.in),s?.adjust?.(t.in,t.ops)}))}else c(t.in,"in",t.ops,(()=>{t.out?.after(t.in),s?.space?.(t.in,t.out),s?.adjust?.(t.in,t.ops),"/"===t.relation&&c(t.out,"out",t.ops)}))
t.done?.(t.in)}r=[]}function c(t,e,o,i){if(t?.nodeType==Node.TEXT_NODE){let e=t.textContent,o=globalThis.document?.createElement("div")
o.textContent=e,t.replaceWith(o),t=o}if(t){let n=Array.isArray(o.trans?.dur)?o.trans?.dur["in"==e?0:1]||o.trans?.dur[0]:o.trans?.dur||0,l=o?.trans?.class||"cu-trans"
t?.classList?.add(l),o.trans?.hooks?.[`${e}-start`]?.(t),"out"==e?f((()=>{s?.size?.(t),n&&(t.style.transitionDuration=`${n}ms`),t.classList?.add(e)})):setTimeout((()=>{f((()=>{n&&(t.style.transitionDuration=`${n}ms`),t?.classList?.add(e),i?.(),f((()=>{t?.classList?.remove(e)}))}))}),o.trans?.swap||0),setTimeout((()=>{f((()=>{"out"==e&&t?.remove(),t?.classList?.remove(l),t?.classList?.remove(e),o.trans?.hooks?.[`${e}-end`]?.(t)}))}),n+("in"==e&&o.trans?.swap||0))}}let h=globalThis.DOMParser?new DOMParser:void 0
let d=/, {0,}/g,g=0
!function(){let t=globalThis.document?.currentScript?.dataset
if(t?.config)try{T(JSON.parse(t?.config))}catch(t){console.warn("Invalid Mfld params",t)}t?.init&&function(t){let e=t?.querySelectorAll(`[data-${b.join("],[data-")}]${0!=p.fetch?.auto?",a":""}`)||[]
for(let t of e){t.id||(t.id="cu-"+g++)
for(let e in t.dataset){if(!b.includes(e))continue
let o="bind"!=e,i=`(#${t.id} on ${e})`
t?.dataset?.[e]?.split(";").forEach((n=>{let s,r=n?.split(/(?:(?:\)|->) ?){1,}/g)||[],a=o?y(r.splice(0,1)[0]):[],u=r[0]?.includes("(")&&r[0]?.match(/^[^\(]{1,}/)?.[0]||"",c=y(r.splice("sync"==e?1:0,1)[0]),h=y(r[0])
if(o&&!a?.length)throw`No trigger: ${i}.`
if(u){if(s=globalThis[u]||globalThis.Mfld_funcs.get(u),!s)throw`"${u}" not registered: ${i}`
if(!o&&c.length>1||o&&h.length>1)throw`Multiple sources: ${i}`}let d=c.map((t=>{let[e,...o]=t.split(/[\.\[\]\?]{1,}/g)
return{name:e,path:o.map((t=>isNaN(parseInt(t))?t:parseInt(t))).filter((t=>t))}}))
a?.length||(a=[""])
for(let o of a){"fetch"==e&&m(t,o,c,h,p),h?.length||(h=[""])
for(let n=0;n<h.length;n++)if("bind"==e){let e=()=>{f((()=>{t[h[n]]=s?.(...d.map((t=>w(l(t.name)?.value,t.path))),t)??w(l(d[0].name||"")?.value,d[0].path),t.dispatchEvent(new CustomEvent(o))}))}
for(let o of d)l(o.name)?.u(t.id,e)}else if("sync"==e){if(d.length>1)throw`Only one store supported: ${i}`
let e=()=>{let e=t[h[n].trim()]
s&&(e=s?.(e,t))
const o=l(d[0]?.name)
void 0!==e&&o?.update?.((t=>d[0]?.path?.length?w(t,d[0]?.path,e):e))}
t.addEventListener(o,e)}}}))}}}()}()
let p={},b=["bind","sync","fetch"]
function T(t,e){e?p.profiles={...p.profiles,[e]:t}:p={...p,...t}}function w(t,e,o){let i=t
for(let t of e)null==i&&(i="number"==typeof t?[]:{}),null==o||e[e.length-1]!==t?i=i instanceof Map?i?.get(t):i?.[t]:i instanceof Map?i.set(t,o):i[t]=o
return i}function y(t){if(t?.includes("(")){let e=t.match(/[^\(\)]{1,}/g)
t=e?.[e.length-1]||""}return t?.split(d)||[]}function m(t,e,o,i,n){let l=o=>{o?.preventDefault(),o?.stopPropagation()
let i={...n,...n.profiles?.[t.dataset.overrides||""]||JSON.parse(t.dataset.overrides||"{}")||{}},l=o?.target;(["click","submit"].includes(e)||["A","FORM"].includes(l?.nodeName))&&history.pushState({fetchData:i,elId:t.id},"",l?.href||l?.action||""),async function(t,e,o){if(h&&!e.fetch?.externals?.some((e=>t?.href?.startsWith(e.domain)))){let o=e.fetch,i=await fetch(t?.href,{...o?.request||{},method:t?.method,body:o?.request?.body?JSON.stringify(o?.request?.body||{}):void 0}).catch((t=>{o?.err?.(t)})),n=i?.status
if(n&&0==o?.onCode?.(n))return
let l=await(i?.[e.fetch?.type||"text"]())
e.fetch?.cb?.(l),"json"!=e?.fetch?.type&&h.parseFromString(l,"text/html").body}}({method:t.dataset.method?.toLowerCase()||"get",href:l?.href,el:t},i)}
"mount"==e?l():t.addEventListener(e,l)}const v={store:(store_name,store_ops)=>(store_ops?.hasOwnProperty("value")||store_ops?.hasOwnProperty("updater")||(store_ops={value:store_ops}),l(store_name,store_ops)),ustore:(store_name,store_ops)=>l(store_name,store_ops),get:store_name=>l(store_name),func:func_name=>globalThis.Mfld_funcs.get(func_name),funcs:funcs=>{for(let t in funcs)globalThis.Mfld_funcs.set(t,funcs[t])},config:(new_ops,profile_name)=>T(new_ops,profile_name),onTick:t=>{var o;(o=t)&&e.push(o)}}
export{v as Mfld}
