import { describe, expect, test } from "vitest";
import $ from "./helpers/api.ts";

describe("True Circular Dependency Detection", () => {
	test("should demonstrate circular dependency prevention in action", async () => {
		const store = $.create().add("a", 0).add("b", 0).add("c", 0).build();

		const executionLog: Array<{
			effect: string;
			timestamp: number;
			values: { a: number; b: number; c: number };
		}> = [];

		// Create a controlled circular dependency scenario
		let effectARuns = 0;
		let effectBRuns = 0;
		let effectCRuns = 0;

		// Effect A: responds to changes in C, modifies A
		$.effect(() => {
			const cValue = store.c;
			effectARuns++;
			executionLog.push({
				effect: "A",
				timestamp: Date.now(),
				values: { a: store.a, b: store.b, c: store.c },
			});

			// Only trigger if we haven't run too many times (safety valve)
			if (effectARuns < 5 && cValue > 0 && cValue < 3) {
				store.a = cValue + 1;
			}
		});

		// Effect B: responds to changes in A, modifies B
		$.effect(() => {
			const aValue = store.a;
			effectBRuns++;
			executionLog.push({
				effect: "B",
				timestamp: Date.now(),
				values: { a: store.a, b: store.b, c: store.c },
			});

			if (effectBRuns < 5 && aValue > 0 && aValue < 3) {
				store.b = aValue + 1;
			}
		});

		// Effect C: responds to changes in B, modifies C
		$.effect(() => {
			const bValue = store.b;
			effectCRuns++;
			executionLog.push({
				effect: "C",
				timestamp: Date.now(),
				values: { a: store.a, b: store.b, c: store.c },
			});

			if (effectCRuns < 5 && bValue > 0 && bValue < 3) {
				store.c = bValue + 1;
			}
		});

		// Clear initial execution tracking
		executionLog.length = 0;
		effectARuns = 0;
		effectBRuns = 0;
		effectCRuns = 0;

		// Trigger the potentially circular chain
		store.a = 1;

		// Wait for all batched effects to complete
		await new Promise((resolve) => setTimeout(resolve, 100));

		console.log("Final state:", { a: store.a, b: store.b, c: store.c });
		console.log("Effect runs:", { effectARuns, effectBRuns, effectCRuns });
		console.log(
			"Execution log:",
			executionLog.map(
				(entry) =>
					`${entry.effect}: a=${entry.values.a}, b=${entry.values.b}, c=${entry.values.c}`,
			),
		);

		// The batching system should prevent infinite loops
		expect(effectARuns).toBeLessThan(10);
		expect(effectBRuns).toBeLessThan(10);
		expect(effectCRuns).toBeLessThan(10);

		// All values should stabilize at reasonable levels
		expect(store.a).toBeGreaterThanOrEqual(1);
		expect(store.b).toBeGreaterThanOrEqual(1);
		expect(store.c).toBeGreaterThanOrEqual(1);

		// The chain should have propagated to some degree
		expect(effectARuns + effectBRuns + effectCRuns).toBeGreaterThan(3);
	});

	test("should maintain proper execution order even with circular potential", async () => {
		const store = $.create()
			.add("source", 0)
			.add("derived1", 0)
			.add("derived2", 0)
			.build();

		const executionOrder: string[] = [];

		// Level 0: Source changes trigger derived1 calculation
		$.effect(() => {
			const sourceValue = store.source;
			if (sourceValue > 0) {
				executionOrder.push(`L0-source-${sourceValue}`);
				store.derived1 = sourceValue * 2;
			}
		});

		// Level 1: Derived1 changes trigger derived2 calculation
		$.effect(() => {
			const derived1Value = store.derived1;
			if (derived1Value > 0) {
				executionOrder.push(`L1-derived1-${derived1Value}`);
				store.derived2 = derived1Value + 5;
			}
		});

		// Level 2: Derived2 changes are observed (but don't cause further changes)
		$.effect(() => {
			const derived2Value = store.derived2;
			if (derived2Value > 0) {
				executionOrder.push(`L2-derived2-${derived2Value}`);
			}
		});

		// Clear initial execution
		executionOrder.length = 0;

		// Trigger the cascade
		store.source = 3;

		await new Promise((resolve) => setTimeout(resolve, 20));

		console.log("Hierarchical execution order:", executionOrder);

		// Verify final values
		expect(store.source).toBe(3);
		expect(store.derived1).toBe(6); // 3 * 2
		expect(store.derived2).toBe(11); // 6 + 5

		// Verify hierarchical execution order
		expect(executionOrder).toContain("L0-source-3");
		expect(executionOrder).toContain("L1-derived1-6");
		expect(executionOrder).toContain("L2-derived2-11");

		// Check order: L0 should come before L1, L1 before L2
		const l0Index = executionOrder.findIndex((s) => s.startsWith("L0"));
		const l1Index = executionOrder.findIndex((s) => s.startsWith("L1"));
		const l2Index = executionOrder.findIndex((s) => s.startsWith("L2"));

		expect(l0Index).toBeGreaterThanOrEqual(0);
		expect(l1Index).toBeGreaterThanOrEqual(0);
		expect(l2Index).toBeGreaterThanOrEqual(0);
		expect(l0Index).toBeLessThan(l1Index);
		expect(l1Index).toBeLessThan(l2Index);
	});

	test("should demonstrate that the system can handle realistic dependency scenarios", async () => {
		// Create a realistic state management scenario
		const store = $.create()
			.add("user", { name: "John", age: 25 })
			.add("preferences", { theme: "dark", notifications: true })
			.add("ui", { currentPage: "home", loading: false })
			.derive("canVote", (s) => s.user.age >= 18)
			.derive("displayTheme", (s) => s.preferences.theme)
			.build();

		const effectLog: string[] = [];

		// UI effect that responds to user changes
		$.effect(() => {
			const user = store.user;
			effectLog.push(`UI-user-update: ${user.name}, ${user.age}`);

			// UI might trigger loading state (but don't create circular updates)
			// Only change loading state once per user change
			if (user.age !== 25 && !store.ui.loading) {
				store.ui = { ...store.ui, loading: true };
				setTimeout(() => {
					store.ui = { ...store.ui, loading: false };
				}, 5);
			}
		});

		// Theme effect that responds to preference changes
		$.effect(() => {
			const theme = store.preferences.theme;
			effectLog.push(`Theme-change: ${theme}`);
		});

		// Derived state effects
		$.effect(() => {
			const canVote = store.canVote;
			const userName = store.user.name; // Access user name to track changes
			effectLog.push(`Voting-eligibility: ${canVote} for ${userName}`);
		});

		// Clear initial execution
		effectLog.length = 0;

		// Simulate realistic state changes
		store.user = { name: "Jane", age: 30 };
		await new Promise((resolve) => setTimeout(resolve, 10));

		store.preferences.theme = "light";
		await new Promise((resolve) => setTimeout(resolve, 10));

		console.log("Realistic scenario effects:", effectLog);

		// Verify that derived state updated correctly
		expect(store.canVote).toBe(true); // age 30 >= 18
		expect(store.displayTheme).toBe("light");

		// Verify effects executed
		expect(effectLog.some((log) => log.includes("Jane, 30"))).toBe(true);
		expect(effectLog.some((log) => log.includes("Theme-change: light"))).toBe(
			true,
		);
		expect(
			effectLog.some((log) =>
				log.includes("Voting-eligibility: true for Jane"),
			),
		).toBe(true);

		// No infinite loops should have occurred
		expect(effectLog.length).toBeLessThan(20);
	});
});
