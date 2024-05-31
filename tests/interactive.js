/// <reference path="../dist/Mfld.js" />

console.log("Manifold", Mfld);

Mfld.config({
    trans: {
        hooks: {
            "in-end": (el)=> {

            },
            "in-start": (el)=> el
        }
    }
}, "file1")

Mfld.register(document.body);

let val = Mfld.store("value", {
    value: /** @type {Map<number, string>}*/(new Map()),
    upstream: ["store1", "store2"],
    updater: (_, val)=> val?.set?.(32, (val?.get(32) || "") + "...") || new Map()
})
let s1 = Mfld.store("store1", { value: "My text" });

// let store1 = Mfld.store("store1", { value: "My text" });
const store3 = Mfld.store("store3", { value: "one" });
const store2 = Mfld.store("store2", { 
    value: { values: ["one", "two"]},
    upstream: ["store1", "store3"],
    updater: async ([Store1, Store3], Mfldr)=> {
        Mfldr.values[1] = Store1;
        Mfldr.values[0] = Store3;
        return Mfldr;
    }
});
const store4 = Mfld.store("store4", {
    value: 1,
    upstream: ["store2"],
    updater: ([Store2])=> {
        let val;
        switch(Store2.values[0]) {
            case "one": val = 1; break;
            case "two": val = 2; break;
            case "three": val = 3; break;
            case "four": val = 4; break;
            case "five": val = 5; break;
            default: val = 0;
        }
        return val;
    }
});

const DESCENDANT = Mfld.store("descendant", {
    upstream: ["store3"],
    updater: ([Store3])=> {
        console.log("UPDATING DESCENDANT", Store3)
        return `"VALUE OF STORE 3: ${Store3}"`;
    }
})

setTimeout(()=> {
    store3.update("two")
}, 1000)
setTimeout(()=> {
    store3.update("three")
}, 3000)
setTimeout(()=> {
    store3.update("four")
}, 9000)
setTimeout(()=> {
    store3.update("five")
}, 15000)

setTimeout(()=> {
    Mfld.get("store1").update("<span class='colorful'>Another update</span>")
}, 4000)
setTimeout(()=> {
    Mfld.get("store1").update("We're at 4k")
}, 8000)
setTimeout(()=> {
    Mfld.get("store1").update("Last one")
}, 12000)

setTimeout(()=> {
    Mfld.get("store1").update("FINAL");
    store2.update({ values: ["final", "final"] });
    store3.update("final");
    store4.update(1000)
}, 16000)

function specialStyling(val, el) {
    if(val == "My text") {
    el.innerHTML = "My text";
    el.style = "background: blue; height: 5rem; width: 90vw; width: 12rem;";
    }
    else if(val == "<span class='colorful'>Another update</span>") {
    el.style = "background: green; height: 15rem; border-radius: 10px; width: 10rem;"
    }
    else if(val == "We're at 4k") {
    el.innerHTML = "We're at 4k!!!";
    el.style = "background: orange; height: 8rem; border-radius: 10px; width: 20rem;"
    }
    else if(val == "Last one") {
    el.innerHTML = "All done!"
    el.style = "background: red; height: 10rem; border-radius: 10px; width: 15rem; font-size: 2rem;"
    }
    else if(val == true) {
    el.innerHTML = "Ooooh, good times!"
    el.style = "background: green; height: 25rem; border-radius: 10px; width: 25rem; font-size: 2.5rem;"
    }
    else {
    el.innerHTML = ""
    el.style = "background: gray; height: 5rem; border-radius: 10px; width: 5rem; font-size: 2.5rem;"
    }
}

function isChecked(val, el) {
    if(val == "We're at 4k") return true;
    else return false;
}

function showDiv(val) {
    return val == "We're at 4k";
}

function syncChecked(store1, store2) {
    // console.log("SYNCING CHECKED")
    // console.log("STORE 1 VAL", store1);
    // console.log("STORE 2 VAL", store2);
    // if(store1 === false) return "We're at 4k";
    // Mfld.store("store1").update(store1 === false ? "We're at 4k" : store1);
}

Mfld.funcs({"isChecked": isChecked});
