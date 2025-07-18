import { expect, test } from "vitest";
import { isEqual } from "../equality";
import { State } from "../State";

test("primitive equality", () => {
	expect(isEqual(1, 1)).toBe(true);
	expect(isEqual(1, 2)).toBe(false);
	expect(isEqual("hello", "hello")).toBe(true);
	expect(isEqual("hello", "world")).toBe(false);
	expect(isEqual(true, true)).toBe(true);
	expect(isEqual(true, false)).toBe(false);
	expect(isEqual(null, null)).toBe(true);
	expect(isEqual(undefined, undefined)).toBe(true);
	expect(isEqual(null, undefined)).toBe(false);
});

test("object equality", () => {
	expect(isEqual({}, {})).toBe(true);
	expect(isEqual({ a: 1 }, { a: 1 })).toBe(true);
	expect(isEqual({ a: 1 }, { a: 2 })).toBe(false);
	expect(isEqual({ a: 1, b: 2 }, { a: 1, b: 2 })).toBe(true);
	expect(isEqual({ a: 1, b: 2 }, { b: 2, a: 1 })).toBe(true);
	expect(isEqual({ a: 1 }, { a: 1, b: 2 })).toBe(false);
});

test("nested object equality", () => {
	const obj1 = { a: { b: { c: 1 } } };
	const obj2 = { a: { b: { c: 1 } } };
	const obj3 = { a: { b: { c: 2 } } };

	expect(isEqual(obj1, obj2)).toBe(true);
	expect(isEqual(obj1, obj3)).toBe(false);
});

test("array equality", () => {
	expect(isEqual([], [])).toBe(true);
	expect(isEqual([1, 2, 3], [1, 2, 3])).toBe(true);
	expect(isEqual([1, 2, 3], [1, 2, 4])).toBe(false);
	expect(isEqual([1, 2, 3], [1, 2])).toBe(false);
});

test("mixed type equality", () => {
	expect(isEqual({ a: [1, 2] }, { a: [1, 2] })).toBe(true);
	expect(isEqual({ a: [1, 2] }, { a: [1, 3] })).toBe(false);
	expect(isEqual([{ a: 1 }, { b: 2 }], [{ a: 1 }, { b: 2 }])).toBe(true);
	expect(isEqual([{ a: 1 }, { b: 2 }], [{ a: 2 }, { b: 2 }])).toBe(false);
});

test("Map and Set equality", () => {
	const map1 = new Map([
		["a", 1],
		["b", 2],
	]);
	const map2 = new Map([
		["a", 1],
		["b", 2],
	]);
	const map3 = new Map([
		["a", 1],
		["b", 3],
	]);

	expect(isEqual(map1, map2)).toBe(true);
	expect(isEqual(map1, map3)).toBe(false);

	const set1 = new Set([1, 2, 3]);
	const set2 = new Set([1, 2, 3]);
	const set3 = new Set([1, 2, 4]);

	expect(isEqual(set1, set2)).toBe(true);
	expect(isEqual(set1, set3)).toBe(false);
});

test("Date equality", () => {
	const date1 = new Date("2023-01-01");
	const date2 = new Date("2023-01-01");
	const date3 = new Date("2023-01-02");

	expect(isEqual(date1, date2)).toBe(true);
	expect(isEqual(date1, date3)).toBe(false);
});

test("equality prevents unnecessary updates", () => {
	const state = new State({ count: 0, name: "test" });
	let updateCount = 0;

	state.effect(() => {
		state.value; // Access the value to create dependency
		updateCount++;
	});

	expect(updateCount).toBe(1);

	// Setting to same value should not trigger update
	state.value = { count: 0, name: "test" };
	expect(updateCount).toBe(1);

	// Setting to different value should trigger update
	state.value = { count: 1, name: "test" };
	expect(updateCount).toBe(2);

	// Setting to same value again should not trigger update
	state.value = { count: 1, name: "test" };
	expect(updateCount).toBe(2);
});

test("complex object equality prevents unnecessary updates", () => {
	const complexObject = {
		users: new Map([
			[
				"user1",
				{ name: "Alice", metadata: { scores: new Set([100, 200]) } },
			],
		]),
		settings: { theme: "dark", notifications: true },
	};

	const state = new State(complexObject);
	let updateCount = 0;

	state.effect(() => {
		state.value; // Access the value to create dependency
		updateCount++;
	});

	expect(updateCount).toBe(1);

	// Setting to equivalent object should not trigger update
	const equivalentObject = {
		users: new Map([
			[
				"user1",
				{ name: "Alice", metadata: { scores: new Set([100, 200]) } },
			],
		]),
		settings: { theme: "dark", notifications: true },
	};

	state.value = equivalentObject;
	expect(updateCount).toBe(1); // Should not increase

	// Setting to different object should trigger update
	const differentObject = {
		users: new Map([
			[
				"user1",
				{ name: "Bob", metadata: { scores: new Set([100, 200]) } },
			],
		]),
		settings: { theme: "dark", notifications: true },
	};

	state.value = differentObject;
	expect(updateCount).toBe(2); // Should increase
});
