let t="mf_",e=/[\.\[\]\?]{1,}/g,o=/, {0,}/g,n=()=>`${Date.now()}.${Math.floor(1e5*Math.random())}`,i=(e,o,n,i=!0,r="{}",s)=>{let l=o.dataset[`${t}${e}`]
if(l)return"overrides"==e?n.profiles?.[l]?.fetch||JSON.parse(l||r):i?JSON.parse(l||r):"num"==s?parseInt(l):"bool"==s?"true"==l:l},r=(t,e)=>{let o=i("overrides",e,t)
return{profiles:t.profiles,fetch:{...t.fetch,responseType:i("responsetype",e,t,!1)||t.fetch?.responseType,...o?.fetch,...i("fetch",e,t)},trans:{...t.trans,dur:i("transdur",e,t,!0,"[]","num")||t.trans?.dur,swap:i("transswap",e,t,!1,"","num")||t.trans?.swap,class:i("transclass",e,t,!1)||t.trans?.class,smartTransition:i("transsmart",e,t,!1,void 0,"bool")||t.trans?.smartTransition,...o?.trans,...i("trans",e,t)}}},s=n=>{"string"!=typeof n&&((n=n?.el?.dataset?.[n?.datakey]||"")||null==n?.el?.dataset?.[`${t}else`]||(n="return true"))
let[i,r]=n?.split("=>")?.map((t=>t.trim()))?.reverse()||["",""],[s,l]=i?.split(/\s{1,}as\s{1,}/)||[i,"value"],a=l?.split?.(o)?.map?.((t=>t.trim()))||["value"],f=r?.split(",")?.map((t=>t.replace(/[()]/g,"").trim()))||[],u=globalThis[s]||MfFn[s]
if(!u){f?.length||s.includes("=>")||(s.match(/\(|\)/)?f=s.match(/\([^\)]{1,}\)/)?.[0]?.replace(/[\(\) ]/g,"").split(",").filter((t=>!t.match(/[\"\'\`]/)))||[]:(f=[s],s=`return ${s}`)),f=("string"==typeof f?f.split(/\s*,\s*/):f).map((t=>t.split(e)[0])),s.match(/^\s{0,}\{/)||s.includes("return")||(s=s.replace(/^\s{0,}/,"return "))
try{u=new Function(...f,s)}catch(t){console.error(t)}}return{valueList:f,func:u,as:a}},l=[],a=!1,f=[],u=t=>{l.push(t),a||(a=requestAnimationFrame(d))},c=(t,e,o,n=!1,i)=>{if(!(i.trans?.smartTransition??1))return
let{paddingTop:r,paddingBottom:s}=e instanceof Element?window.getComputedStyle(e):{paddingTop:0,paddingBottom:0},l=document.createElement("div")
l.style.height=`calc(${Math.abs(o-(t?.clientHeight||0))}px - ${r} - ${s})`,e?.after(l)},p=(t,e)=>{if(!e.trans?.smartTransition??1)return
let o=(e?.trans?.dur?.[0]||e?.trans?.dur||600)/2
u((()=>{t?.animate?.([{height:""},{height:`${t.clientHeight||0}px`}],o)}))},d=()=>{a=!1
for(let t of l){if("function"==typeof t){t()
continue}let e=t.out?t.out.clientHeight:0,o="swapinner"==t.relation
if("prepend"==t.relation)c?.(t.in,t.out,e,!1,t.ops),h(t.in,"in",t.ops,(()=>{t.out?.prepend(t.in),p?.(t.in,t.ops)}))
else{if(["swapinner","swapouter"].includes(t.relation)){let e=t.out?.cloneNode(!0)
e&&(t.out?.after(e),o&&(e.style.border="none",t.out.replaceChildren()),h(e,"out",t.ops,void 0,t.out,o))}c?.(t.in,t.out,e,!1,t.ops),h(t.in,"in",t.ops,(()=>{"swapouter"==t.relation?t.out?.replaceWith(t.in):t.out?.appendChild(t.in),p?.(t.in,t.ops)}))}t.done?.(t.in)}f.forEach((t=>t())),f=[],l=[]},h=(e,o,n,i,r,s=!1)=>{if(e?.nodeType==Node.TEXT_NODE&&(e=e.replaceWith(document?.createElement("div")).textContent=e.textContent),e){const l=Array.isArray(n.trans?.dur)?n.trans?.dur["in"==o?0:1]||n.trans?.dur[0]:n.trans?.dur||0,a=n?.trans?.class||`${t}trans`
if(e?.classList?.add(a),n.trans?.hooks?.[`${o}-start`]?.(e),"out"==o){if(!(r=r||e))return
let t={};(n.trans?.smartTransition??1)&&!s&&(t=m(r)),u((()=>{(n.trans?.smartTransition??1)&&s&&r&&(t=m(r)),(n.trans?.smartTransition??1)&&(e.style.position="fixed",e.style.width=t.w,e.style.left=t.left,e.style.top=t.top,e.style.margin="0"),l&&(e.style.transitionDuration=`${l}ms`),e.classList?.add("out")}))}else e?.classList?.add("in"),l&&(e.style.transitionDuration=`${l}ms`),i?.(),setTimeout((()=>{u((()=>{setTimeout((()=>u((()=>e?.classList?.remove(o)))),0)}))}),n.trans?.swap||0)
setTimeout((()=>{u((()=>{"out"==o&&e?.remove(),e?.classList?.remove(a),n.trans?.hooks?.[`${o}-end`]?.(e)}))}),l+("in"==o&&n.trans?.swap||0))}},m=t=>{let e=getComputedStyle(t)
return{w:`calc(${t.clientWidth}px - ${e.paddingLeft} - ${e.paddingRight})`,left:`calc(${t.getBoundingClientRect().left}px + ${window.scrollX}px)`,top:`calc(${t.getBoundingClientRect().top}px + ${window.scrollY}px)`}},$=t=>{if(!t)return 0
if("number"==typeof t||!0===t)return t
if(t instanceof Map||t instanceof Set)return $(Array.from(t.entries()||t))
let e=0
for(let o of(new TextEncoder).encode(t?.toString()||""))e=(e<<5)-e+o
return e}
globalThis.MfSt||(globalThis.MfSt=new Map),globalThis.MfFn||(globalThis.MfFn={}),globalThis.MfMutOb||(globalThis.MfMutOb=new Map)
class g{t=void 0
o=new Map
i=void 0
l=new Set
u=new Set
p
h
constructor(t,e){return this.m(t,e)}m(t,e){if(this.name=t,this.p=e?.scope||document.currentScript||"global",MfSt.set(t,this),this.p instanceof Element){let t=MfMutOb.get(this.p)||{toRemove:new Set}
t.observer||(t.observer=new MutationObserver((e=>{for(let o of e)if("childList"==o.type)for(let e of o.removedNodes)if(e instanceof Element)for(let o of t.toRemove)if(o.p==e){let e=this.p
y(o),t.observer.disconnect(),t.toRemove.delete(o),MfMutOb.delete(e)}})),t.observer.observe(this.p?.parentElement,{childList:!0})),t.toRemove.add(this),MfMutOb.set(this.p,t)}return e?.upstream?.map((t=>{let e=w(t)
return this.l.add(e),e.u.add(this),e})),this.value=e?.value,this.t=e?.updater,this.$(),this}sub(t,e,o=!0){this.o.set(e||n(),t),o&&t?.(this.value)}async update(t){return new Promise((async e=>{this.h&&clearTimeout(this.h),this.h=setTimeout((()=>{u((async()=>{let o="function"==typeof t?(await t)?.(this.value):t,n=$(o)
if(n!==this.i){this.value=o,this.i=n
for(let t of this.u)await t.$()
for(let[t,e]of this?.o||[])e?.(this.value,t)
e(this.value)}else e(this.value)}))}),0)}))}async $(){let t=await(this.t?.(Array.from(this.l)?.map((t=>t?.value))||[],this?.value))
await this.update(void 0===t?this.value:t)}}let w=(t,e)=>{let o=MfSt.get(t)
return e?o?o.m(t,e):new g(t,e):o||new g(t,e)},y=t=>{MfSt.delete(t.name),t=void 0},b=(e,o,n,i,r,l,a)=>{let f=async o=>{o?.preventDefault(),o?.stopPropagation(),r||(r=(o?.target)?.method||"get"),n?.fetch?.externals?.find((t=>i?.startsWith(t.domain)))||!i.match(/^https?:\/\//)||i.includes(location.origin)
let f=a?.(...l||[])||l,c=Array.isArray(f)?f[0]:"$form"==f?new FormData(e):f
if(a){let t=Array.isArray(f)?f?.map((t=>w(t).value))||[]:[c]
c=a?.(...t)}let p=await fetch(i,{...n?.fetch?.request||{},headers:{...n?.fetch?.request?.headers,"Manifold-App-Fetch":"true"},method:r,body:"$form"==f||"string"==typeof c?c:JSON.stringify(c)}).catch((t=>{n?.fetch?.err?.(t)||console.error("FETCH ERROR",t)})),d=p?.status
if(d&&0==n?.fetch?.onCode?.(d,p))return
let h=await(p?.[n?.fetch?.responseType||"text"]())
for(let o of["append","prepend","swapinner","swapouter"]){let i=e.dataset[`${t}${o}`]
if(void 0===i)continue
let[r,s]=i?.split("->").map((t=>t.trim()))||[],l=(new DOMParser)?.parseFromString?.(h,"text/html")
l&&u({in:l.querySelector(r||"body"),out:s?document.querySelector(s):e,relation:o,ops:n,done:t=>{F(t)}})}void 0!==e.dataset?.[`${t}pushstate`]&&history.pushState({},"",i)
let m=e.dataset?.[`${t}resolve`],$=s(m||"")?.func
$?.(h)}
"$mount"==o?f():e.addEventListener(o,f)},v=(t,e,o=[],n=[])=>{if(t.tagName==e)return t
let i=document.createElement(e)
return i.innerHTML=t.innerHTML,[...t.attributes].filter((t=>!o.includes(t.name))).forEach((t=>i.setAttribute(t.name,t.value))),n.forEach((t=>i.classList.remove(t))),t.replaceWith(i),i},M=(t,e)=>{if(t instanceof Map)for(const[o,n]of t.entries())e(o,n)
else try{let o=Array.from(t||[])
if(o?.length)o.forEach(e)
else for(let o in t)e(o,t[o])}catch(e){console.error(`${t} is not iterable`)}},T=(t,e,o)=>e?.(t)?t:T(o?.(t)||t?.nextElementSibling,e,o),S=(t="",e=[],o)=>w(t,{upstream:[...e],updater:t=>{try{return o?.func?.(...t)||t[0]}catch(t){return}},scope:o?.observeEl}),x=(t,e,o,i,r,s)=>{if(r.match("bind"))S(n(),e,{observeEl:t,func:()=>{let n=s?.(...e.map((t=>MfSt.get(t).value||globalThis.value)),t)
if(o&&null!=n){let[e,i]=o.split(":")
"style"==e?t.style[i]=n:"attr"==e?t.setAttribute(i,n):t[o]=n}return t.dispatchEvent(new CustomEvent(i)),n}})
else{let n=()=>{e.length>1&&console.warn("Multiple sync props",t)
let[n,i]=e?.[0].trim().split(":"),r="style"==n?t.style[i]:"attr"==n?t.getAttribute(i):t[n],l=parseFloat(r)
isNaN(l)||(r=l)
let a=s?.(r,t)
o&&void 0!==a&&w(o)?.update?.(a)}
"$mount"==i?n():t.addEventListener(i,n)}},E=(e,o,i,r,l,a)=>{let f=document.createElement("template"),c=v(e.cloneNode(!0),"TEMPLATE")
f.classList.add(`${o}-start`),c.classList.add(`${o}-end`),c.dataset.nodeName=e.nodeName,e.before(f),e.after(c),e.remove(),S(n(),l,{func:r,observeEl:c}).sub((e=>{u((()=>{T(f?.nextElementSibling,(t=>t?.classList?.contains(`${o}-end`)),(t=>h(t,"out",a,(()=>t?.remove())))),(o.match(/each/)?M:(t,e)=>e(t||""))(e,((e,n)=>{if(null==e)return
let r,l=c?.innerHTML||c?.textContent?.replace(/^\n{0,}|\n{0,}$/,"")||"",f=l.match(/\${[^}]*}/g)||[]
for(let t of f)try{let o=s(`(${i.join(",")})=> ${t.slice(2,t.length-1)}`)?.func
l=l.replace(t,o?.(e,n)||"")}catch(t){l="Error in template. Check console for details.",console.error(t)}if(o.match(/each/)){let t=c.cloneNode(!0)
t.innerHTML=l||e,r=t.content.children}else{let n=v(c.cloneNode(!0),c.dataset.nodeName,["data-node-name",`data-${t}`],[`${o}-end`])
n.innerHTML=l||e,r=[n]}for(let t of r)c.before(t),h(t,"in",a,(()=>F(t)))}))}))}))},_={},A=["bind","sync","templ","if","each","get","head","post","put","delete","patch"].map((e=>`${t}${e}`))
globalThis.addEventListener("popstate",(t=>{}))
let F=e=>{if(e&&e.nodeType==Node.TEXT_NODE)return
let n=(e||document.body).querySelectorAll(`[data-${A.join("],[data-")}],a,form`)||[]
for(let e of n){let n=r(_,e)
if(void 0!==e.dataset?.[`${t}promote`]){let[t,o,i,r]="A"==e.tagName?["get",e.href,[],"click"]:[e.method.toLowerCase(),e.action,"$form","submit"]
if(o){b(e,r,n,o,t,i)
continue}}for(let i in e.dataset){if(!A.includes(i))continue
let r=!i.match(/bind|templ|if|each/)
for(let l of e.dataset?.[i]?.split(";;")||[]){let[a,f]=l?.split("->")?.map((t=>t.trim()))||[],u=r&&a.slice(0,a.indexOf(")"))?.match(/[^\(\)]{1,}/g)?.pop()?.split(o)?.map((t=>t.trim()))||[]
!f&&i.match(/get|head|post|put|delete|patch/)&&(f=a.slice(a.indexOf(")")+1),a="")
let c=r?a?.slice(a.indexOf(")")+1):a
if(r&&!u?.length){console.error("No trigger",e)
break}let{func:p,valueList:d,as:h}=s(c)
if(c&&!p&&console.warn(`"${c}" not registered`,e),i.match(/if|each|templ/))E(e,i,h||[],p,d||[],n)
else{u?.length||(u=[""])
for(let o of u)i.match(/bind|sync/)?x(e,d,f,o,i,p):b(e,o,n,f,i.replace(t,""),d,p)}}}}},O={store:(store_name,store_ops)=>(store_ops?.hasOwnProperty("value")||store_ops?.hasOwnProperty("updater")||(store_ops={value:store_ops}),w(store_name,store_ops)),ustore:(store_name,store_ops)=>w(store_name,store_ops),get:store_name=>w(store_name),func:func_name=>MfFn[func_name],funcs:funcs=>{for(let t in funcs)MfFn[t]=funcs[t]},config:(new_ops,profile_name)=>{return t=new_ops,void((e=profile_name)?_.profiles={..._.profiles,[e]:t}:_={..._,...t})
var t,e},onTick:t=>{var e;(e=t)&&f.push(e)},register:t=>{"string"==typeof t&&(t=document.querySelector(t)),F(t)}}
export{O as Mfld}
