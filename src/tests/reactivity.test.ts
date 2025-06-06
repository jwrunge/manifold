import { expect, test } from "vitest";
import { Store } from "../reactivity";

test("Test new store", async () => {
	const myStore = new Store(0);
	for (const i of [7, 9, 9, 23]) {
		myStore.value = i;
		expect(myStore.value).toBe(i);
	}
});

test("Test new store", async () => {
	const myStore = new Store({ name: "Jake", age: 37 });

	let trackedStoreValue: { name: string; age: number } | null = null;
	let trackedStoreName: string | null = null;
	let trackedStoreAge: number | null = null;

	let storeUpdateCount = 0;
	let nameUpdateCount = 0;
	let ageUpdateCount = 0;

	myStore.effect(() => {
		trackedStoreValue = myStore.value;
		storeUpdateCount++;
	});
	myStore.effect(() => {
		trackedStoreName = myStore.value.name;
		nameUpdateCount++;
	});
	myStore.effect(() => {
		trackedStoreAge = myStore.value.age;
		ageUpdateCount++;
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
		expect(trackedStoreValue).toEqual(i);
		expect(trackedStoreName).toBe(i.name);
		expect(trackedStoreAge).toBe(i.age);
	}

	myStore.value.age = 39;
	expect(myStore.value.age).toBe(39);
	expect(trackedStoreValue).toEqual({ name: "Mary", age: 39 });
	expect(trackedStoreName).toBe("Mary");
	expect(trackedStoreAge).toBe(39);

	expect(storeUpdateCount).toBe(5);
	expect(nameUpdateCount).toBe(5); // Should be 2 -- name only changes twice
	expect(ageUpdateCount).toBe(6);
});
