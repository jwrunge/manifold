import $ from "../src/index.ts";
import { State } from "../src/State.ts";

document.addEventListener("DOMContentLoaded", () => {
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

	$.input("chickens-input", () => ({
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

	$.button("chickens-bulk", () => {
		return {
			onclick: (e) => {
				e.preventDefault();
				chickenStore.value += 10;
			},
		};
	});

	let specialMessage = $.watch("");

	let chxArray = $.watch(() => {
		const count = chickenStore.value > 0 ? chickenStore.value : 0;
		const array = new Array(count).fill("BOK");

		// Apply special message if it exists and index 5 is within bounds
		if (specialMessage.value && array.length > 5) {
			array[5] = specialMessage.value;
		}

		return array;
	});

	$.element("chicken-5", () => ({
		innerHTML: chxArray.value[5] ?? "nothing at all!",
	}));

	$.each("chicken-button-list", chxArray);
	$.if("is-even", new State(() => chickenStore.value % 2 === 0));
	$.if("is-3", new State(() => chickenStore.value === 3));
	$.if("is-5", new State(() => chickenStore.value === 5));

	setTimeout(() => {
		specialMessage.value = "BOGOCK!!!";
	}, 5_000);

	setTimeout(() => {
		// Cannot mutate derived state directly - modify the underlying state instead
		// chxArray.value[6] = "BROOOOCK!!!"; // This won't work with derived state
		specialMessage.value = "BROOOOCK!!!";
	}, 10_000);

	setTimeout(() => {
		// Cannot mutate derived state directly - modify the underlying state instead
		// chxArray.value.push("BOGOCK!!!"); // This won't work with derived state
		chickenStore.value += 1; // This will trigger the derived state to update
	}, 7_000);
});
