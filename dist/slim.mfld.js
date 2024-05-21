function t(e){if(!e)return 0
if("number"==typeof e)return e
if(!0===e)return 1
if(e instanceof Map)return t(Array.from(e.entries()))
if(e instanceof Set)return t(Array.from(e))
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
constructor(t,e){return this.u(t,e)}u(t,e){this.name=t,globalThis.Mfld_stores.set(t,this),this.l=e?.upstream||[]
for(let t of this.l)l(t)?.i?.push(this.name||"")
return this.value=e?.value,this.#t=e?.updater,this}h(t,e){this.t.set(t,e),e?.()}sub(t){let e="x".repeat(5).replace(/./g,(t=>"ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"[Math.floor(36*Math.random())]))
this.t.set(e,t),t?.(this.value)}async update(n){return new Promise((r=>{i.set(this.name||"",n),clearTimeout(o),o=setTimeout((async()=>{for(let[t,e]of i){const e=l(t)
e.i.forEach((t=>i.delete(t))),e.l.forEach((e=>!i.has(e)||i.delete(t)))}let o=[]
for(let[e,n]of i){let i=l(e),r="function"==typeof n?await(n?.(i.value)):n,s=t(r)
if(s!==i.o){i.value=r,i.o=s
for(let t of i.i)o.push(t)
for(let[t,e]of i.t)e?.(i.value,t)}}i.clear()
for(let t of o)l(t)&&await l(t).p()
e.forEach((t=>t())),e=[],r(this.value)}),0)}))}async p(){await this.update(await(this.#t?.(this.l?.map((t=>l(t)?.value))||[],this?.value)||this.value))}}function l(t,e){let o=globalThis.Mfld_stores.get(t)
return e?o?o.u(t,e):new n(t,e):o||new n(t,e)}let r=globalThis.smartOutro,s=[],f=!1
function a(t){s.push(t),f||(f=!0,globalThis.requestAnimationFrame?.(u))}function u(){f=!1
for(let t of s)if("function"==typeof t)t()
else{if([">","+"].includes(t.relation)){if(">"==t.relation){let e=globalThis.document?.createElement("div")
for(let o of Array.from(t.out?.childNodes||[]))e.appendChild(o)
t.out?.replaceChildren(e),h(e,"out",t.ops)}r?.space?.(t.in,t.out),h(t.in,"in",t.ops,(()=>{t.in&&t.out?.appendChild(t.in),r?.adjust?.(t.in,t.ops)}))}else h(t.in,"in",t.ops,(()=>{t.out?.after(t.in),r?.space?.(t.in,t.out),r?.adjust?.(t.in,t.ops),"/"===t.relation&&h(t.out,"out",t.ops)}))
t.done?.(t.in)}s=[]}function h(t,e,o,i){if(t?.nodeType==Node.TEXT_NODE){let e=t.textContent,o=globalThis.document?.createElement("div")
o.textContent=e,t.replaceWith(o),t=o}if(t){let n=Array.isArray(o.trans?.dur)?o.trans?.dur["in"==e?0:1]||o.trans?.dur[0]:o.trans?.dur||0,l=o?.trans?.class||"cu-trans"
t?.classList?.add(l),o.trans?.hooks?.[`${e}-start`]?.(t),"out"==e?a((()=>{r?.size?.(t),n&&(t.style.transitionDuration=`${n}ms`),t.classList?.add(e)})):setTimeout((()=>{a((()=>{n&&(t.style.transitionDuration=`${n}ms`),t?.classList?.add(e),i?.(),a((()=>{t?.classList?.remove(e)}))}))}),o.trans?.swap||0),setTimeout((()=>{a((()=>{"out"==e&&t?.remove(),t?.classList?.remove(l),t?.classList?.remove(e),o.trans?.hooks?.[`${e}-end`]?.(t)}))}),n+("in"==e&&o.trans?.swap||0))}}let c=globalThis.DOMParser?new DOMParser:void 0
let d=/, {0,}/g,g=0
!function(){let t=globalThis.document?.currentScript?.dataset
if(t?.config)try{T(JSON.parse(t?.config))}catch(t){console.warn("Invalid Mfld params",t)}t?.init&&function(t){let e=t?.querySelectorAll(`[data-${p.join("],[data-")}]${0!=b.fetch?.auto?",a":""}`)||[]
for(let t of e){t.id||(t.id="cu-"+g++)
for(let e in t.dataset){if(!p.includes(e))continue
let o="bind"!=e,i=`(#${t.id} on ${e})`
t?.dataset?.[e]?.split(";").forEach((n=>{let r,s=n?.split(/(?:(?:\)|->) ?){1,}/g)||[],f=o?y(s.splice(0,1)[0]):[],u=s[0]?.includes("(")&&s[0]?.match(/^[^\(]{1,}/)?.[0]||"",h=y(s.splice("sync"==e?1:0,1)[0]),c=y(s[0])
if(o&&!f?.length)throw`No trigger: ${i}.`
if(u){if(r=globalThis[u]||globalThis.Mfld_funcs?.get(u),!r)throw`"${u}" not registered: ${i}`
if(!o&&h.length>1||o&&c.length>1)throw`Multiple sources: ${i}`}let d=h.map((t=>{let[e,...o]=t.split(/[\.\[\]\?]{1,}/g)
return{name:e,path:o.map((t=>isNaN(parseInt(t))?t:parseInt(t))).filter((t=>t))}}))
f?.length||(f=[""])
for(let o of f){"fetch"==e&&m(t,o,h,c,b),c?.length||(c=[""])
for(let n=0;n<c.length;n++)if("bind"==e){let e=()=>{a((()=>{t[c[n]]=r?.(...d.map((t=>w(l(t.name)?.value,t.path))),t)??w(l(d[0].name||"")?.value,d[0].path),t.dispatchEvent(new CustomEvent(o))}))}
for(let o of d)l(o.name)?.h(t.id,e)}else if("sync"==e){if(d.length>1)throw`Only one store supported: ${i}`
let e=()=>{let e=t[c[n].trim()]
r&&(e=r?.(e,t))
const o=l(d[0]?.name)
void 0!==e&&o?.update?.((t=>d[0]?.path?.length?w(t,d[0]?.path,e):e))}
t.addEventListener(o,e)}}}))}}}()}()
let b={},p=["bind","sync","fetch"]
function T(t,e){e?b.profiles={...b.profiles,[e]:t}:b={...b,...t}}function w(t,e,o){let i=t
for(let t of e)null==i&&(i="number"==typeof t?[]:{}),null==o||e[e.length-1]!==t?i=i instanceof Map?i?.get(t):i?.[t]:i instanceof Map?i.set(t,o):i[t]=o
return i}function y(t){if(t?.includes("(")){let e=t.match(/[^\(\)]{1,}/g)
t=e?.[e.length-1]||""}return t?.split(d)||[]}function m(t,e,o,i,n){let l=o=>{o?.preventDefault(),o?.stopPropagation()
let i={...n,...n.profiles?.[t.dataset.overrides||""]||JSON.parse(t.dataset.overrides||"{}")||{}},l=o?.target;(["click","submit"].includes(e)||["A","FORM"].includes(l?.nodeName))&&history.pushState({fetchData:i,elId:t.id},"",l?.href||l?.action||""),async function(t,e,o){if(c&&!e.fetch?.externals?.some((e=>t?.href?.startsWith(e.domain)))){let o=e.fetch,i=await fetch(t?.href,{...o?.request||{},method:t?.method,body:o?.request?.body?JSON.stringify(o?.request?.body||{}):void 0}).catch((t=>{o?.err?.(t)})),n=i?.status
if(n&&0==o?.onCode?.(n))return
let l=await(i?.[e.fetch?.type||"text"]())
e.fetch?.cb?.(l),"json"!=e?.fetch?.type&&c.parseFromString(l,"text/html").body}}({method:t.dataset.method?.toLowerCase()||"get",href:l?.href,el:t},i)}
"mount"==e?l():t.addEventListener(e,l)}const M={store:(store_name,store_ops)=>(store_ops?.hasOwnProperty("value")||store_ops?.hasOwnProperty("updater")||(store_ops={value:store_ops}),l(store_name,store_ops)),ustore:(store_name,store_ops)=>l(store_name,store_ops),get:store_name=>l(store_name),func:func_name=>globalThis.Mfld_funcs?.get(func_name),funcs:funcs=>{for(let t in funcs)globalThis.Mfld_funcs.set(t,funcs[t])},config:(new_ops,profile_name)=>T(new_ops,profile_name),onTick:t=>{var o;(o=t)&&e.push(o)}}
export{M as Mfld}
