let i,t="",a=0
globalThis.smartOutro={space:function(o,n){i=globalThis.document?.t("div")
let{paddingTop:e,paddingBottom:l}=globalThis.getComputedStyle(n)
t=i.style.height=`calc(${Math.abs(a-(o?.clientHeight||0))}px - ${e} - ${l})`,n?.after(i)},adjust:function(o,n,e){a=n.order.out?n.order.out.clientHeight:e((()=>{i?.remove(),o?.animate?.([{height:t},{height:`${o.clientHeight||0}px`}],{duration:n.trans?.dur?.[1]||n.trans?.dur||300,easing:"ease-in-out"})}))},size:function(i){i.style.width=`${i.clientWidth}px`,i.style.height=`${i.clientHeight}px`,i.style.position="absolute"}}
