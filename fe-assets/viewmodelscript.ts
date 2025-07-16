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

setTimeout(() => {
	myStore.value = 36;
}, 1000);

setTimeout(() => {
	myStore.value = 37;

	setInterval(() => {
		myStore.value++;
	}, 3000);
}, 3000);

$.input("#chickens-input", () => ({
	value: chickenStore.value.toString(),
	onchange: (e) => {
		const value = +e.currentTarget.value;
		chickenStore.value = value > 0 ? value : 0;
	},
	type: "number",
	style: {
		border: `3px solid rgb(${chickenStore.value},0,0)`,
	},
	class: ["chicken-input", "input", `value-${chickenStore.value}`],
}));

$.button("#chickens-bulk", () => {
	return {
		onclick: (e) => {
			e.preventDefault();
			chickenStore.value += 10;
		},
	};
});

let chxArray = $.watch(() => {
	return new Array(chickenStore.value > 0 ? chickenStore.value : 0).fill(
		"BOK"
	);
});

$.each("#chicken-button-list", () => chxArray.value);

setTimeout(() => {
	chxArray.value[5] = "BOGOCK!!!";
	console.log("CHICKEN ARRAY", chxArray.value);
}, 5_000);
