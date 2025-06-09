import $ from "./index";

$.div("#mydiv", () => ({
	class: { one: "ONE", two: "TWO" },
	style: { color: "red", fontSize: "16px", cow: "YES" },
	textContent: "Hello, World!",
}));

const myStore = $.watch(() => 3);
