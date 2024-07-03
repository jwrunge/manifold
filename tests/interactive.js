import { $st, store, component } from "../dist/dev.manifold.js";
// Mfld.makeComponent("test-component", {
//     onconnect() {
//         console.log("THIS", this)
//     }
// });

store.make("store1", "My text");
component.register("new-component", "/tests/mycomponent.html");

// function sendAlert(val) {
//     alert("VALUE IS " + val)
//     return val
// }
// function isChecked(val) {
//     if(val == "We're at 4k") return true;
//     else return false;
// }

// function specialStyling(val, el) {
//     console.log(val, el)
//     if(val == "My text") {
//     el.innerHTML = "My text";
//     el.style = "background: blue; height: 5rem; width: 90vw; width: 12rem;";
//     }
//     else if(val == "<span class='colorful'>Another update</span>") {
//     el.style = "background: green; height: 15rem; border-radius: 10px; width: 10rem;"
//     }
//     else if(val == "We're at 4k") {
//     el.innerHTML = "We're at 4k!!!";
//     el.style = "background: orange; height: 8rem; border-radius: 10px; width: 20rem;"
//     }
//     else if(val == "Last one") {
//     el.innerHTML = "All done!"
//     el.style = "background: red; height: 10rem; border-radius: 10px; width: 15rem; font-size: 2rem;"
//     }
//     else if(val == true) {
//     el.innerHTML = "Ooooh, good times!"
//     el.style = "background: green; height: 25rem; border-radius: 10px; width: 25rem; font-size: 2.5rem;"
//     }
//     else {
//     el.innerHTML = ""
//     el.style = "background: gray; height: 5rem; border-radius: 10px; width: 5rem; font-size: 2.5rem;"
//     }
// }

// Mfld.funcs({sendAlert, isChecked, specialStyling});

// console.log("Manifold", Mfld);

// Mfld.config({
//     trans: {
//         // smartTransition: true,
//         // dur: 500,
//         // swap: 1000
//     },
//     fetch: {
//         externals: [
//             { domain: "http://localhost", script: "all", style: "none" }
//         ]
//     }
// });

// Mfld.register(document.body);

// let val = Mfld.store("value", "OK")

// let store1 = Mfld.store("store1", "My text");

// const store3 = Mfld.store("store3", { value: "one" });
// const store2 = Mfld.store("store2", ()=> $st.store1?.toUpperCase());
// const store4 = Mfld.store("store4", {
//     value: 1,
//     updater: ()=> {
//         let val;
//         switch($st.store2.values?.[0]) {
//             case "one": val = 1; break;
//             case "two": val = 2; break;
//             case "three": val = 3; break;
//             case "four": val = 4; break;
//             case "five": val = 5; break;
//             default: val = 0;
//         }
//         return val;
//     }
// });

// const DESCENDANT = Mfld.store("descendant", {
//     updater: (stores)=> {
//         return `"VALUE OF STORE 3: ${$st.store3}"`;
//     }
// })

// // Sequence test - Even though later stores depend on multiple earlier stores, updates to the earlier stores SHOULD NOT result in multiple updates to the later stores
// for(let i=0; i<5; i++) {
//     Mfld.store(`mass_store${i}`, { 
//         upstream: Array.from({length: i - 1 > 0 ? i - 1 : 0}).map((_, idx)=> `mass_store${idx}`),
//         updater: (stores)=> {
//             let sum = 0;
//             stores.forEach(s=> sum += (s || 0));
//             console.log("UPDATING MASS STORE", i, sum);
//             return sum;
//         }
//     });
// }

// // Large test
// for(let i=0; i<1000; i++) {
//     Mfld.store(`mass_store${i}`, { 
//         upstream: [ `mass_store${i - 1}` ],
//         updater: ([Previous])=> {
//             return Previous * 2;
//         }
//     });
// }

// // Load test
// for(let i=0; i<100_000; i++) {
//     Mfld.store(`mass_store${i}`, { 
//         upstream: [ `mass_store${i - 1}` ],
//         updater: ([Previous])=> {
//             return Previous * 2;
//         }
//     });
// }

// // Intensity test
// for(let i=0; i<1_000; i++) {
//     Mfld.store(`mass_store${i}`, { 
//         upstream: Array.from({length: i - 1 > 0 ? i - 1 : 0}).map((_, idx)=> `mass_store${idx}`),
//         updater: (stores)=> {
//             let sum = 0;
//             stores.forEach(s=> sum += (s || 0));
//             return sum;
//         }
//     });
// }

// Mfld.get("mass_store0").update(0);
// Mfld.get("mass_store99").sub(val=> console.log("VALUE OF MASS STORE 99", val), "testLog");
// setTimeout(()=> {
//     Mfld.get("mass_store0").update(5);
// }, 2000)
// setTimeout(()=> {
//     Mfld.get("mass_store0").update(15);
// }, 4000)
// setTimeout(()=> {
//     Mfld.get("mass_store0").update(25);
// }, 6000)
// setTimeout(()=> {
//     Mfld.get("mass_store0").update(35);
// }, 7000)
// setTimeout(()=> {
//     Mfld.get("mass_store0").update(105);
// }, 8000)
// setTimeout(()=> {
//     Mfld.get("mass_store0").update(205);
// }, 9000)
// setTimeout(()=> {
//     Mfld.get("mass_store0").update(305);
// }, 10_000)

// setTimeout(()=> {
//     store1.update("two")
// }, 1000)
// setTimeout(()=> {
//     store1.update("three")
// }, 3000)
// setTimeout(()=> {
//     store3.update("four")
// }, 9000)
// setTimeout(()=> {
//     store3.update("five")
// }, 15000)

// setTimeout(()=> {
//     Mfld.get("store1").update("<span class='colorful'>Another update</span>")
// }, 4000)
// setTimeout(()=> {
//     Mfld.get("store1").update("We're at 4k")
// }, 8000)
// setTimeout(()=> {
//     Mfld.get("store1").update("Last one")
// }, 12000)

// setTimeout(()=> {
//     Mfld.get("store1").update("FINAL");
//     store2.update({ values: ["final", "final"] });
//     store3.update("final");
//     store4.update(1000)
// }, 16000)

