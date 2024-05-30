function t(e){if(!e)return 0
if("number"==typeof e)return e
if(!0===e)return 1
if(e instanceof Map)return t(Array.from(e.entries()))
if(e instanceof Set)return t(Array.from(e))
let o=0
for(const t of(new TextEncoder).encode("string"==typeof e?e:e?.toString()||""))o=(o<<5)-o+t
return o}let e=[]
globalThis.Mfld_stores||(globalThis.Mfld_stores=new Map),globalThis.Mfld_funcs||(globalThis.Mfld_funcs=new Map)
let o,i=new Map
class n{#t=void 0
t=new Map
o=void 0
i=[]
l=[]
constructor(t,e){return this.u(t,e)}u(t,e){this.name=t,globalThis.Mfld_stores.set(t,this),this.l=e?.upstream||[]
for(let t of this.l)r(t)?.i?.push(this.name||"")
return this.value=e?.value,this.#t=e?.updater,this}h(t,e){this.t.set(t,e),e?.()}sub(t){let e="x".repeat(5).replace(/./g,(t=>"ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"[Math.floor(36*Math.random())]))
this.t.set(e,t),t?.(this.value)}async update(n){return new Promise((s=>{i.set(this.name||"",n),clearTimeout(o),o=setTimeout((async()=>{for(let[t,e]of i){const e=r(t)
e.i.forEach((t=>i.delete(t))),e.l.forEach((e=>!i.has(e)||i.delete(t)))}let o=[]
for(let[e,n]of i){let i=r(e),s="function"==typeof n?await(n?.(i.value)):n,l=t(s)
if(l!==i.o){i.value=s,i.o=l
for(let t of i.i)o.push(t)
for(let[t,e]of i.t)e?.(i.value,t)}}i.clear()
for(let t of o)r(t)&&await r(t).p()
e.forEach((t=>t())),e=[],s(this.value)}),0)}))}async p(){await this.update(await(this.#t?.(this.l?.map((t=>r(t)?.value))||[],this?.value)||this.value))}}function r(t,e){let o=globalThis.Mfld_stores.get(t)
return e?o?o.u(t,e):new n(t,e):o||new n(t,e)}let s=globalThis.smartOutro,l=[],f=!1
function a(t){l.push(t),f||(f=!0,globalThis.requestAnimationFrame?.(u))}function u(){f=!1
for(let t of l)if("function"==typeof t)t()
else{if([">","+"].includes(t.relation)){if(">"==t.relation){let e=globalThis.document?.createElement("div")
for(let o of Array.from(t.out?.childNodes||[]))e.appendChild(o)
t.out?.replaceChildren(e),c(e,"out",t.ops)}s?.space?.(t.in,t.out),c(t.in,"in",t.ops,(()=>{t.in&&t.out?.appendChild(t.in),s?.adjust?.(t.in,t.ops)}))}else c(t.in,"in",t.ops,(()=>{t.out?.after(t.in),s?.space?.(t.in,t.out),s?.adjust?.(t.in,t.ops),"/"===t.relation&&c(t.out,"out",t.ops)}))
t.done?.(t.in)}l=[]}function c(t,e,o,i){if(t?.nodeType==Node.TEXT_NODE){let e=t.textContent,o=globalThis.document?.createElement("div")
o.textContent=e,t.replaceWith(o),t=o}if(t){let n=Array.isArray(o.trans?.dur)?o.trans?.dur["in"==e?0:1]||o.trans?.dur[0]:o.trans?.dur||0,r=o?.trans?.class||"cu-trans"
t?.classList?.add(r),o.trans?.hooks?.[`${e}-start`]?.(t),"out"==e?a((()=>{s?.size?.(t),n&&(t.style.transitionDuration=`${n}ms`),t.classList?.add(e)})):setTimeout((()=>{a((()=>{n&&(t.style.transitionDuration=`${n}ms`),t?.classList?.add(e),i?.(),a((()=>{t?.classList?.remove(e)}))}))}),o.trans?.swap||0),setTimeout((()=>{a((()=>{"out"==e&&t?.remove(),t?.classList?.remove(r),t?.classList?.remove(e),o.trans?.hooks?.[`${e}-end`]?.(t)}))}),n+("in"==e&&o.trans?.swap||0))}}let h=globalThis.DOMParser?new DOMParser:void 0
let d=/, {0,}/g,g=0,p={},b=["bind","sync","fetch"]
function T(t,e,o){let i=t
for(let t of e)null==i&&(i="number"==typeof t?[]:{}),null==o||e[e.length-1]!==t?i=i instanceof Map?i?.get(t):i?.[t]:i instanceof Map?i.set(t,o):i[t]=o
return i}function m(t){if(t?.includes("(")){let e=t.match(/[^\(\)]{1,}/g)
t=e?.[e.length-1]||""}return t?.split(d)?.map((t=>t.trim()))||[]}function w(t,e,o,i,n){let r=o=>{o?.preventDefault(),o?.stopPropagation()
let i={...n,...n.profiles?.[t.dataset.overrides||""]||JSON.parse(t.dataset.overrides||"{}")||{}},r=o?.target;(["click","submit"].includes(e)||["A","FORM"].includes(r?.nodeName))&&history.pushState({fetchData:i,elId:t.id},"",r?.href||r?.action||""),async function(t,e,o){if(h&&!e.fetch?.externals?.some((e=>t?.href?.startsWith(e.domain)))){let o=e.fetch,i=await fetch(t?.href,{...o?.request||{},method:t?.method,body:o?.request?.body?JSON.stringify(o?.request?.body||{}):void 0}).catch((t=>{o?.err?.(t)})),n=i?.status
if(n&&0==o?.onCode?.(n))return
let r=await(i?.[e.fetch?.type||"text"]())
e.fetch?.cb?.(r),"json"!=e?.fetch?.type&&h.parseFromString(r,"text/html").body}}({method:t.dataset.method?.toLowerCase()||"get",href:r?.href,el:t},i)}
"mount"==e?r():t.addEventListener(e,r)}const y={store:(store_name,store_ops)=>(store_ops?.hasOwnProperty("value")||store_ops?.hasOwnProperty("updater")||(store_ops={value:store_ops}),r(store_name,store_ops)),ustore:(store_name,store_ops)=>r(store_name,store_ops),get:store_name=>r(store_name),func:func_name=>globalThis.Mfld_funcs?.get(func_name),funcs:funcs=>{for(let t in funcs)globalThis.Mfld_funcs.set(t,funcs[t])},config:(new_ops,profile_name)=>{return t=new_ops,void((e=profile_name)?p.profiles={...p.profiles,[e]:t}:p={...p,...t})
var t,e},onTick:t=>{var o;(o=t)&&e.push(o)},register:t=>{"string"==typeof t&&(t=document.querySelector(t)),function(t){let e=`[data-cu-${b.join("],[data-cu-")}],[cu-${b.join("],[cu-")}]${0!=p.fetch?.auto?",a":""}`,o=(t||document.body).querySelectorAll(e)||[]
for(let t of o){t.id||(t.id="cu-"+g++)
for(let e of b){let o="bind"!=e,i=`(#${t.id} on ${e})`
const n=t.getAttribute(`cu-${e}`)||t.getAttribute(`data-cu-${e}`)
n?.split(";").forEach((n=>{let s,l=n?.split(/(?:(?:\)|->) ?){1,}/g)||[],f=o?m(l.splice(0,1)[0]):[],u=l[0]?.includes("(")&&l[0]?.match(/^[^\(]{1,}/)?.[0]||"",c=m(l.splice("sync"==e?1:0,1)[0]),h=m(l[0])
if(o&&!f?.length)throw`No trigger: ${i}.`
if(u){if(s=globalThis[u]||globalThis.Mfld_funcs?.get(u),!s)throw`"${u}" not registered: ${i}`
if(!o&&c.length>1||o&&h.length>1)throw`Multiple sources: ${i}`}let d=c.map((t=>{let[e,...o]=t.split(/[\.\[\]\?]{1,}/g)
return{name:e,path:o.map((t=>isNaN(parseInt(t))?t:parseInt(t))).filter((t=>t))}}))
f?.length||(f=[""])
for(let o of f){"fetch"==e&&w(t,o,0,0,p),h?.length||(h=[""])
for(let n=0;n<h.length;n++)if("bind"==e){let e=()=>{a((()=>{t[h[n]]=s?.(...d.map((t=>T(r(t.name)?.value,t.path))),t)??T(r(d[0].name||"")?.value,d[0].path),t.dispatchEvent(new CustomEvent(o))}))}
for(let o of d)r(o.name)?.h(t.id,e)}else if("sync"==e){if(d.length>1)throw`Only one store supported: ${i}`
let e=()=>{let e=t[h[n].trim()]
s&&(e=s?.(e,t))
const o=r(d[0]?.name)
void 0!==e&&o?.update?.((t=>d[0]?.path?.length?T(t,d[0]?.path,e):e))}
t.addEventListener(o,e)}}}))}}}(t)}}
export{y as Mfld}
