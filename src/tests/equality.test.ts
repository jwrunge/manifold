import { expect, test } from "vitest";
import { isEqual } from "../equalityCheck";

const wildcards = {
	boolTrue: true,
	boolFalse: false,
	object: { name: "wildcard1" },
	string: "hello",
	number: 42,
	null: null,
	undefined: undefined,
	nan: NaN,
	func: () => "function",
	promise: new Promise((resolve) => resolve("promise")),
	date: new Date("2023-01-01T00:00:00Z"),
	map: new Map([
		["key1", "value1"],
		["key2", "value2"],
	]),
	set: new Set(["valueA", "valueB"]),
	url: new URL("https://example.com"),
	urlSearchParams: new URLSearchParams("param1=valueA&paramB=value2"),
	error: new Error("Test error!"),
	regexp: /test!/i,
	array: [1, 2, 3],
	nestedArray: [
		[1, 2],
		[3, 4],
	],
};

const runAllWildcardTests = (func: (val: any) => void, skip: string[] = []) => {
	for (const [key, value] of Object.entries(wildcards)) {
		if (skip.includes(key)) continue;
		func(value);
	}
};

test("Falsey equality tests", async () => {
	const falseyA = 0;
	const falseyB = "";
	const falseyC = null;
	const falseyD = undefined;
	const falseyE = NaN;
	const falseyF = false;
	const falseyA2 = 0;
	const falseyB2 = "";
	const falseyC2 = null;
	const falseyD2 = undefined;
	const falseyE2 = NaN;
	const falseyF2 = false;

	expect(isEqual(falseyA, falseyB)).toBe(false);
	expect(isEqual(falseyA, falseyC)).toBe(false);
	expect(isEqual(falseyA, falseyD)).toBe(false);
	expect(isEqual(falseyA, falseyE)).toBe(false);
	expect(isEqual(falseyA, falseyF)).toBe(false);
	expect(isEqual(falseyA, falseyA2)).toBe(true);
	expect(isEqual(falseyB, falseyB2)).toBe(true);
	expect(isEqual(falseyC, falseyC2)).toBe(true);
	expect(isEqual(falseyD, falseyD2)).toBe(true);
	expect(isEqual(falseyE, falseyE2)).toBe(false); // NaN is not equal to NaN
	expect(isEqual(falseyF, falseyF2)).toBe(true);
	for (const value of [
		falseyA,
		falseyB,
		falseyC,
		falseyD,
		falseyE,
		falseyF,
	]) {
		runAllWildcardTests(
			(val) => expect(isEqual(value, val)).toBe(false),
			["boolFalse", "null", "undefined"]
		);
	}
});

test("Bool equality tests", async () => {
	const boolA = true;
	const boolB = false;
	const boolC = true;
	expect(isEqual(boolA, boolB)).toBe(false);
	expect(isEqual(boolA, boolC)).toBe(true);
	runAllWildcardTests(
		(val) => expect(isEqual(boolA, val)).toBe(false),
		["boolTrue"]
	);
});

test("Number equality tests", async () => {
	const numA = 42;
	const numB = 42;
	const numC = 43;
	expect(isEqual(numA, numB)).toBe(true);
	expect(isEqual(numA, numC)).toBe(false);
	runAllWildcardTests(
		(val) => expect(isEqual(numA, val)).toBe(false),
		["number", "nan"]
	);
});

test("String equality tests", async () => {
	const strA = "hello";
	const strB = "hello";
	const strC = "world";
	expect(isEqual(strA, strB)).toBe(true);
	expect(isEqual(strA, strC)).toBe(false);
	runAllWildcardTests(
		(val) => expect(isEqual(strA, val)).toBe(false),
		["string"]
	);
});

test("object equality tests", async () => {
	const objA = { name: "test" };
	const objB = { name: "test" };
	const objC = { name: "different" };
	const objD = { name: "test", added: "new" };
	expect(isEqual(objA, objB)).toBe(true);
	expect(isEqual(objA, objC)).toBe(false);
	expect(isEqual(objA, objD)).toBe(false);
	runAllWildcardTests(
		(val) => expect(isEqual(objA, val)).toBe(false),
		["object"]
	);
});

test("Array equality tests", async () => {
	const arrA = [1, 2, 3];
	const arrB = [1, 2, 3];
	const arrC = [1, 2, 4];
	const arrD = [1, 2, 3, 4];
	expect(isEqual(arrA, arrB)).toBe(true);
	expect(isEqual(arrA, arrC)).toBe(false);
	expect(isEqual(arrA, arrD)).toBe(false);
	runAllWildcardTests(
		(val) => expect(isEqual(arrA, val)).toBe(false),
		["array"]
	);
});

test("Nested array equality tests", async () => {
	const nestedArrA = [
		[1, 2],
		[3, 4],
	];
	const nestedArrB = [
		[1, 2],
		[3, 4],
	];
	const nestedArrC = [
		[1, 2],
		[3, 5],
	];
	const nestedArrD = [[1, 2], [3, 4], [5]];
	expect(isEqual(nestedArrA, nestedArrB)).toBe(true);
	expect(isEqual(nestedArrA, nestedArrC)).toBe(false);
	expect(isEqual(nestedArrA, nestedArrD)).toBe(false);
	runAllWildcardTests(
		(val) => expect(isEqual(nestedArrA, val)).toBe(false),
		["nestedArray"]
	);
});

test("Date equality tests", async () => {
	const dateA = new Date("2023-01-01T00:00:00Z");
	const dateB = new Date("2023-01-01T00:00:00Z");
	const dateC = new Date("2023-01-02T00:00:00Z");
	expect(isEqual(dateA, dateB)).toBe(true);
	expect(isEqual(dateA, dateC)).toBe(false);
	runAllWildcardTests(
		(val) => expect(isEqual(dateA, val)).toBe(false),
		["date"]
	);
});

test("Map equality tests", async () => {
	const mapA = new Map([
		["key1", "value1"],
		["key2", "value2"],
	]);
	const mapB = new Map([
		["key1", "value1"],
		["key2", "value2"],
	]);
	const mapC = new Map([
		["key1", "value1"],
		["key2", "differentValue"],
	]);
	const mapD = new Map([["key1", "value1"]]);
	expect(isEqual(mapA, mapB)).toBe(true);
	expect(isEqual(mapA, mapC)).toBe(false);
	expect(isEqual(mapA, mapD)).toBe(false);
	runAllWildcardTests(
		(val) => expect(isEqual(mapA, val)).toBe(false),
		["map"]
	);
});

test("Set equality tests", async () => {
	const setA = new Set(["value1", "value2"]);
	const setB = new Set(["value1", "value2"]);
	const setC = new Set(["value1", "differentValue"]);
	const setD = new Set(["value1"]);
	expect(isEqual(setA, setB)).toBe(true);
	expect(isEqual(setA, setC)).toBe(false);
	expect(isEqual(setA, setD)).toBe(false);
	runAllWildcardTests((val) => expect(isEqual(setA, val)).toBe(false));
});

test("set of complex objects equality tests", async () => {
	const setA = new Set([
		{ id: 1, name: "item1" },
		{ id: 2, name: "item2" },
	]);
	const setB = new Set([
		{ id: 1, name: "item1" },
		{ id: 2, name: "item2" },
	]);
	const setC = new Set([
		{ id: 1, name: "item1" },
		{ id: 2, name: "differentItem" },
	]);
	const setD = new Set([{ id: 1, name: "item1" }]);
	expect(isEqual(setA, setB)).toBe(true);
	expect(isEqual(setA, setC)).toBe(false);
	expect(isEqual(setA, setD)).toBe(false);
	runAllWildcardTests((val) => expect(isEqual(setA, val)).toBe(false));
});

test("URL equality tests", async () => {
	const urlA = new URL("https://examples.com");
	const urlB = new URL("https://examples.com");
	const urlC = new URL("https://different.com");
	expect(isEqual(urlA, urlB)).toBe(true);
	expect(isEqual(urlA, urlC)).toBe(false);
	runAllWildcardTests((val) => expect(isEqual(urlA, val)).toBe(false));
});

test("URLSearchParams equality tests", async () => {
	const paramsA = new URLSearchParams("param1=value1&param2=value2");
	const paramsB = new URLSearchParams("param1=value1&param2=value2");
	const paramsC = new URLSearchParams("param1=value1&param2=different");
	expect(isEqual(paramsA, paramsB)).toBe(true);
	expect(isEqual(paramsA, paramsC)).toBe(false);
	runAllWildcardTests((val) => expect(isEqual(paramsA, val)).toBe(false));
});

test("Error equality tests", async () => {
	const errorA = new Error("Test error");
	const errorB = new Error("Test error");
	const errorC = new Error("Different error");
	expect(isEqual(errorA, errorB)).toBe(true);
	expect(isEqual(errorA, errorC)).toBe(false);
	runAllWildcardTests((val) => expect(isEqual(errorA, val)).toBe(false));
});

test("RegExp equality tests", async () => {
	const regexA = /test/i;
	const regexB = /test/i;
	const regexC = /different/i;
	expect(isEqual(regexA, regexB)).toBe(true);
	expect(isEqual(regexA, regexC)).toBe(false);
	runAllWildcardTests((val) => expect(isEqual(regexA, val)).toBe(false));
});

test("Function equality tests", async () => {
	const funcA = () => "test";
	const funcB = () => "test";
	const funcC = () => "different";
	expect(isEqual(funcA, funcB)).toBe(false); // Functions are not equal by ref
	expect(isEqual(funcA, funcC)).toBe(false);
	runAllWildcardTests(
		(val) => expect(isEqual(funcA, val)).toBe(false),
		["func"]
	);
});

test("Promise equality tests", async () => {
	const promiseA = Promise.resolve("test");
	const promiseB = Promise.resolve("test");
	const promiseC = Promise.resolve("different");
	expect(isEqual(promiseA, promiseB)).toBe(false); // Promises not equal by ref
	expect(isEqual(promiseA, promiseC)).toBe(false);
	runAllWildcardTests(
		(val) => expect(isEqual(promiseA, val)).toBe(false),
		["promise"]
	);
});

test("Class instance equality tests", async () => {
	class TestClass {
		constructor(public name: string) {}
	}
	class OtherClass {
		constructor(public name: string, public age?: number) {}
	}

	class YetAnotherClass {
		constructor(public name: string) {}
	}

	const instanceA = new TestClass("test");
	const instanceB = new TestClass("test");
	const instanceC = new TestClass("different");
	const instanceD = new OtherClass("test", 30);
	const instanceE = new OtherClass("test");
	const instanceF = new YetAnotherClass("test");

	expect(isEqual(instanceA, instanceB)).toBe(true);
	expect(isEqual(instanceA, instanceC)).toBe(false);
	expect(isEqual(instanceA, instanceD)).toBe(false);
	expect(isEqual(instanceA, instanceD)).toBe(false);
	expect(isEqual(instanceA, instanceE)).toBe(false);
	expect(isEqual(instanceD, instanceE)).toBe(false);
	expect(isEqual(instanceA, instanceF)).toBe(false); // These are essentially the same, but different classes
	runAllWildcardTests((val) => expect(isEqual(instanceA, val)).toBe(false));
});

test("Set of classes equality tests", async () => {
	class TestClass {
		constructor(public name: string) {}
	}

	const instanceA = new TestClass("test");
	const instanceB = new TestClass("test");
	const instanceC = new TestClass("different");

	expect(isEqual(new Set([instanceA]), new Set([instanceB]))).toBe(true);
	expect(isEqual(new Set([instanceA, instanceB]), new Set([instanceA]))).toBe(
		false
	);
	expect(isEqual(new Set([instanceA, instanceA]), new Set([instanceA]))).toBe(
		true
	);
	expect(isEqual(new Set([instanceA]), new Set([instanceC]))).toBe(false);
	runAllWildcardTests((val) =>
		expect(isEqual(new Set([instanceA, instanceB, instanceC]), val)).toBe(
			false
		)
	);
});

test("ArrayBuffer equality tests", async () => {
	const bufferA = new ArrayBuffer(8);
	const bufferB = new ArrayBuffer(8);
	const bufferC = new ArrayBuffer(16);
	expect(isEqual(bufferA, bufferB)).toBe(true);
	expect(isEqual(bufferA, bufferC)).toBe(false);
	runAllWildcardTests((val) => expect(isEqual(bufferA, val)).toBe(false));
});

test("DataView equality tests", async () => {
	const buffer = new ArrayBuffer(8);
	const viewA = new DataView(buffer);
	const viewB = new DataView(buffer);
	const viewC = new DataView(new ArrayBuffer(16));
	expect(isEqual(viewA, viewB)).toBe(true);
	expect(isEqual(viewA, viewC)).toBe(false);
	runAllWildcardTests((val) => expect(isEqual(viewA, val)).toBe(false));
});

test("TypedArray equality tests", async () => {
	const buffer = new ArrayBuffer(8);
	const int8ArrayA = new Int8Array(buffer);
	const int8ArrayB = new Int8Array(buffer);
	const int8ArrayC = new Int8Array(new ArrayBuffer(16));
	expect(isEqual(int8ArrayA, int8ArrayB)).toBe(true);
	expect(isEqual(int8ArrayA, int8ArrayC)).toBe(false);
	runAllWildcardTests((val) => expect(isEqual(int8ArrayA, val)).toBe(false));
});

test("Mixed TypedArray equality tests", async () => {
	const buffer = new ArrayBuffer(8);
	const buffer2 = new ArrayBuffer(16);

	const int8ArrayA = new Int8Array(buffer);
	const int16ArrayA = new Int16Array(buffer);
	const float32ArrayA = new Float32Array(buffer);

	const int8ArrayB = new Int8Array(buffer);
	const int16ArrayB = new Int16Array(buffer);
	const float32ArrayB = new Float32Array(buffer);

	const int8ArrayC = new Int8Array(buffer2);
	const int16ArrayC = new Int16Array(buffer2);
	const float32ArrayC = new Float32Array(buffer2);

	const uint8ArrayA = new Uint8Array(buffer);
	const uint8ArrayB = new Uint8Array(buffer);
	const uint8ArrayC = new Uint8Array(buffer2);

	expect(isEqual(int8ArrayA, int8ArrayB)).toBe(true);
	expect(isEqual(int16ArrayA, int16ArrayB)).toBe(true);
	expect(isEqual(float32ArrayA, float32ArrayB)).toBe(true);

	expect(isEqual(int8ArrayA, int16ArrayA)).toBe(true);
	expect(isEqual(int8ArrayA, float32ArrayA)).toBe(true);
	expect(isEqual(int16ArrayA, float32ArrayA)).toBe(true);

	expect(isEqual(int8ArrayA, int8ArrayC)).toBe(false);
	expect(isEqual(int16ArrayA, int16ArrayC)).toBe(false);
	expect(isEqual(float32ArrayA, float32ArrayC)).toBe(false);
	expect(isEqual(int8ArrayA, int16ArrayC)).toBe(false);

	expect(isEqual(uint8ArrayA, uint8ArrayB)).toBe(true);
	expect(isEqual(uint8ArrayA, uint8ArrayC)).toBe(false);
	expect(isEqual(uint8ArrayA, int8ArrayA)).toBe(true);
	expect(isEqual(uint8ArrayA, int16ArrayA)).toBe(true);

	runAllWildcardTests((val) => {
		expect(isEqual(int8ArrayA, val)).toBe(false);
		expect(isEqual(int16ArrayA, val)).toBe(false);
		expect(isEqual(float32ArrayA, val)).toBe(false);
		expect(isEqual(uint8ArrayA, val)).toBe(false);
	});
});

test("DataView, Uint8Array, ArrayBuffer, typed array intermixed equality tests", async () => {
	const buffer = new ArrayBuffer(8);
	const dataViewA = new DataView(buffer);
	const dataViewB = new DataView(buffer);
	const dataViewC = new DataView(new ArrayBuffer(16));
	const uint8ArrayA = new Uint8Array(buffer);
	const uint8ArrayB = new Uint8Array(buffer);
	const uint8ArrayC = new Uint8Array(new ArrayBuffer(16));
	const int8ArrayA = new Int8Array(buffer);
	const int8ArrayB = new Int8Array(buffer);
	const int8ArrayC = new Int8Array(new ArrayBuffer(16));

	expect(isEqual(dataViewA, dataViewB)).toBe(true);
	expect(isEqual(dataViewA, dataViewC)).toBe(false);
	expect(isEqual(uint8ArrayA, uint8ArrayB)).toBe(true);
	expect(isEqual(uint8ArrayA, uint8ArrayC)).toBe(false);
	expect(isEqual(dataViewA, uint8ArrayA)).toBe(true);
	expect(isEqual(dataViewA, uint8ArrayB)).toBe(true);
	expect(isEqual(dataViewA, uint8ArrayC)).toBe(false);
	expect(isEqual(uint8ArrayA, dataViewA)).toBe(true);

	expect(isEqual(int8ArrayA, int8ArrayB)).toBe(true);
	expect(isEqual(int8ArrayA, int8ArrayC)).toBe(false);
	expect(isEqual(int8ArrayA, uint8ArrayA)).toBe(true);
	expect(isEqual(int8ArrayA, uint8ArrayB)).toBe(true);
	expect(isEqual(int8ArrayA, dataViewA)).toBe(true);

	runAllWildcardTests((val) => {
		expect(isEqual(dataViewA, val)).toBe(false);
		expect(isEqual(uint8ArrayA, val)).toBe(false);
		expect(isEqual(buffer, val)).toBe(false);
	});
});
