import { expect, test } from "vitest";
import { State } from "../State";

test("debug exact trigger sequence", () => {
	const state = new State({
		user: {
			profile: {
				name: "Alice",
			},
		},
	});

	let triggerCount = 0;
	let triggerDetails: string[] = [];

	// Track profile with detailed logging
	state.effect(() => {
		// Access profile
		const profile = state.value.user.profile;
		triggerCount++;
		triggerDetails.push(
			`Trigger ${triggerCount}: Accessed profile, got: ${JSON.stringify(
				profile
			)}`
		);

		// But DON'T access profile.name to avoid tracking on the profile object
		// Only track the profile property itself
	});

	console.log("Initial state:", triggerDetails);

	// Change profile
	console.log("\nSetting user.profile = { name: 'Bob' }...");
	state.value.user.profile = { name: "Bob" };

	console.log("Final trigger details:", triggerDetails);
	console.log("Total triggers:", triggerCount);

	// Should only trigger once for the profile change
	expect(triggerCount).toBe(2);
});
