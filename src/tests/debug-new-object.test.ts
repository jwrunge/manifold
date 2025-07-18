import { expect, test } from "vitest";
import { State } from "../State";

test("debug new object tracking", () => {
	const state = new State({
		user: {
			profile: {
				name: "Alice",
			},
		},
	});

	let effectCount = 0;

	// Track profile name specifically
	state.effect(() => {
		const name = state.value.user.profile.name;
		effectCount++;
		console.log(`Effect ${effectCount}: accessing name =`, name);
	});

	console.log("Initial effect count:", effectCount);

	// Change the entire profile object (which contains a name property)
	console.log("\nSetting user.profile = { name: 'Bob' }...");
	state.value.user.profile = { name: "Bob" };

	console.log("Final effect count:", effectCount);

	// This should only trigger twice: initial + profile change
	// But it might trigger 3 times due to new object tracking
	expect(effectCount).toBe(2);
});
