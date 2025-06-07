import { expect, test } from "vitest";
import { Store } from "../reactivity";

test("new store", async () => {
	const myStore = new Store(0);
	let myStoreValue: number | null = null;
	let updateCount = 0;
	let expectedCount = 1;

	myStore.effect(() => {
		myStoreValue = myStore.value;
		updateCount++;
	});

	let dup = false;
	for (const i of [7, 9, 9, 23]) {
		if (i !== 9 || !dup) expectedCount++;
		if (i === 9) dup = true; // 9 is duplicated; only increment expected count once
		myStore.value = i;

		expect(myStoreValue).toBe(i);
		expect(updateCount).toBe(expectedCount);
		expect(myStore.value).toBe(i);
	}
});

test("update triggers", async () => {
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

test("derived data", async () => {
	const myStore = new Store({ name: "Jake", age: 37 });
	const derivedStore = new Store(() => ({
		name: myStore.value.name.toUpperCase(),
		age: myStore.value.age + 10,
	}));

	let trackedDerivedStoreName: string | null = null;
	let trackedDerivedStoreAge: number | null = null;

	let derivedNameUpdateCount = 0;
	let derivedAgeUpdateCount = 0;

	derivedStore.effect(() => {
		trackedDerivedStoreName = derivedStore.value.name;
		derivedNameUpdateCount++;
	});

	derivedStore.effect(() => {
		trackedDerivedStoreAge = derivedStore.value.age;
		derivedAgeUpdateCount++;
	});

	expect(derivedStore.value.name).toBe("JAKE");
	expect(derivedStore.value.age).toBe(47);
	expect(trackedDerivedStoreName).toBe("JAKE");
	expect(trackedDerivedStoreAge).toBe(47);

	myStore.value = { name: "Mary", age: 37 };
	expect(myStore.value.name).toBe("Mary");
	expect(derivedStore.value.name).toBe("MARY");
	expect(trackedDerivedStoreName).toBe("MARY");

	myStore.value.age = 36;
	expect(myStore.value.age).toBe(36);
	expect(derivedStore.value.age).toBe(46);
	expect(trackedDerivedStoreAge).toBe(46);
});
