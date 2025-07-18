import { expect, test } from "vitest";
import { State } from "../State";

test("debug cascade effects", () => {
	const state = new State({
		user: {
			profile: {
				name: "Alice",
			},
		},
	});

	let effectCount = 0;

	// Track profile
	state.effect(() => {
		const profile = state.value.user.profile;
		effectCount++;
		console.log(`Effect ${effectCount}: profile =`, profile);
		console.log(`Effect ${effectCount}: profile.name =`, profile.name);
	});

	console.log("Initial effect count:", effectCount);

	// Change just the profile object
	console.log("\nSetting user.profile = { name: 'Bob' }...");
	state.value.user.profile = { name: "Bob" };

	console.log("Final effect count:", effectCount);

	// Should only trigger once for the profile change
	expect(effectCount).toBe(2);
});
