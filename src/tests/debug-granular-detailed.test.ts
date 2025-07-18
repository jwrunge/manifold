import { test, expect } from "vitest";
import { State } from "../State";

test("debug granular tracking detailed", () => {
	const state = new State({
		user: {
			profile: {
				name: "Alice",
			},
		},
	});

	let profileCount = 0;
	let nameCount = 0;

	// Effect tracking profile object
	const profileEffect = state.effect(() => {
		console.log("Profile effect running, accessing profile");
		state.value.user.profile;
		profileCount++;
		console.log("Profile effect done, count:", profileCount);
	});

	// Effect tracking name specifically
	const nameEffect = state.effect(() => {
		console.log("Name effect running, accessing name");
		const name = state.value.user.profile.name;
		nameCount++;
		console.log("Name effect done, count:", nameCount, "name:", name);
	});

	console.log("Initial counts - profile:", profileCount, "name:", nameCount);

	console.log("Setting name to 'Bob'...");
	state.value.user.profile.name = "Bob";

	console.log("Final counts - profile:", profileCount, "name:", nameCount);

	// Name effect should trigger (1 -> 2)
	expect(nameCount).toBe(2);
	// Profile effect should trigger (1 -> 2) because profile contains name
	expect(profileCount).toBe(2);
});
