let e="mf_",t=/, {0,}/g,o=()=>`${Date.now()}.${Math.floor(1e5*Math.random())}`,n=window,i=(t,o)=>{let n=t.profiles?.[o.dataset?.override||""],i={...t,...n}
for(let t in o.dataset){console.log("SET",t)
for(let n of["fetch","trans"])if(t.startsWith(`${e}${n}_`)){console.log("MATCH",`${e}${n}_`)
try{let e=t.split("_")[1],s=o.dataset[t]
s?.match(/\{\[/)&&(s=JSON.parse(s)),parseInt(s)&&(s=parseInt(s)),i[n][e]=s,console.log("Got ",n,e,s)}catch(e){console.error(e)}}}return console.log(i),i},s=e=>{let[o,n]=e?.split(/\s{1,}as\s{1,}/)||[e,"value"],i=`let $fn = globalThis.MFLD.fn; let $st = globalThis.MFLD.st; console.log($el, $fn, $st); console.log($el.value); console.log($fn); return ${o}`,s=n?.split?.(t)?.map?.((e=>e.trim()))||["value"]||[]
return{func:new Function("$el",i),as:s}}
let l=[],r=0,f=[],a=e=>{l.push(e),r||(r=requestAnimationFrame(d))},u=(e,t,o,n)=>{if(!(n.trans?.smart??1))return
let{paddingTop:i,paddingBottom:s}=t instanceof Element?getComputedStyle(t):{paddingTop:0,paddingBottom:0},l=document.createElement("div")
l.style.height=`calc(${Math.abs(o-(e?.clientHeight||0))}px - ${i} - ${s})`,t?.after(l)},c=(e,t)=>{if(!t.trans?.smart??1)return
let o=(t?.trans?.dur?.[0]||t?.trans?.dur||600)/2
a((()=>{e?.animate?.([{height:""},{height:`${e.clientHeight||0}px`}],o)}))},d=()=>{r=0
for(let e of l){if("function"==typeof e){e()
continue}let t=e.out?e.out.clientHeight:0,o="inner"==e.relation
if("prepend"==e.relation)u?.(e.in,e.out,t,e.ops),h(e.in,"in",e.ops,(()=>{e.out?.prepend(e.in),c?.(e.in,e.ops)}))
else{if(["inner","outer"].includes(e.relation)){let t=e.out?.cloneNode(!0)
t&&(e.out?.after(t),o&&(t.style.border="none",e.out.replaceChildren()),h(t,"out",e.ops,void 0,e.out,o))}u?.(e.in,e.out,t,e.ops),h(e.in,"in",e.ops,(()=>{"outer"==e.relation?e.out?.replaceWith(e.in):e.out?.appendChild(e.in),c?.(e.in,e.ops)}))}e.done?.(e.in)}f.forEach((e=>e())),f=[],l=[]},h=(t,o,n,i,s,l=!1,r)=>{if(t?.nodeType==Node.TEXT_NODE&&(t.replaceWith(document?.createElement("div")),t.textContent=t.textContent),t){const f=Array.isArray(n.trans?.dur)?n.trans?.dur["in"==o?0:1]||n.trans?.dur[0]:n.trans?.dur||0,u=n?.trans?.class||`${e}trans`
if(t?.classList?.add(u),n.trans?.hooks?.[`${o}-start`]?.(t),"out"==o){if(!(s=s||t))return
let e={};(n.trans?.smart??1)&&!l&&(e=p(s)),a((()=>{(n.trans?.smart??1)&&l&&s&&(e=p(s)),(n.trans?.smart??1)&&(t.style.position="fixed",t.style.width=e.w,t.style.left=e.left,t.style.top=e.top,t.style.margin="0"),f&&(t.style.transitionDuration=`${f}ms`),t.classList?.add("out")}))}else t?.classList?.add("in"),f&&(t.style.transitionDuration=`${f}ms`),i?.(),setTimeout((()=>{a((()=>{setTimeout((()=>a((()=>t?.classList?.remove(o)))),0)}))}),n.trans?.swap||0)
setTimeout((()=>{a((()=>{"out"==o&&t?.remove(),t?.classList?.remove(u),n.trans?.hooks?.[`${o}-end`]?.(t),t.style.transitionDuration="",console.log("RUNNING AFTER"),"in"==o&&r?.(t)}))}),f+("in"==o&&n.trans?.swap||0))}},p=e=>{let t=getComputedStyle(e),o=e.getBoundingClientRect()
return{w:`calc(${e.clientWidth}px - ${t.paddingLeft} - ${t.paddingRight})`,left:`calc(${o.left}px + ${n.scrollX}px)`,top:`calc(${o.top}px + ${n.scrollY}px)`}},$=e=>{if(!e)return 0
if("number"==typeof e||!0===e)return e
if(e instanceof Map||e instanceof Set)return $(Array.from(e.entries()||e))
let t=0
for(let o of(new TextEncoder).encode(e?.toString()||""))t=(t<<5)-t+o
return t}
n.MFLD||(n.MFLD={st:{},fn:{},mut:new Map})
class m{t=void 0
o=new Map
i=void 0
l=new Set
u=new Set
h
p
constructor(e,t){return this.$(e,t)}$(e,t){if(this.name=e,this.h=t?.scope||document.currentScript||"global",n.MFLD.st[e]=this,this.h instanceof Element){let e=n.MFLD.mut.get(this.h)||{toRemove:new Set,observer:null}
e.observer||(e.observer=new MutationObserver((t=>{for(let o of t)if("childList"==o.type)for(let t of o.removedNodes)if(t instanceof Element)for(let o of e.toRemove)if(o.h==t){let t=this.h
v(o),e.observer?.disconnect(),e.toRemove.delete(o),MFLD.mut.delete(t)}})),e.observer.observe(this.h?.parentElement,{childList:!0})),e.toRemove.add(this),MFLD.mut.set(this.h,e)}return t?.upstream?.map((e=>{let t=g(e)
return this.l.add(t),t.u.add(this),t})),this.value=t?.value,this.t=t?.updater,this.m(),this}sub(e,t,n=!0){this.o.set(t||o(),e),n&&e?.(this.value)}async update(e){return new Promise((async t=>{this.p&&clearTimeout(this.p),this.p=setTimeout((()=>{a((async()=>{let o="function"==typeof e?(await e)?.(this.value):e,n=$(o)
if(n!==this.i){this.value=o,this.i=n
for(let e of this.u)await e.m()
for(let[e,t]of this?.o||[])t?.(this.value,e)
t(this.value)}else t(this.value)}))}),0)}))}async m(){let e=await(this.t?.(Array.from(this.l)?.map((e=>e?.value))||[],this?.value))
await this.update(void 0===e?this.value:e)}}let g=(e,t)=>{let o=n.MFLD.st[e]
return t?o?o.$(e,t):new m(e,t):o||new m(e,t)},v=e=>{n.MFLD.st[e?.name||""]=void 0}
function w(e,t,o,n=!1){let i=n?"previousElementSibling":"nextElementSibling"
return t?.(e)?e:w((o?.(e)||e)?.[i],t,o,n)}let y=(e,t)=>g(o(),{upstream:[...e||[]],updater:()=>t?.func?.(t.observeEl),scope:t?.observeEl}),b=(t,o,n,i,s,l)=>{if(i.match("bind"))o=o?.replace(/\$el\./,"")||"",y(l,{observeEl:t,func:()=>{let e=s?.(t)
if(o&&null!=e){let[n,i]=o.split(":")
"style"==n?t.style[i]=e:"attr"==n?t.setAttribute(i,e):t[o]=e}return t.dispatchEvent(new CustomEvent(n)),e}})
else{let i=n=>{console.log("EV",s.toString(),t,s?.(t))
let i=s?.(t)
o&&void 0!==i&&g(o)?.update?.(i),function(t,o,n){o?.preventDefault()
let i=t.dataset?.[`${e}pushstate`],s=n
switch(i){case"":break
case void 0:return
default:s=`#${i}`}history.pushState(null,"",s)}(t,n)}
"$mount"==n?i():t.addEventListener(n,i)}},T=(t,o,n,i,l,r)=>{let f,u,c=document.createElement("template"),d=(e=>{let t="TEMPLATE"
if(e.tagName==t)return e
let o=document.createElement(t)
return o.content.appendChild(e.cloneNode(!0)),e.replaceWith(o),o})(t.cloneNode(!0)),p=o.match(/if|else/),$=o.match(/(else|elseif)(\s|$)/),m=[]
if(c.classList.add(`${o}-start`),d.classList.add(`${o}-end`),t.before(c),t.after(d),t.remove(),p){if($){let t=w(c,(t=>t?.classList?.contains(`${e}if-end`)),null,!0)
w(t,(e=>e==d),(t=>{t?.dataset?.[`${e}cstore`]&&m.push(t?.dataset?.[`${e}cstore`])}))}u=(...e)=>{if($)for(let t of e.slice(-m.length))if(1==t)return!1
return"else"==$?.[0]||1==i?.(...e)}}f=y(l,{func:p?u:i,observeEl:d}),p&&(d.dataset[`${e}cstore`]=f.name),f.sub((e=>{void 0!==e&&a((()=>{w(c?.nextElementSibling,(e=>e?.classList?.contains(`${o}-end`)),(e=>h(e,"out",r,(()=>e?.remove())))),p&&!e||((e,t)=>{if(e instanceof Map)for(const[o,n]of e.entries())t(o,n)
else try{let o=Array.from(e||[])
if(o?.length)o.forEach(t)
else for(let o in e)t(o,e[o])}catch(t){console.error(`${e} is not iterable`)}})(o.match(/each/)?e:[e],((e,t)=>{let o=d.cloneNode(!0)
if(!p){let i=new RegExp("\\$:{([^}]*)}","g"),l=d?.innerHTML?.replace(i,((o,i)=>s(`(${n.join(",")})=> ${i}`)?.func?.(e,t)||""))||""
o?.innerHTML&&(o.innerHTML=l)}for(let t of o.content.children)t?.innerHTML||(t.innerHTML=e),d.before(t),h(t,"in",r)}))}))}))},E={},M=["bind","sync","templ","if","elseif","else","each","get","head","post","put","delete","patch"].map((t=>`${e}${t}`))
n.addEventListener("popstate",(()=>{location.reload()}))
let S={store:(store_name,store_ops)=>(store_ops?.hasOwnProperty("value")||store_ops?.hasOwnProperty("updater")||(store_ops={value:store_ops}),g(store_name,store_ops)),ustore:(store_name,store_ops)=>g(store_name,store_ops),get:store_name=>g(store_name),func:func_name=>n.MFLD.fn[func_name],funcs:funcs=>{for(let e in funcs)n.MFLD.fn[e]=funcs[e]},config:(new_ops,profile_name)=>{return e=new_ops,void((t=profile_name)?E.profiles={...E.profiles,[t]:e}:E={...E,...e})
var e,t},onTick:e=>{var t;(t=e)&&f.push(t)},register:n=>{"string"==typeof n&&(n=document.querySelector(n)),(n=>{if(n?.nodeType==Node.TEXT_NODE)return
let l=(n||document.body).querySelectorAll(`[data-${M.join("],[data-")}],a,form`)||[]
for(let n of l){let l=i(E,n)
if(n.id||(n.id=o()),void 0!==n.dataset?.[`${e}promote`]){let[e,t,o,i]="A"==n.tagName?["get",n.href,[],"click"]:[n.method.toLowerCase(),n.action,"$form","submit"]
if(t)continue}for(let e of M){if(void 0===n.dataset?.[e])continue
let o=!e.match(/bind|templ|if|else|each/)
for(let i of n.dataset?.[e]?.split(";;")||[]){let r=i?.split(/\s*->\s*/g),f=(o?r?.shift()?.match(/[^\(\)]{1,}/g)?.pop()?.split(t)?.map((e=>e.trim())):[])||[],[a,u]=r,c=a?.match(/\$st\.(\w{1,})/g)||[]
!u&&e.match(/get|head|put|post|delete|patch/)&&(u=a,a="")
let{func:d,as:h}=s(a)
if(console.log("MODE",e,"FUNC",d,"AS",h,"OUTPUT",u,"DEPS",c),e.match(/each|templ|if|else/))T(n,e,h||[],d,c,l)
else{f?.length||(f=[""])
for(let t of f)e.match(/bind|sync/)&&b(n,u,t,e,d)}}}}})(n)}}
export{S as Mfld}
