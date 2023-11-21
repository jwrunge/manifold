import { Store } from "./store";

let store1 = await new Store(14);
let store2 = await new Store().init(
    ([Store1]: Array<number>)=> {
        return (Store1 || 0) * 2;
    },
    [store1]
)

console.log(store2.value);

await store1.update(20);

console.log(store2.value);
