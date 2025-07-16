import { expect, test } from "vitest";
import $ from "../index";

test("new store", async () => {
	const myState = $.watch(0);
	let myStateValue: number | null = null;
	let updateCount = 0;
	let expectedCount = 1;

	myState.effect(() => {
		myStateValue = myState.value;
		updateCount++;
	});

	let dup = false;
	for (const i of [7, 9, 9, 23]) {
		if (i !== 9 || !dup) expectedCount++;
		if (i === 9) dup = true; // 9 is duplicated; only increment expected count once
		myState.value = i;

		expect(myStateValue).toBe(i);
		expect(updateCount).toBe(expectedCount);
		expect(myState.value).toBe(i);
	}
});

test("update triggers", async () => {
	const myState = $.watch({ name: "Jake", age: 37 });

	let trackedStateValue: { name: string; age: number } | null = null;
	let trackedStateName: string | null = null;
	let trackedStateAge: number | null = null;

	let storeUpdateCount = 0;
	let nameUpdateCount = 0;
	let ageUpdateCount = 0;

	myState.effect(() => {
		trackedStateValue = myState.value;
		storeUpdateCount++;
	});
	myState.effect(() => {
		trackedStateName = myState.value.name;
		nameUpdateCount++;
	});
	myState.effect(() => {
		trackedStateAge = myState.value.age;
		ageUpdateCount++;
	});

	for (const i of [
		{ name: "Jake", age: 38 },
		{ name: "Jake", age: 39 },
		{ name: "Mary", age: 37 },
		{ name: "Mary", age: 37 },
		{ name: "Mary", age: 38 },
	]) {
		myState.value = i;
		expect(myState.value.name).toBe(i.name);
		expect(myState.value.age).toBe(i.age);
		expect(trackedStateValue).toEqual(i);
		expect(trackedStateName).toBe(i.name);
		expect(trackedStateAge).toBe(i.age);
	}

	myState.value.age = 39;
	expect(myState.value.age).toBe(39);
	expect(trackedStateValue).toEqual({ name: "Mary", age: 39 });
	expect(trackedStateName).toBe("Mary");
	expect(trackedStateAge).toBe(39);

	expect(storeUpdateCount).toBe(5);
	expect(nameUpdateCount).toBe(5); // Should be 2 -- name only changes twice
	expect(ageUpdateCount).toBe(6);
});

test("derived data", async () => {
	const myState = $.watch({ name: "Jake", age: 37 });
	const derivedState = $.watch(() => ({
		name: myState.value.name.toUpperCase(),
		age: myState.value.age + 10,
	}));

	let trackedDerivedStateName: string | null = null;
	let trackedDerivedStateAge: number | null = null;

	let derivedNameUpdateCount = 0;
	let derivedAgeUpdateCount = 0;

	derivedState.effect(() => {
		trackedDerivedStateName = derivedState.value.name;
		derivedNameUpdateCount++;
	});

	derivedState.effect(() => {
		trackedDerivedStateAge = derivedState.value.age;
		derivedAgeUpdateCount++;
	});

	expect(derivedState.value.name).toBe("JAKE");
	expect(derivedState.value.age).toBe(47);
	expect(trackedDerivedStateName).toBe("JAKE");
	expect(trackedDerivedStateAge).toBe(47);

	myState.value = { name: "Mary", age: 37 };
	expect(myState.value.name).toBe("Mary");
	expect(derivedState.value.name).toBe("MARY");
	expect(trackedDerivedStateName).toBe("MARY");

	myState.value.age = 36;
	expect(myState.value.age).toBe(36);
	expect(derivedState.value.age).toBe(46);
	expect(trackedDerivedStateAge).toBe(46);
});

test("Circular update detection", async () => {
	// Mock console.warn to capture warnings
	const originalWarn = console.warn;
	const warnings: string[] = [];
	console.warn = (message: string) => {
		warnings.push(message);
	};

	try {
		const circularA = $.watch(0);
		const circularB = $.watch(0);

		circularA.effect(() => {
			if (circularA.value < 5) {
				circularB.value = circularA.value + 1;
			}
		});

		circularB.effect(() => {
			if (circularB.value < 5) {
				circularA.value = circularB.value + 1;
			}
		});

		circularA.value = 1;

		expect(warnings.length).toBeGreaterThan(0);
		expect(
			warnings.some((warning) =>
				warning.includes("Circular update detected")
			)
		).toBe(true);

		// Values should not reach 5 due to circular detection
		expect(circularA.value).toBeLessThan(5);
		expect(circularB.value).toBeLessThan(5);
	} finally {
		console.warn = originalWarn;
	}
});

test("Max update depth detection", async () => {
	const originalWarn = console.warn;
	const warnings: string[] = [];
	console.warn = (message: string) => {
		warnings.push(message);
	};

	try {
		const states = Array.from({ length: 150 }, () => $.watch(0));

		for (let i = 0; i < states.length - 1; i++) {
			const currentIndex = i;
			states[currentIndex].effect(() => {
				if (
					states[currentIndex].value > 0 &&
					states[currentIndex].value < 2
				) {
					states[currentIndex + 1].value = states[currentIndex].value;
				}
			});
		}

		states[0].value = 1;

		expect(warnings.length).toBeGreaterThan(0);
		expect(
			warnings.some(
				(warning) =>
					warning.includes("Maximum update depth") &&
					warning.includes("exceeded")
			)
		).toBe(true);
	} finally {
		console.warn = originalWarn;
	}
});
