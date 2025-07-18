import { expect, test } from "vitest";
import { State } from "../State";

test("debug with detailed logging", () => {
	const state = new State({
		user: {
			profile: {
				name: "Alice",
			},
		},
	});

	let triggerCount = 0;
	let triggerSequence: string[] = [];

	// Track profile with detailed logging
	state.effect(() => {
		triggerCount++;
		triggerSequence.push(`Effect run ${triggerCount}`);
		console.log(`Effect run ${triggerCount}: starting`);

		const profile = state.value.user.profile;
		console.log(`Effect run ${triggerCount}: got profile =`, profile);
	});

	console.log("Initial triggers:", triggerSequence);

	// Change profile
	console.log("\nSetting user.profile = { name: 'Bob' }...");
	state.value.user.profile = { name: "Bob" };

	console.log("Final triggers:", triggerSequence);
	console.log("Total effect runs:", triggerCount);

	// Should only run twice: initial + after change
	expect(triggerCount).toBe(2);
});
