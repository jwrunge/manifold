import $ from "./main.ts";

const { store, fn } = $.create()
	.addState("count", 0)
	.addState("name", "MyApp")
	.addFunc("increment", (by: number) => {
		store.count += by;
	})
	.build();

console.log(store.count);
fn.increment(5);
console.log(store.count);
