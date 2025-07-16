import { expect, test } from "vitest";
import $ from "../index";

test("array reactivity", async () => {
	const myArray = $.watch(["hello", "world"]);
	let effectRuns = 0;
	let lastValue: string[] = [];

	myArray.effect(() => {
		effectRuns++;
		lastValue = [...myArray.value];
		console.log("Effect run:", effectRuns, lastValue);
	});

	expect(effectRuns).toBe(1);
	expect(lastValue).toEqual(["hello", "world"]);

	// Test modifying an array element
	myArray.value[0] = "modified";
	expect(effectRuns).toBe(2);
	expect(lastValue).toEqual(["modified", "world"]);
	expect(myArray.value).toEqual(["modified", "world"]);

	// Test adding an element
	myArray.value.push("new");
	expect(effectRuns).toBe(3);
	expect(lastValue).toEqual(["modified", "world", "new"]);
});
