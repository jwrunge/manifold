import { describe, expect, test } from "vitest";
import { State } from "../src/main.ts";
import { effect } from "../src/reactivity/effect.ts";
import { proxy } from "../src/reactivity/proxy.ts";

describe("Map granular reactivity", () => {
	test("direct proxy map tracks individual keys", async () => {
		const map = proxy(
			new Map([
				["a", 1],
				["b", 2],
			]),
		) as unknown as Map<string, number>;

		let aRuns = 0;
		let bRuns = 0;

		effect(() => {
			map.get("a");
			aRuns++;
		});

		effect(() => {
			map.get("b");
			bRuns++;
		});

		expect(aRuns).toBe(1);
		expect(bRuns).toBe(1);

		// Update a - should only trigger a effect
		map.set("a", 10);
		await new Promise((resolve) => setTimeout(resolve, 0));
		expect(aRuns).toBe(2);
		expect(bRuns).toBe(1);

		// Update b - should only trigger b effect
		map.set("b", 20);
		await new Promise((resolve) => setTimeout(resolve, 0));
		expect(aRuns).toBe(2);
		expect(bRuns).toBe(2);
	});

	test("map.get() only triggers effects watching that key", async () => {
		const state = State.create()
			.add(
				"users",
				new Map([
					["user1", "Alice"],
					["user2", "Bob"],
				]),
			)
			.build();

		let user1Runs = 0;
		let user2Runs = 0;
		let sizeRuns = 0;

		effect(() => {
			state.users.get("user1");
			user1Runs++;
		});

		effect(() => {
			state.users.get("user2");
			user2Runs++;
		});

		effect(() => {
			state.users.size;
			sizeRuns++;
		});

		expect(user1Runs).toBe(1);
		expect(user2Runs).toBe(1);
		expect(sizeRuns).toBe(1);

		// Updating user1 should only trigger user1 effect
		state.users.set("user1", "Alice Updated");
		await new Promise((resolve) => setTimeout(resolve, 0));
		expect(user1Runs).toBe(2);
		expect(user2Runs).toBe(1); // Should NOT re-run
		expect(sizeRuns).toBe(1); // Should NOT re-run (no structural change)

		// Updating user2 should only trigger user2 effect
		state.users.set("user2", "Bob Updated");
		await new Promise((resolve) => setTimeout(resolve, 0));
		expect(user1Runs).toBe(2); // Should NOT re-run
		expect(user2Runs).toBe(2);
		expect(sizeRuns).toBe(1); // Should NOT re-run

		// Adding new key triggers size effect
		state.users.set("user3", "Charlie");
		await new Promise((resolve) => setTimeout(resolve, 0));
		expect(user1Runs).toBe(2);
		expect(user2Runs).toBe(2);
		expect(sizeRuns).toBe(2); // Should re-run (structural change)

		// Deleting triggers both the key effect and size effect
		state.users.delete("user1");
		await new Promise((resolve) => setTimeout(resolve, 0));
		expect(user1Runs).toBe(3); // Should re-run (key changed)
		expect(user2Runs).toBe(2);
		expect(sizeRuns).toBe(3); // Should re-run (structural change)
	});

	test("map iteration tracks structural changes", async () => {
		const state = State.create()
			.add("data", new Map([["a", 1]]))
			.build();

		let iterationRuns = 0;
		let getARuns = 0;

		effect(() => {
			[...state.data.keys()];
			iterationRuns++;
		});

		effect(() => {
			state.data.get("a");
			getARuns++;
		});

		expect(iterationRuns).toBe(1);
		expect(getARuns).toBe(1);

		// Updating existing key: iteration doesn't re-run, but get does
		state.data.set("a", 2);
		await new Promise((resolve) => setTimeout(resolve, 0));
		expect(iterationRuns).toBe(1); // Should NOT re-run
		expect(getARuns).toBe(2); // Should re-run

		// Adding new key: iteration re-runs
		state.data.set("b", 3);
		await new Promise((resolve) => setTimeout(resolve, 0));
		expect(iterationRuns).toBe(2); // Should re-run (structural change)
		expect(getARuns).toBe(2);
	});

	test("map.has() tracks specific keys for existence", async () => {
		const state = State.create()
			.add("flags", new Map([["feature1", true]]))
			.build();

		let hasFeature1Runs = 0;
		let hasFeature2Runs = 0;

		effect(() => {
			state.flags.has("feature1");
			hasFeature1Runs++;
		});

		effect(() => {
			state.flags.has("feature2");
			hasFeature2Runs++;
		});

		expect(hasFeature1Runs).toBe(1);
		expect(hasFeature2Runs).toBe(1);

		// Updating feature1 value doesn't affect .has() (still exists)
		state.flags.set("feature1", false);
		await new Promise((resolve) => setTimeout(resolve, 0));
		expect(hasFeature1Runs).toBe(1); // Should NOT re-run (key still exists)
		expect(hasFeature2Runs).toBe(1);

		// Adding feature2 triggers its watcher (key now exists)
		state.flags.set("feature2", true);
		await new Promise((resolve) => setTimeout(resolve, 0));
		expect(hasFeature1Runs).toBe(1);
		expect(hasFeature2Runs).toBe(2); // Should re-run (key added)

		// Deleting feature1 triggers its watcher (key no longer exists)
		state.flags.delete("feature1");
		await new Promise((resolve) => setTimeout(resolve, 0));
		expect(hasFeature1Runs).toBe(2); // Should re-run (key deleted)
		expect(hasFeature2Runs).toBe(2);
	});
});
