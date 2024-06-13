let e="mf_",t=/[\.\[\]\?]{1,}/g,i=/, {0,}/g,o=()=>`${Date.now()}.${Math.floor(1e5*Math.random())}`,n=window,r=(e,t)=>{let i=t.dataset?.override||"",o=e.profiles?.[i]||{}
return{...e,...o}},s=o=>{"string"!=typeof o&&((o=o?.el?.dataset?.[o?.datakey]||"")||null==o?.el?.dataset?.[`${e}else`]||(o="return true"))
let[r,s]=o?.split("=>")?.map((e=>e.trim()))?.reverse()||["",""],[l,a]=r?.split(/\s{1,}as\s{1,}/)||[r,"value"],f=a?.split?.(i)?.map?.((e=>e.trim()))||["value"],u=s?.split(",")?.map((e=>e.replace(/[()]/g,"").trim()))||[],c=n[l]||MFLD.fn[l]
if(!c){u?.length||l.includes("=>")||(l.match(/\(|\)/)?u=l.match(/\([^\)]{1,}\)/)?.[0]?.replace(/[\(\) ]/g,"").split(",").filter((e=>!e.match(/[\"\'\`]/)))||[]:(u=[l],l=`return ${l}`)),u=("string"==typeof u?u.split(/\s*,\s*/)||[]:u).map((e=>e.split(t)[0]))||[],l.match(/^\s{0,}\{/)||l.includes("return")||(l=l.replace(/^\s{0,}/,"return "))
try{c=new Function(...u,l)}catch(e){console.error(e)}}return{valueList:u,func:c,as:f}},l=[],a=0,f=[],u=e=>{l.push(e),a||(a=requestAnimationFrame(p))},c=(e,t,i,o)=>{if(!(o.trans?.smart??1))return
let{paddingTop:n,paddingBottom:r}=t instanceof Element?getComputedStyle(t):{paddingTop:0,paddingBottom:0},s=document.createElement("div")
s.style.height=`calc(${Math.abs(i-(e?.clientHeight||0))}px - ${n} - ${r})`,t?.after(s)},d=(e,t)=>{if(!t.trans?.smart??1)return
let i=(t?.trans?.dur?.[0]||t?.trans?.dur||600)/2
u((()=>{e?.animate?.([{height:""},{height:`${e.clientHeight||0}px`}],i)}))},p=()=>{a=0
for(let e of l){if("function"==typeof e){e()
continue}let t=e.out?e.out.clientHeight:0,i="inner"==e.relation
if("prepend"==e.relation)c?.(e.in,e.out,t,e.ops),h(e.in,"in",e.ops,(()=>{e.out?.prepend(e.in),d?.(e.in,e.ops)}))
else{if(["inner","outer"].includes(e.relation)){let t=e.out?.cloneNode(!0)
t&&(e.out?.after(t),i&&(t.style.border="none",e.out.replaceChildren()),h(t,"out",e.ops,void 0,e.out,i))}c?.(e.in,e.out,t,e.ops),h(e.in,"in",e.ops,(()=>{"outer"==e.relation?e.out?.replaceWith(e.in):e.out?.appendChild(e.in),d?.(e.in,e.ops)}))}e.done?.(e.in)}f.forEach((e=>e())),f=[],l=[]},h=(t,i,o,n,r,s=!1)=>{if(t?.nodeType==Node.TEXT_NODE&&(t.replaceWith(document?.createElement("div")),t.textContent=t.textContent),t){const l=Array.isArray(o.trans?.dur)?o.trans?.dur["in"==i?0:1]||o.trans?.dur[0]:o.trans?.dur||0,a=o?.trans?.class||`${e}trans`
if(t?.classList?.add(a),o.trans?.hooks?.[`${i}-start`]?.(t),"out"==i){if(!(r=r||t))return
let e={};(o.trans?.smart??1)&&!s&&(e=m(r)),u((()=>{(o.trans?.smart??1)&&s&&r&&(e=m(r)),(o.trans?.smart??1)&&(t.style.position="fixed",t.style.width=e.w,t.style.left=e.left,t.style.top=e.top,t.style.margin="0"),l&&(t.style.transitionDuration=`${l}ms`),t.classList?.add("out")}))}else t?.classList?.add("in"),l&&(t.style.transitionDuration=`${l}ms`),n?.(),setTimeout((()=>{u((()=>{setTimeout((()=>u((()=>t?.classList?.remove(i)))),0)}))}),o.trans?.swap||0)
setTimeout((()=>{u((()=>{"out"==i&&t?.remove(),t?.classList?.remove(a),o.trans?.hooks?.[`${i}-end`]?.(t)}))}),l+("in"==i&&o.trans?.swap||0))}},m=e=>{let t=getComputedStyle(e),i=e.getBoundingClientRect()
return{w:`calc(${e.clientWidth}px - ${t.paddingLeft} - ${t.paddingRight})`,left:`calc(${i.left}px + ${n.scrollX}px)`,top:`calc(${i.top}px + ${n.scrollY}px)`}},$=e=>{if(!e)return 0
if("number"==typeof e||!0===e)return e
if(e instanceof Map||e instanceof Set)return $(Array.from(e.entries()||e))
let t=0
for(let i of(new TextEncoder).encode(e?.toString()||""))t=(t<<5)-t+i
return t}
n.MFLD||(n.MFLD={st:new Map,fn:{},mut:new Map})
class y{t=void 0
i=new Map
o=void 0
l=new Set
u=new Set
p
h
constructor(e,t){return this.m(e,t)}m(e,t){if(this.name=e,this.p=t?.scope||document.currentScript||"global",MFLD.st.set(e,this),this.p instanceof Element){let e=MFLD.mut.get(this.p)||{toRemove:new Set}
e.observer||(e.observer=new MutationObserver((t=>{for(let i of t)if("childList"==i.type)for(let t of i.removedNodes)if(t instanceof Element)for(let i of e.toRemove)if(i.p==t){let t=this.p
v(i),e.observer.disconnect(),e.toRemove.delete(i),MFLD.mut.delete(t)}})),e.observer.observe(this.p?.parentElement,{childList:!0})),e.toRemove.add(this),MFLD.mut.set(this.p,e)}return t?.upstream?.map((e=>{let t=g(e)
return this.l.add(t),t.u.add(this),t})),this.value=t?.value,this.t=t?.updater,this.$(),this}sub(e,t,i=!0){this.i.set(t||o(),e),i&&e?.(this.value)}async update(e){return new Promise((async t=>{this.h&&clearTimeout(this.h),this.h=setTimeout((()=>{u((async()=>{let i="function"==typeof e?(await e)?.(this.value):e,o=$(i)
if(o!==this.o){this.value=i,this.o=o
for(let e of this.u)await e.$()
for(let[e,t]of this?.i||[])t?.(this.value,e)
t(this.value)}else t(this.value)}))}),0)}))}async $(){let e=await(this.t?.(Array.from(this.l)?.map((e=>e?.value))||[],this?.value))
await this.update(void 0===e?this.value:e)}}let g=(e,t)=>{let i=n.MFLD.st.get(e)
return t?i?i.m(e,t):new y(e,t):i||new y(e,t)},v=e=>{MFLD.st.delete(e.name),e=void 0},w=(t,i,o,n,r,l,a)=>{let f=async i=>{i?.preventDefault(),i?.stopPropagation(),r||(r=(i?.target)?.method||"get"),o?.fetch?.externals?.find((e=>n?.startsWith(e.domain)))||!n.match(/^https?:\/\//)||n.includes(location.origin)
let f=a?.(...l||[])||l,c=Array.isArray(f)?f[0]:"$form"==f?new FormData(t):f
if(a){let e=Array.isArray(f)?f?.map((e=>g(e).value))||[]:[c]
c=a?.(...e)}let d=await fetch(n,{...o?.fetch?.request||{},headers:{...o?.fetch?.request?.headers,MFLD:"true"},method:r,body:"$form"==f||"string"==typeof c?c:JSON.stringify(c)}).catch((e=>{o?.fetch?.err?.(e)})),p=d?.status
if(p&&0==o?.fetch?.onCode?.(p,d))return
let h=await(d?.[o?.fetch?.resType||"text"]())
for(let i of["append","prepend","inner","outer"]){let n=t.dataset[`${e}${i}`]
if(void 0===n)continue
let[r,s]=n?.split("->").map((e=>e.trim()))||[],l=(new DOMParser)?.parseFromString?.(h,"text/html")
l&&u({in:l.querySelector(r||"body"),out:s?document.querySelector(s):t,relation:i,ops:o,done:e=>{F(e)}})}void 0!==t.dataset?.[`${e}pushstate`]&&history.pushState({},"",n)
let m=t.dataset?.[`${e}resolve`],$=s(m||"")?.func
$?.(h)}
"$mount"==i?f():t.addEventListener(i,f)}
function M(e,t,i){return t?.(e)?e:M((i?.(e)||e)?.nextElementSibling,t,i)}let b=(e=[],t)=>g(o(),{upstream:[...e],updater:e=>{try{return t?.func?.(...e)??e[0]}catch(e){return}},scope:t?.observeEl}),L=(e,t,i,o,r,s)=>{if(r.match("bind"))b(t,{observeEl:e,func:()=>{let r=s?.(...t.map((e=>n.MFLD.st.get(e)?.value||n[r])),e)
if(i&&null!=r){let[t,o]=i.split(":")
"style"==t?e.style[o]=r:"attr"==t?e.setAttribute(o,r):e[i]=r}return e.dispatchEvent(new CustomEvent(o)),r}})
else{let n=()=>{t.length>1&&console.warn("Multiple sync props",e)
let[o,n]=t?.[0].trim().split(":"),r="style"==o?e.style[n]:"attr"==o?e.getAttribute(n):e[o],l=parseFloat(r)
isNaN(l)||(r=l)
let a=s?.(r,e)
i&&void 0!==a&&g(i)?.update?.(a)}
"$mount"==o?n():e.addEventListener(o,n)}},T=(e,t,i,o,n,r)=>{let l=document.createElement("template"),a=(e=>{let t="TEMPLATE"
if(e.tagName==t)return e
let i=document.createElement(t)
return i.content.appendChild(e.cloneNode(!0)),e.replaceWith(i),i})(e.cloneNode(!0))
l.classList.add(`${t}-start`),a.classList.add(`${t}-end`),e.before(l),e.after(a),e.remove()
let f,c=t.match(/if|elseif|else/)
if(c){if(!t.match(/if/)){let e=l?.previousElementSibling?.previousElementSibling,i=e?.dataset?.[`${t}-cstore`]
i&&g(i)}f=e=>!o||1==o?.(e)}let d=b(n,{func:c?f:o,observeEl:a})
e.dataset[`${t}-cstore`]=d.name,d.sub((e=>{void 0!==e&&u((()=>{M(l?.nextElementSibling,(e=>e?.classList?.contains(`${t}-end`)),(e=>h(e,"out",r,(()=>e?.remove())))),c&&!e||((e,t)=>{if(e instanceof Map)for(const[i,o]of e.entries())t(i,o)
else try{let i=Array.from(e||[])
if(i?.length)i.forEach(t)
else for(let i in e)t(i,e[i])}catch(t){console.error(`${e} is not iterable`)}})(t.match(/each/)?e:[e],((e,t)=>{let o=a.cloneNode(!0)
if(!c){let n=new RegExp("\\$:{([^}]*)}","g"),r=a?.innerHTML?.replace(n,((o,n)=>s(`(${i.join(",")})=> ${n}`)?.func?.(e,t)||""))||""
o?.innerHTML&&(o.innerHTML=r)}for(let t of o.content.children)t?.innerHTML||(t.innerHTML=e),a.before(t),h(t,"in",r,(()=>F(t)))}))}))}))},x={},D=["bind","sync","templ","if","elseif","else","each","get","head","post","put","delete","patch"].map((t=>`${e}${t}`))
n.addEventListener("popstate",(e=>{}))
let F=t=>{if(t&&t.nodeType==Node.TEXT_NODE)return
let o=(t||document.body).querySelectorAll(`[data-${D.join("],[data-")}],a,form`)||[]
for(let t of o){let o=r(x,t)
if(void 0!==t.dataset?.[`${e}promote`]){let[e,i,n,r]="A"==t.tagName?["get",t.href,[],"click"]:[t.method.toLowerCase(),t.action,"$form","submit"]
if(i){w(t,r,o,i,e,n)
continue}}for(let n in t.dataset){if(!D.includes(n))continue
let r=!n.match(/bind|templ|if|elseif|else|each/)
for(let l of t.dataset?.[n]?.split(";;")||[]){let[a,f]=l?.split("->")?.map((e=>e.trim()))||[],u=r&&a.slice(0,a.indexOf(")"))?.match(/[^\(\)]{1,}/g)?.pop()?.split(i)?.map((e=>e.trim()))||[]
!f&&n.match(/get|head|post|put|delete|patch/)&&(f=a.slice(a.indexOf(")")+1),a="")
let c=r?a?.slice(a.indexOf(")")+1):a
if(r&&!u?.length){console.error("No trigger",t)
break}let{func:d,valueList:p,as:h}=s(c)
if(c&&!d&&console.warn(`"${c}" not registered`,t),n.match(/if|elseif|else/)&&console.log("CONDITIONAL SETTINGS",l,u,f,c,p),n.match(/each|templ|if|elseif|else/))T(t,n,h||[],d,p||[],o)
else{u?.length||(u=[""])
for(let i of u)n.match(/bind|sync/)?L(t,p,f,i,n,d):w(t,i,o,f,n.replace(e,""),p,d)}}}}},E={store:(store_name,store_ops)=>(store_ops?.hasOwnProperty("value")||store_ops?.hasOwnProperty("updater")||(store_ops={value:store_ops}),g(store_name,store_ops)),ustore:(store_name,store_ops)=>g(store_name,store_ops),get:store_name=>g(store_name),func:func_name=>MFLD.fn[func_name],funcs:funcs=>{for(let e in funcs)MFLD.fn[e]=funcs[e]},config:(new_ops,profile_name)=>{return e=new_ops,void((t=profile_name)?x.profiles={...x.profiles,[t]:e}:x={...x,...e})
var e,t},onTick:e=>{var t;(t=e)&&f.push(t)},register:e=>{"string"==typeof e&&(e=document.querySelector(e)),F(e)}}
exports.Mfld=E
