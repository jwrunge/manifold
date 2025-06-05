import { expect, test } from "vitest";
import { Store } from "./reactivity";

test("Test new store", async () => {
	const myStore = new Store(0);
	myStore.effect(() => {
		console.log("VALUE CHANGED TO ", myStore.value);
	});
	for (const i of [7, 9, 9, 23]) {
		myStore.value = i;
		expect(myStore.value).toBe(i);
	}
});

test("Test new store", async () => {
	const myStore = new Store({ name: "Jake", age: 37 });

	myStore.effect(() => {
		console.log("VALUE CHANGED TO ", myStore.value);
	});
	myStore.effect(() => {
		console.log("NAME CHANGED TO ", myStore.value.name);
	});
	myStore.effect(() => {
		console.log("AGE CHANGED TO ", myStore.value.age);
	});

	for (const i of [
		{ name: "Jake", age: 38 },
		{ name: "Jake", age: 39 },
		{ name: "Mary", age: 37 },
		{ name: "Mary", age: 37 },
		{ name: "Mary", age: 38 },
	]) {
		myStore.value = i;
		expect(myStore.value.name).toBe(i.name);
		expect(myStore.value.age).toBe(i.age);
	}

	myStore.value.age = 39;
	expect(myStore.value.age).toBe(39);
});
