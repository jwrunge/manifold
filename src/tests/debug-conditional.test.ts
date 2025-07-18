import { expect, test } from "vitest";
import { State } from "../State";

test("debug conditional access", () => {
	const state = new State({
		user: {
			profile: {
				name: "Alice",
			},
		},
	});

	let effectCount = 0;
	let shouldAccessName = true;

	// Track profile
	state.effect(() => {
		const profile = state.value.user.profile;
		effectCount++;
		console.log(`Effect ${effectCount}: profile =`, profile);

		// Only access profile.name on the first run
		if (shouldAccessName) {
			console.log(`Effect ${effectCount}: profile.name =`, profile.name);
		}
	});

	console.log("Initial effect count:", effectCount);

	// Disable name access for subsequent runs
	shouldAccessName = false;

	// Change just the profile object
	console.log("\nSetting user.profile = { name: 'Bob' }...");
	state.value.user.profile = { name: "Bob" };

	console.log("Final effect count:", effectCount);

	// Should only trigger twice: initial + profile change
	expect(effectCount).toBe(2);
});
