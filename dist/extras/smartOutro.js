let t,e="",i=0
globalThis.smartOutro={space:function(n,o){t=document?.createElement("div")
let{paddingTop:a,paddingBottom:d}=getComputedStyle(o)
e=t.style.height=`calc(${Math.abs(i-(n?.clientHeight||0))}px - ${a} - ${d})`,o?.after(t)},adjust:function(n,o,a){i=o.order.out?o.order.out.clientHeight:a((()=>{t?.remove(),n?.animate?.([{height:e},{height:`${n.clientHeight||0}px`}],{duration:o.trans?.dur?.[1]||o.trans?.dur||300,easing:"ease-in-out"})}))},size:function(t){t.style.width=`${t.clientWidth}px`,t.style.height=`${t.clientHeight}px`,t.style.position="absolute"}}
