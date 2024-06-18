let t="mf_",e=/, {0,}/g,i=()=>`${Date.now()}.${Math.floor(1e5*Math.random())}`,n=(e,i)=>{let n=e.profiles?.[i.dataset?.override||""],o={...e,...n}
for(let e in i.dataset)for(let n of["fetch","trans"])if(e.startsWith(`${t}${n}_`))try{let t=e.split("_")[1],r=i.dataset[e]
r?.match(/\{\[/)&&(r=JSON.parse(r)),parseInt(r)&&(r=parseInt(r)),o[n][t]=r}catch(t){console.error(t)}return o},o=(t,i,n)=>{try{let[o,r]=t?.split(/\s{1,}as\s{1,}/)||[t,"value"],s=`return ${o?.match(/^\s{0,}(function)?\(.{0,}\)(=>)?\s{0,}/)?`(${o})()`:o}`,l=r?.split?.(e)?.map?.((t=>t.trim()))||["value"]||[]
return{func:new Function("$el","$st","$fn",i||"$val",n||"$key",s),as:l}}catch(t){return console.error(t),{}}}
let r=[],s=0,l=[],f=t=>{r.push(t),s||(s=requestAnimationFrame(c))},u=(t,e,i,n)=>{if(!(n.trans?.smart??1))return
let{paddingTop:o,paddingBottom:r}=e instanceof Element?getComputedStyle(e):{paddingTop:0,paddingBottom:0},s=document.createElement("div")
s.style.height=`calc(${Math.abs(i-(t?.clientHeight||0))}px - ${o} - ${r})`,e?.after(s)},a=(t,e)=>{if(!e.trans?.smart??1)return
let i=(e?.trans?.dur?.[0]||e?.trans?.dur||600)/2
f((()=>{t?.animate?.([{height:""},{height:`${t.clientHeight||0}px`}],i)}))},c=()=>{s=0
for(let t of r){if("function"==typeof t){t()
continue}let e=t.out?t.out.clientHeight:0,i="inner"==t.relation
if("prepend"==t.relation)u?.(t.in,t.out,e,t.ops),h(t.in,"in",t.ops,(()=>{t.out?.prepend(t.in),a?.(t.in,t.ops)}))
else{if(["inner","outer"].includes(t.relation)){let e=t.out?.cloneNode(!0)
e&&(t.out?.after(e),i&&(e.style.border="none",t.out.replaceChildren()),h(e,"out",t.ops,void 0,t.out,i))}u?.(t.in,t.out,e,t.ops),h(t.in,"in",t.ops,(()=>{"outer"==t.relation?t.out?.replaceWith(t.in):t.out?.appendChild(t.in),a?.(t.in,t.ops)}))}t.done?.(t.in)}l.forEach((t=>t())),l=[],r=[]},h=(e,i,n,o,r,s=!1,l)=>{if(e?.nodeType==Node.TEXT_NODE&&(e.replaceWith(document?.createElement("div")),e.textContent=e.textContent),e){const u=Array.isArray(n.trans?.dur)?n.trans?.dur["in"==i?0:1]||n.trans?.dur[0]:n.trans?.dur||0,a=n?.trans?.class||`${t}trans`
if(e?.classList?.add(a),n.trans?.hooks?.[`${i}-start`]?.(e),"out"==i){if(!(r=r||e))return
let t={};(n.trans?.smart??1)&&!s&&(t=d(r)),f((()=>{(n.trans?.smart??1)&&s&&r&&(t=d(r)),(n.trans?.smart??1)&&(e.style.position="fixed",e.style.width=t.w,e.style.left=t.left,e.style.top=t.top,e.style.margin="0"),u&&(e.style.transitionDuration=`${u}ms`),e.classList?.add("out")}))}else e?.classList?.add("in"),u&&(e.style.transitionDuration=`${u}ms`),o?.(),setTimeout((()=>{f((()=>{setTimeout((()=>f((()=>e?.classList?.remove(i)))),0)}))}),n.trans?.swap||0)
setTimeout((()=>{f((()=>{"out"==i&&e?.remove(),e?.classList?.remove(a),n.trans?.hooks?.[`${i}-end`]?.(e),e.style.transitionDuration="","in"==i&&l?.(e)}))}),u+("in"==i&&n.trans?.swap||0))}},d=t=>{let e=getComputedStyle(t),i=t.getBoundingClientRect()
return{w:`calc(${t.clientWidth}px - ${e.paddingLeft} - ${e.paddingRight})`,left:`calc(${i.left}px + ${$.scrollX}px)`,top:`calc(${i.top}px + ${$.scrollY}px)`}},p=(t,e)=>{let i=$.MFLD.st.get(t)
return e?i?i.t(t,e):new v(t,e):i||new v(t,e)},$=window
$.MFLD||($.MFLD={st:new Map,mut:new Map,$st:new Proxy(p,{get:(t,e)=>t(e)?.value,set:(t,e,i)=>{let n=e.split(/[\.\[\]\?]{1,}/g).map((t=>parseFloat(t.trim())||t.trim())),o=t(n[0]),r=o.value
for(let t of n.slice(1)||[])r=r[t]
return r=i,o.update(r),!0}}),$fn:{}})
let m=t=>{if(!t)return 0
if("number"==typeof t||!0===t)return t
if(t instanceof Map||t instanceof Set)return m(Array.from(t.entries()||t))
let e=0
for(let i of(new TextEncoder).encode(t?.toString()||""))e=(e<<5)-e+i
return e}
class v{i=void 0
o=new Map
l=void 0
u=new Set
h=new Set
p
$
constructor(t,e){return this.t(t,e)}t(t,e){if(this.name=t,this.p=e?.scope||document.currentScript||"global",$.MFLD.st.set(t,this),this.p instanceof Element){let t=$.MFLD.mut.get(this.p)||{toRemove:new Set,observer:null}
t.observer||(t.observer=new MutationObserver((e=>{for(let i of e)if("childList"==i.type)for(let e of i.removedNodes)if(e instanceof Element)for(let i of t.toRemove)if(i.p==e){let e=this.p
g(i),t.observer?.disconnect(),t.toRemove.delete(i),MFLD.mut.delete(e)}})),t.observer.observe(this.p?.parentElement,{childList:!0})),t.toRemove.add(this),MFLD.mut.set(this.p,t)}return e?.upstream?.map((t=>{let e=p(t)
return this.u.add(e),e.h.add(this),e})),this.value=e?.value,this.i=e?.updater,this.m(),this}sub(t,e,n=!0){this.o.set(e||i(),t),n&&t?.(this.value)}update(t){this.$&&clearTimeout(this.$),this.$=setTimeout((()=>{f((()=>{let e="function"==typeof t?t?.(this.value):t,i=m(e)
if(i!==this.l){this.value=e,this.l=i
for(let t of this.h)t.m()
for(let[t,e]of this?.o||[])e?.(this.value,t)}return this.value}))}),0)}m(){let t=this.i?.(Array.from(this.u)?.map((t=>t?.value))||[],this?.value)
this.update(void 0===t?this.value:t)}}let g=t=>{$.MFLD.st.delete(t?.name||""),t=void 0}
function w(t,e,i,n=!1){let o=n?"previousElementSibling":"nextElementSibling"
return e?.(t)?t:w((i?.(t)||t)?.[o],e,i,n)}let y=(t,e)=>p(i(),{upstream:[...t||[]],updater:()=>e?.func?.(e.observeEl,S,E),scope:e?.observeEl}),b=(t,e,i,n)=>{y(n,{observeEl:t,func:()=>(t.dispatchEvent(new CustomEvent(e)),i?.(t,S,E))})},T=(e,i,n)=>{let o=i=>{n?.(e,S,E),function(e,i,n){i?.preventDefault()
let o=e.dataset?.[`${t}pushstate`],r=n
switch(o){case"":break
case void 0:return
default:r=`#${o}`}history.pushState(null,"",r)}(e,i)}
"$mount"==i?o():e.addEventListener(i,o)},_=(e,i,n,r,s,l)=>{let u,a,c=document.createElement("template"),d=(t=>{let e="TEMPLATE"
if(t.tagName==e)return t
let i=document.createElement(e)
return i.content.appendChild(t.cloneNode(!0)),t.replaceWith(i),i})(e.cloneNode(!0)),p=i.match(/if|else/),$=i.match(/(else|elseif)(\s|$)/),m=[]
if(c.classList.add(`${i}-start`),d.classList.add(`${i}-end`),e.before(c),e.after(d),e.remove(),p){if($){let e=w(c,(e=>e?.classList?.contains(`${t}if-end`)),null,!0)
w(e,(t=>t==d),(e=>{e?.dataset?.[`${t}cstore`]&&m.push(e?.dataset?.[`${t}cstore`])}))}a=(...t)=>{if($)for(let e of t.slice(-m.length))if(1==e)return!1
return"else"==$?.[0]||1==r?.(...t)}}u=y(s,{func:p?a:r,observeEl:d}),p&&(d.dataset[`${t}cstore`]=u.name),u.sub((t=>{void 0!==t&&f((()=>{w(c?.nextElementSibling,(t=>t?.classList?.contains(`${i}-end`)),(t=>h(t,"out",l,(()=>t?.remove())))),p&&!t||((t,e)=>{if(t instanceof Map)for(const[i,n]of t.entries())e(i,n)
else try{let i=Array.from(t||[])
if(i?.length)i.forEach(e)
else for(let i in t)e(i,t[i])}catch(e){console.error(`${t} is not iterable`)}})(i.match(/each/)?t:[t],((t,i)=>{let r=d.cloneNode(!0)
if(!p){let s=d?.innerHTML?.replace(/\$:{([^}]*)}/g,((r,s)=>o(s,n[0],n[1])?.func?.(e,S,E,t,i)||""))||""
r?.innerHTML&&(r.innerHTML=s)}for(let e of r.content.children)e?.innerHTML||(e.innerHTML=t),d.before(e),h(e,"in",l)}))}))}))},M={},x=["bind","sync","templ","if","elseif","else","each","get","head","post","put","delete","patch"].map((e=>`${t}${e}`))
$.addEventListener("popstate",(()=>{location.reload()}))
let{$fn:E,$st:S}=$.MFLD,A={store:(store_name,store_ops)=>(store_ops?.hasOwnProperty("value")||store_ops?.hasOwnProperty("updater")||(store_ops={value:store_ops}),p(store_name,store_ops)),ustore:(store_name,store_ops)=>p(store_name,store_ops),funcs:funcs=>{for(let t in funcs)$.MFLD.$fn[t]=funcs[t]},config:(new_ops,profile_name)=>{return t=new_ops,void((e=profile_name)?M.profiles={...M.profiles,[e]:t}:M={...M,...t})
var t,e},onTick:t=>{var e;(e=t)&&l.push(e)},register:r=>{"string"==typeof r&&(r=document.querySelector(r)),(r=>{if(r?.nodeType==Node.TEXT_NODE)return
let s=(r||document.body).querySelectorAll(`[data-${x.join("],[data-")}],a,form`)
for(let r of s){let s=n(M,r)
if(r.id||(r.id=i()),void 0!==r.dataset?.[`${t}promote`]){let[t,e,i,n]="A"==r.tagName?["get",r.href,[],"click"]:[r.method.toLowerCase(),r.action,"$form","submit"]
if(e)continue}for(let t in r.dataset)if(x.includes(t))for(let i of r.dataset?.[t]?.split(";;")||[]){let[n,l]=i?.split(/\s*->\s*/).reverse(),f=l?.match(/[^\(\)]{1,}/g)?.pop()?.split(e)?.map((t=>t.trim())),u=[...n?.matchAll(/\$st\.(\w{1,})/g)].map((t=>t[1]))
console.log(r,f,n,u)
let{func:a,as:c}=o(n)
if(t.match(/each|templ|if|else/))_(r,t,c||[],a,u,s)
else{f?.length||(f=[""])
for(let e of f)t.match(/bind/)?b(r,e,a,u):t.match(/sync/)&&T(r,e,a)}}}})(r)}}
$.MFLD.$st,$.MFLD.$fn,globalThis.Mfld||(globalThis.Mfld=A)
