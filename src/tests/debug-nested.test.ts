import { expect, test } from "vitest";
import { State } from "../State";

test("debug nested object propagation", () => {
	const state = new State({
		user: {
			profile: {
				name: "Alice",
			},
		},
	});

	let userUpdateCount = 0;
	let profileUpdateCount = 0;
	let nameUpdateCount = 0;

	// Track user
	state.effect(() => {
		state.value.user;
		userUpdateCount++;
		console.log("User effect ran, count:", userUpdateCount);
	});

	// Track profile
	state.effect(() => {
		state.value.user.profile;
		profileUpdateCount++;
		console.log("Profile effect ran, count:", profileUpdateCount);
	});

	// Track name
	state.effect(() => {
		state.value.user.profile.name;
		nameUpdateCount++;
		console.log("Name effect ran, count:", nameUpdateCount);
	});

	console.log(
		"Initial counts - user:",
		userUpdateCount,
		"profile:",
		profileUpdateCount,
		"name:",
		nameUpdateCount
	);

	// Change nested property
	console.log("Setting profile.name = 'Bob'...");
	state.value.user.profile.name = "Bob";

	console.log(
		"After change - user:",
		userUpdateCount,
		"profile:",
		profileUpdateCount,
		"name:",
		nameUpdateCount
	);

	// All should trigger since when an object's property changes, the object itself changes
	expect(userUpdateCount).toBe(2);
	expect(profileUpdateCount).toBe(2);
	expect(nameUpdateCount).toBe(2);
});
