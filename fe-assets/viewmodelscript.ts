import $ from "../src/index.ts";
let myStore = $.watch(32);
let chickenStore = $.watch(0);
let myStore2 = $.watch(() => {
	return {
		name: "Jake",
		age: myStore.value,
		chickens: chickenStore.value,
	};
});

myStore.effect(() => {
	console.log("myStore changed:", myStore.value);
});
myStore2.effect(() => {
	console.log("myStore2 changed:", myStore2.value);
});

setTimeout(() => {
	myStore.value = 36;
}, 1000);

setTimeout(() => {
	myStore.value = 37;

	setInterval(() => {
		myStore.value++;
	}, 3000);
}, 3000);

const chickenInput = $.input("#chickens-input", () => {
	return {
		value: chickenStore.value.toString(),
		onchange: (e) => {
			chickenStore.value = +e.target!.value;
		},
		style: {
			border: `3px solid rgb(${chickenStore.value},0,0)`,
		},
	};
});

$.button("#chickens-bulk", () => {
	return {
		onclick: (e) => {
			e.preventDefault();
			chickenStore.value += 10;
		},
	};
});
