let t="mf_",e=/[\.\[\]\?]{1,}/g,n=/, {0,}/g,o=()=>`${Date.now()}.${Math.floor(1e5*Math.random())}`,i=(t,e)=>{let n=t.profiles?.[override]||JSON.parse(e.dataset?.overrides||{})
return{...t,...n}},r=o=>{"string"!=typeof o&&((o=o?.el?.dataset?.[o?.datakey]||"")||null==o?.el?.dataset?.[`${t}else`]||(o="return true"))
let[i,r]=o?.split("=>")?.map((t=>t.trim()))?.reverse()||["",""],[s,l]=i?.split(/\s{1,}as\s{1,}/)||[i,"value"],a=l?.split?.(n)?.map?.((t=>t.trim()))||["value"],f=r?.split(",")?.map((t=>t.replace(/[()]/g,"").trim()))||[],u=window[s]||MfFn[s]
if(!u){f?.length||s.includes("=>")||(s.match(/\(|\)/)?f=s.match(/\([^\)]{1,}\)/)?.[0]?.replace(/[\(\) ]/g,"").split(",").filter((t=>!t.match(/[\"\'\`]/)))||[]:(f=[s],s=`return ${s}`)),f=("string"==typeof f?f.split(/\s*,\s*/):f).map((t=>t.split(e)[0])),s.match(/^\s{0,}\{/)||s.includes("return")||(s=s.replace(/^\s{0,}/,"return "))
try{u=new Function(...f,s)}catch(t){console.error(t)}}return{valueList:f,func:u,as:a}},s=[],l=!1,a=[],f=t=>{s.push(t),l||(l=requestAnimationFrame(d))},u=(t,e,n,o)=>{if(!(o.trans?.smart??1))return
let{paddingTop:i,paddingBottom:r}=e instanceof Element?getComputedStyle(e):{paddingTop:0,paddingBottom:0},s=document.createElement("div")
s.style.height=`calc(${Math.abs(n-(t?.clientHeight||0))}px - ${i} - ${r})`,e?.after(s)},c=(t,e)=>{if(!e.trans?.smart??1)return
let n=(e?.trans?.dur?.[0]||e?.trans?.dur||600)/2
f((()=>{t?.animate?.([{height:""},{height:`${t.clientHeight||0}px`}],n)}))},d=()=>{l=!1
for(let t of s){if("function"==typeof t){t()
continue}let e=t.out?t.out.clientHeight:0,n="swapinner"==t.relation
if("prepend"==t.relation)u?.(t.in,t.out,e,t.ops),p(t.in,"in",t.ops,(()=>{t.out?.prepend(t.in),c?.(t.in,t.ops)}))
else{if(["swapinner","swapouter"].includes(t.relation)){let e=t.out?.cloneNode(!0)
e&&(t.out?.after(e),n&&(e.style.border="none",t.out.replaceChildren()),p(e,"out",t.ops,void 0,t.out,n))}u?.(t.in,t.out,e,t.ops),p(t.in,"in",t.ops,(()=>{"swapouter"==t.relation?t.out?.replaceWith(t.in):t.out?.appendChild(t.in),c?.(t.in,t.ops)}))}t.done?.(t.in)}a.forEach((t=>t())),a=[],s=[]},p=(e,n,o,i,r,s=!1)=>{if(e?.nodeType==Node.TEXT_NODE&&(e=e.replaceWith(document?.createElement("div")).textContent=e.textContent),e){const l=Array.isArray(o.trans?.dur)?o.trans?.dur["in"==n?0:1]||o.trans?.dur[0]:o.trans?.dur||0,a=o?.trans?.class||`${t}trans`
if(e?.classList?.add(a),o.trans?.hooks?.[`${n}-start`]?.(e),"out"==n){if(!(r=r||e))return
let t={};(o.trans?.smart??1)&&!s&&(t=h(r)),f((()=>{(o.trans?.smart??1)&&s&&r&&(t=h(r)),(o.trans?.smart??1)&&(e.style.position="fixed",e.style.width=t.w,e.style.left=t.left,e.style.top=t.top,e.style.margin="0"),l&&(e.style.transitionDuration=`${l}ms`),e.classList?.add("out")}))}else e?.classList?.add("in"),l&&(e.style.transitionDuration=`${l}ms`),i?.(),setTimeout((()=>{f((()=>{setTimeout((()=>f((()=>e?.classList?.remove(n)))),0)}))}),o.trans?.swap||0)
setTimeout((()=>{f((()=>{"out"==n&&e?.remove(),e?.classList?.remove(a),o.trans?.hooks?.[`${n}-end`]?.(e)}))}),l+("in"==n&&o.trans?.swap||0))}},h=t=>{let e=getComputedStyle(t),n=t.getBoundingClientRect()
return{w:`calc(${t.clientWidth}px - ${e.paddingLeft} - ${e.paddingRight})`,left:`calc(${n.left}px + ${window.scrollX}px)`,top:`calc(${n.top}px + ${window.scrollY}px)`}},m=t=>{if(!t)return 0
if("number"==typeof t||!0===t)return t
if(t instanceof Map||t instanceof Set)return m(Array.from(t.entries()||t))
let e=0
for(let n of(new TextEncoder).encode(t?.toString()||""))e=(e<<5)-e+n
return e}
window.MfSt||(window.MfSt=new Map),window.MfFn||(window.MfFn={}),window.MfMutOb||(window.MfMutOb=new Map)
class w{t=void 0
o=new Map
i=void 0
l=new Set
u=new Set
p
h
constructor(t,e){return this.m(t,e)}m(t,e){if(this.name=t,this.p=e?.scope||document.currentScript||"global",MfSt.set(t,this),this.p instanceof Element){let t=MfMutOb.get(this.p)||{toRemove:new Set}
t.observer||(t.observer=new MutationObserver((e=>{for(let n of e)if("childList"==n.type)for(let e of n.removedNodes)if(e instanceof Element)for(let n of t.toRemove)if(n.p==e){let e=this.p
y(n),t.observer.disconnect(),t.toRemove.delete(n),MfMutOb.delete(e)}})),t.observer.observe(this.p?.parentElement,{childList:!0})),t.toRemove.add(this),MfMutOb.set(this.p,t)}return e?.upstream?.map((t=>{let e=$(t)
return this.l.add(e),e.u.add(this),e})),this.value=e?.value,this.t=e?.updater,this.$(),this}sub(t,e,n=!0){this.o.set(e||o(),t),n&&t?.(this.value)}async update(t){return new Promise((async e=>{this.h&&clearTimeout(this.h),this.h=setTimeout((()=>{f((async()=>{let n="function"==typeof t?(await t)?.(this.value):t,o=m(n)
if(o!==this.i){this.value=n,this.i=o
for(let t of this.u)await t.$()
for(let[t,e]of this?.o||[])e?.(this.value,t)
e(this.value)}else e(this.value)}))}),0)}))}async $(){let t=await(this.t?.(Array.from(this.l)?.map((t=>t?.value))||[],this?.value))
await this.update(void 0===t?this.value:t)}}let $=(t,e)=>{let n=MfSt.get(t)
return e?n?n.m(t,e):new w(t,e):n||new w(t,e)},y=t=>{MfSt.delete(t.name),t=void 0},g=(e,n,o,i,s,l,a)=>{let u=async n=>{n?.preventDefault(),n?.stopPropagation(),s||(s=(n?.target)?.method||"get"),o?.fetch?.externals?.find((t=>i?.startsWith(t.domain)))||!i.match(/^https?:\/\//)||i.includes(location.origin)
let u=a?.(...l||[])||l,c=Array.isArray(u)?u[0]:"$form"==u?new FormData(e):u
if(a){let t=Array.isArray(u)?u?.map((t=>$(t).value))||[]:[c]
c=a?.(...t)}let d=await fetch(i,{...o?.fetch?.request||{},headers:{...o?.fetch?.request?.headers,MFLD:"true"},method:s,body:"$form"==u||"string"==typeof c?c:JSON.stringify(c)}).catch((t=>{o?.fetch?.err?.(t)})),p=d?.status
if(p&&0==o?.fetch?.onCode?.(p,d))return
let h=await(d?.[o?.fetch?.resType||"text"]())
for(let n of["append","prepend","swapinner","swapouter"]){let i=e.dataset[`${t}${n}`]
if(void 0===i)continue
let[r,s]=i?.split("->").map((t=>t.trim()))||[],l=(new DOMParser)?.parseFromString?.(h,"text/html")
l&&f({in:l.querySelector(r||"body"),out:s?document.querySelector(s):e,relation:n,ops:o,done:t=>{A(t)}})}void 0!==e.dataset?.[`${t}pushstate`]&&history.pushState({},"",i)
let m=e.dataset?.[`${t}resolve`],w=r(m||"")?.func
w?.(h)}
"$mount"==n?u():e.addEventListener(n,u)},v=(t,e,n=[],o=[])=>{if(t.tagName==e)return t
let i=document.createElement(e)
return i.innerHTML=t.innerHTML,[...t.attributes].filter((t=>!n.includes(t.name))).forEach((t=>i.setAttribute(t.name,t.value))),o.forEach((t=>i.classList.remove(t))),t.replaceWith(i),i},M=(t,e)=>{if(t instanceof Map)for(const[n,o]of t.entries())e(n,o)
else try{let n=Array.from(t||[])
if(n?.length)n.forEach(e)
else for(let n in t)e(n,t[n])}catch(e){console.error(`${t} is not iterable`)}},b=(t,e,n)=>e?.(t)?t:b(n?.(t)||t?.nextElementSibling,e,n),S=(t=[],e)=>$(o(),{upstream:[...t],updater:t=>{try{return e?.func?.(...t)||t[0]}catch(t){return}},scope:e?.observeEl}),x=(t,e,n,o,i,r)=>{if(i.match("bind"))S(e,{observeEl:t,func:()=>{let i=r?.(...e.map((t=>MfSt.get(t).value||window.value)),t)
if(n&&null!=i){let[e,o]=n.split(":")
"style"==e?t.style[o]=i:"attr"==e?t.setAttribute(o,i):t[n]=i}return t.dispatchEvent(new CustomEvent(o)),i}})
else{let i=()=>{e.length>1&&console.warn("Multiple sync props",t)
let[o,i]=e?.[0].trim().split(":"),s="style"==o?t.style[i]:"attr"==o?t.getAttribute(i):t[o],l=parseFloat(s)
isNaN(l)||(s=l)
let a=r?.(s,t)
n&&void 0!==a&&$(n)?.update?.(a)}
"$mount"==o?i():t.addEventListener(o,i)}},T=(e,n,o,i,s,l)=>{let a=document.createElement("template"),u=v(e.cloneNode(!0),"TEMPLATE")
a.classList.add(`${n}-start`),u.classList.add(`${n}-end`),u.dataset.nodeName=e.nodeName,e.before(a),e.after(u),e.remove(),S(s,{func:i,observeEl:u}).sub((e=>{f((()=>{b(a?.nextElementSibling,(t=>t?.classList?.contains(`${n}-end`)),(t=>p(t,"out",l,(()=>t?.remove())))),(n.match(/each/)?M:(t,e)=>e(t||""))(e,((e,i)=>{if(null==e)return
let s,a=u?.innerHTML||u?.textContent?.replace(/^\n{0,}|\n{0,}$/,"")||"",f=a.match(/\${[^}]*}/g)||[]
for(let t of f)try{let n=r(`(${o.join(",")})=> ${t.slice(2,t.length-1)}`)?.func
a=a.replace(t,n?.(e,i)||"")}catch(t){a="Error in template. Check console for details.",console.error(t)}if(n.match(/each/)){let t=u.cloneNode(!0)
t.innerHTML=a||e,s=t.content.children}else{let o=v(u.cloneNode(!0),u.dataset.nodeName,["data-node-name",`data-${t}`],[`${n}-end`])
o.innerHTML=a||e,s=[o]}for(let t of s)u.before(t),p(t,"in",l,(()=>A(t)))}))}))}))},_={},E=["bind","sync","templ","if","each","get","head","post","put","delete","patch"].map((e=>`${t}${e}`))
window.addEventListener("popstate",(t=>{}))
let A=e=>{if(e&&e.nodeType==Node.TEXT_NODE)return
let o=(e||document.body).querySelectorAll(`[data-${E.join("],[data-")}],a,form`)||[]
for(let e of o){let o=i(_,e)
if(void 0!==e.dataset?.[`${t}promote`]){let[t,n,i,r]="A"==e.tagName?["get",e.href,[],"click"]:[e.method.toLowerCase(),e.action,"$form","submit"]
if(n){g(e,r,o,n,t,i)
continue}}for(let i in e.dataset){if(!E.includes(i))continue
let s=!i.match(/bind|templ|if|each/)
for(let l of e.dataset?.[i]?.split(";;")||[]){let[a,f]=l?.split("->")?.map((t=>t.trim()))||[],u=s&&a.slice(0,a.indexOf(")"))?.match(/[^\(\)]{1,}/g)?.pop()?.split(n)?.map((t=>t.trim()))||[]
!f&&i.match(/get|head|post|put|delete|patch/)&&(f=a.slice(a.indexOf(")")+1),a="")
let c=s?a?.slice(a.indexOf(")")+1):a
if(s&&!u?.length){console.error("No trigger",e)
break}let{func:d,valueList:p,as:h}=r(c)
if(c&&!d&&console.warn(`"${c}" not registered`,e),i.match(/if|each|templ/))T(e,i,h||[],d,p||[],o)
else{u?.length||(u=[""])
for(let n of u)i.match(/bind|sync/)?x(e,p,f,n,i,d):g(e,n,o,f,i.replace(t,""),p,d)}}}}},F={store:(store_name,store_ops)=>(store_ops?.hasOwnProperty("value")||store_ops?.hasOwnProperty("updater")||(store_ops={value:store_ops}),$(store_name,store_ops)),ustore:(store_name,store_ops)=>$(store_name,store_ops),get:store_name=>$(store_name),func:func_name=>MfFn[func_name],funcs:funcs=>{for(let t in funcs)MfFn[t]=funcs[t]},config:(new_ops,profile_name)=>{return t=new_ops,void((e=profile_name)?_.profiles={..._.profiles,[e]:t}:_={..._,...t})
var t,e},onTick:t=>{var e;(e=t)&&a.push(e)},register:t=>{"string"==typeof t&&(t=document.querySelector(t)),A(t)}}
export{F as Mfld}
