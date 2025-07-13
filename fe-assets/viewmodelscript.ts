import $ from "../src/index.ts";
import { viewmodel } from "../src/viewmodel.ts";
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

// viewmodel("input", "#chickens-input", () => ({
// 	value: chickenStore.value.toString(),
// 	onchange: (e) => {
// 		const value = +e.target.value;
// 		chickenStore.value = value > 0 ? value : 0;
// 	},
// 	cow: "MOO",
// 	style: {
// 		border: `3px solid rgb(${chickenStore.value},0,0)`,
// 		chicken: "BOK",
// 	},
// 	class: ["chicken-input", "input", `value-${chickenStore.value}`],
// }));

$.input("#chickens-input", () => ({
	value: chickenStore.value.toString(),
	onchange: (e) => {
		const value = +e.target.value;
		chickenStore.value = value > 0 ? value : 0;
	},
	cow: "MOO",
	style: {
		border: `3px solid rgb(${chickenStore.value},0,0)`,
		chicken: "BOK",
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

let chxArray = $.watch(new Array(5).fill("BOK"));
chickenStore.effect(() => {
	console.log("Updating chxArray based on chickenStore");
	while (chxArray.value.length < chickenStore.value) {
		chxArray.value.push("BOK");
	}
	while (chxArray.value.length > chickenStore.value) {
		chxArray.value.pop();
	}
	console.log(chxArray.value);
});

$.each("#chicken-button-list", () => chxArray.value);

$.span("#chicken-5", () => ({
	innerText: chxArray.value[5] ?? "No chicken here",
}));

setTimeout(() => {
	console.log("Updating chxArray");
	chickenStore.value = 6;
}, 5_000);

setTimeout(() => {
	console.log("Updating chxArray 5");
	chxArray.value[5] = "BAGOCK!!!";
}, 7_000);

window.logChxFive = () => {
	const chxFive = document.querySelector("#chicken-5");
	if (chxFive) {
		console.log("CHICKEN 5 SAYS:", chxFive.textContent);
	} else {
		console.error("CHICKEN 5 NOT FOUND");
	}

	console.log("CHXARRAY 5:", chxArray.value[5]);
};
