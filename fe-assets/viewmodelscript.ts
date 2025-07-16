import $ from "../src/index.ts";

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

	let chxArray = $.watch(
		new Array(chickenStore.value > 0 ? chickenStore.value : 0).fill("BOK")
	);

	let lastChickenCount = chickenStore.value;
	chickenStore.effect(() => {
		const newCount = chickenStore.value;
		const currentLength = chxArray.value.length;

		if (newCount > currentLength) {
			for (let i = currentLength; i < newCount; i++) {
				chxArray.value.push("BOK");
			}
		} else if (newCount < currentLength) {
			chxArray.value.splice(newCount);
		}

		lastChickenCount = newCount;
	});

	$.each("#chicken-button-list", () => chxArray);

	setTimeout(() => {
		chxArray.value[5] = "BOGOCK!!!";
	}, 5_000);
});
