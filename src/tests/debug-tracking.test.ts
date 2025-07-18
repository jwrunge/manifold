import { State } from "../State";
import { describe, test, expect } from "vitest";

describe("debug tracking", () => {
	test("simple tracking debug", () => {
		const state = new State({
			user: {
				profile: {
					name: "John",
					email: "john@example.com",
				},
			},
		});

		let nameEffectCount = 0;
		let emailEffectCount = 0;
		let rootEffectCount = 0;

		// Track name
		state.effect(() => {
			console.log(
				"Name effect accessing:",
				state.value.user.profile.name
			);
			nameEffectCount++;
		});

		// Track email
		state.effect(() => {
			console.log(
				"Email effect accessing:",
				state.value.user.profile.email
			);
			emailEffectCount++;
		});

		// Track root
		state.effect(() => {
			console.log("Root effect accessing:", state.value);
			rootEffectCount++;
		});

		console.log(
			"Initial counts - name:",
			nameEffectCount,
			"email:",
			emailEffectCount,
			"root:",
			rootEffectCount
		);

		// Change name - should only trigger name effect
		console.log("Changing name...");
		console.log("Before assignment:", state.value.user.profile.name);
		state.value.user.profile.name = "Alice";
		console.log("After assignment:", state.value.user.profile.name);

		console.log(
			"After name change - name:",
			nameEffectCount,
			"email:",
			emailEffectCount,
			"root:",
			rootEffectCount
		);
		console.log("Expected: name=2, email=1, root=2");

		expect(nameEffectCount).toBe(2);
		expect(emailEffectCount).toBe(1);
		expect(rootEffectCount).toBe(2);
	});
});
