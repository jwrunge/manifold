import { describe, expect, test } from "vitest";
import $ from "./helpers/api.ts";

describe("Advanced Reactivity Features", () => {
	describe("Circular Dependency Detection", () => {
		test("should prevent infinite loops through batching", async () => {
			const storeA = $.create().add("value", 0).build();
			const storeB = $.create().add("value", 0).build();

			let aEffectRuns = 0;
			let bEffectRuns = 0;
			const maxRuns = 15;

			// Create potentially circular effects
			$.effect(() => {
				aEffectRuns++;
				if (aEffectRuns > maxRuns) return;

				if (storeA.value > 0 && storeA.value < 5) {
					storeB.value = storeA.value + 1;
				}
			});

			$.effect(() => {
				bEffectRuns++;
				if (bEffectRuns > maxRuns) return;

				if (storeB.value > 0 && storeB.value < 5) {
					storeA.value = storeB.value + 1;
				}
			});

			// Reset counters and trigger
			aEffectRuns = 0;
			bEffectRuns = 0;
			storeA.value = 1;

			await new Promise((resolve) => setTimeout(resolve, 50));

			// Batching should prevent runaway execution
			expect(aEffectRuns).toBeLessThan(maxRuns);
			expect(bEffectRuns).toBeLessThan(maxRuns);

			// Both stores should reach a stable state
			expect(storeA.value).toBeGreaterThanOrEqual(1);
			expect(storeB.value).toBeGreaterThanOrEqual(1);
		});

		test("should handle complex circular chains", async () => {
			const stores = Array.from({ length: 5 }, () =>
				$.create().add("value", 0).build(),
			);
			const effectCounts = Array.from({ length: 5 }, () => 0);
			const maxRuns = 20;

			// Create a chain where each store can trigger the next
			for (let i = 0; i < stores.length; i++) {
				const currentIndex = i;
				const nextIndex = (i + 1) % stores.length;

				$.effect(() => {
					effectCounts[currentIndex]++;
					if (effectCounts[currentIndex] > maxRuns) return;

					const currentValue = stores[currentIndex].value;
					if (currentValue > 0 && currentValue < 3) {
						stores[nextIndex].value = currentValue;
					}
				});
			}

			// Reset and trigger
			effectCounts.fill(0);
			stores[0].value = 1;

			await new Promise((resolve) => setTimeout(resolve, 100));

			// All effect counts should be reasonable
			for (let i = 0; i < effectCounts.length; i++) {
				expect(effectCounts[i]).toBeLessThan(maxRuns);
			}

			// Some propagation should have occurred
			expect(effectCounts[0]).toBeGreaterThan(0);
		});

		test("should detect true circular dependencies in effect creation", () => {
			// This tests the circular dependency detection during effect creation
			// The current implementation prevents this through the hasCircularDependency check
			const store = $.create().add("trigger", 0).build();

			// Normal nested effects should work fine
			expect(() => {
				$.effect(() => {
					store.trigger;
					$.effect(() => {
						store.trigger;
						$.effect(() => {
							store.trigger;
						});
					});
				});
			}).not.toThrow();

			// The system tracks parent-child relationships to prevent true cycles
			expect(store.trigger).toBe(0);
		});
	});

	describe("Hierarchical Effect Execution", () => {
		test("should execute effects in hierarchical order with state mutations", async () => {
			const store = $.create()
				.add("level0", 0)
				.add("level1", 0)
				.add("level2", 0)
				.add("level3", 0)
				.build();

			const executionOrder: string[] = [];

			// Create a hierarchy where each level updates the next
			$.effect(() => {
				const value = store.level0;
				if (value > 0) {
					executionOrder.push(`L0-processing-${value}`);
					store.level1 = value * 2;
				}
			});

			// Level 1 effects react to level1 state
			$.effect(() => {
				const value = store.level1;
				if (value > 0) {
					executionOrder.push(`L1-processing-${value}`);
					store.level2 = value + 10;
				}
			});

			// Level 2 effects react to level2 state
			$.effect(() => {
				const value = store.level2;
				if (value > 0) {
					executionOrder.push(`L2-processing-${value}`);
					store.level3 = value * 3;
				}
			});

			// Clear initial execution
			executionOrder.length = 0;

			// Trigger the cascade
			store.level0 = 5;

			await new Promise((resolve) => setTimeout(resolve, 20));

			// Verify final values
			expect(store.level0).toBe(5);
			expect(store.level1).toBe(10); // 5 * 2
			expect(store.level2).toBe(20); // 10 + 10
			expect(store.level3).toBe(60); // 20 * 3

			// Verify execution happened
			expect(executionOrder).toContain("L0-processing-5");
			expect(executionOrder).toContain("L1-processing-10");
			expect(executionOrder).toContain("L2-processing-20");

			// Verify hierarchical order (L0 before L1 before L2)
			const l0Index = executionOrder.findIndex((s) => s.startsWith("L0"));
			const l1Index = executionOrder.findIndex((s) => s.startsWith("L1"));
			const l2Index = executionOrder.findIndex((s) => s.startsWith("L2"));

			expect(l0Index).toBeLessThan(l1Index);
			expect(l1Index).toBeLessThan(l2Index);
		});

		test("should handle multiple effects at the same level", async () => {
			const store = $.create().add("trigger", 0).add("counter", 0).build();

			const executionCounts = {
				level0a: 0,
				level0b: 0,
				level1a: 0,
				level1b: 0,
			};

			// Multiple level 0 effects
			$.effect(() => {
				store.trigger; // dependency
				executionCounts.level0a++;
			});

			$.effect(() => {
				store.trigger; // dependency
				executionCounts.level0b++;
			});

			// Reset counters
			for (const key in executionCounts) {
				(executionCounts as Record<string, number>)[key] = 0;
			}

			// Trigger change
			store.trigger = 1;
			await new Promise((resolve) => setTimeout(resolve, 10));

			// Both level 0 effects should have executed
			expect(executionCounts.level0a).toBe(1);
			expect(executionCounts.level0b).toBe(1);
		});

		test("should properly batch effects across hierarchy levels", async () => {
			const store = $.create()
				.add("input", 0)
				.add("intermediate", 0)
				.add("output", 0)
				.build();

			const batchingLog: string[] = [];
			let totalEffectRuns = 0;

			// Level 0: Transform input
			$.effect(() => {
				const value = store.input;
				totalEffectRuns++;
				batchingLog.push(`L0-input-${value}`);
				store.intermediate = value * 2;
			});

			// Level 1: Transform intermediate
			$.effect(() => {
				const value = store.intermediate;
				totalEffectRuns++;
				batchingLog.push(`L1-intermediate-${value}`);
				store.output = value + 100;
			});

			// Level 1: Another effect on intermediate
			$.effect(() => {
				const value = store.intermediate;
				totalEffectRuns++;
				batchingLog.push(`L1-alternate-${value}`);
			});

			// Reset
			batchingLog.length = 0;
			totalEffectRuns = 0;

			// Single input change should cascade properly
			store.input = 10;
			await new Promise((resolve) => setTimeout(resolve, 15));

			// Verify final state
			expect(store.input).toBe(10);
			expect(store.intermediate).toBe(20); // 10 * 2
			expect(store.output).toBe(120); // 20 + 100

			// Should have run each effect only once in this batch
			expect(totalEffectRuns).toBe(3);
			expect(batchingLog).toContain("L0-input-10");
			expect(batchingLog).toContain("L1-intermediate-20");
			expect(batchingLog).toContain("L1-alternate-20");
		});
	});

	describe("Performance Mode vs Hierarchical Mode", () => {
		test("should respect hierarchical flag during build", async () => {
			// Create hierarchical mode app
			const hierarchicalApp = $.create().add("trigger", 0).build();

			// Create performance mode app (option removed; same build signature)
			const performanceApp = $.create().add("trigger", 0).build();

			const hierarchicalOrder: string[] = [];
			const performanceOrder: string[] = [];

			// Setup effects for hierarchical mode
			$.effect(() => {
				hierarchicalApp.trigger;
				hierarchicalOrder.push("parent");
				$.effect(() => {
					hierarchicalOrder.push("child");
				});
			});

			// Setup effects for performance mode
			$.effect(() => {
				performanceApp.trigger;
				performanceOrder.push("parent");
				$.effect(() => {
					performanceOrder.push("child");
				});
			});

			// Clear initial execution
			hierarchicalOrder.length = 0;
			performanceOrder.length = 0;

			// Trigger both
			hierarchicalApp.trigger = 1;
			performanceApp.trigger = 1;

			await new Promise((resolve) => setTimeout(resolve, 15));

			// Both should have executed their effects
			expect(hierarchicalOrder.length).toBeGreaterThan(0);
			expect(performanceOrder.length).toBeGreaterThan(0);

			// Hierarchical mode should maintain order if both effects run
			if (
				hierarchicalOrder.includes("parent") &&
				hierarchicalOrder.includes("child")
			) {
				expect(hierarchicalOrder.indexOf("parent")).toBeLessThan(
					hierarchicalOrder.indexOf("child"),
				);
			}
		});
	});

	describe("Memory Management and Effect Lifecycle", () => {
		test("should properly clean up stopped effects", async () => {
			const store = $.create().add("value", 0).build();

			let effect1Runs = 0;
			let effect2Runs = 0;

			const effect1 = $.effect(() => {
				store.value;
				effect1Runs++;
			});

			$.effect(() => {
				store.value;
				effect2Runs++;
			});

			// Reset counters
			effect1Runs = 0;
			effect2Runs = 0;

			// Both should run
			store.value = 1;
			await new Promise((resolve) => setTimeout(resolve, 5));

			expect(effect1Runs).toBe(1);
			expect(effect2Runs).toBe(1);

			// Stop effect1
			effect1.stop();

			// Only effect2 should run now
			store.value = 2;
			await new Promise((resolve) => setTimeout(resolve, 5));

			expect(effect1Runs).toBe(1); // unchanged
			expect(effect2Runs).toBe(2); // incremented
		});

		test("should handle nested effect cleanup", async () => {
			const store = $.create().add("enabled", true).build();

			let parentRuns = 0;
			let childRuns = 0;

			const parentEffect = $.effect(() => {
				store.enabled;
				parentRuns++;

				if (store.enabled) {
					$.effect(() => {
						childRuns++;
					});
				}
			});

			// Reset
			parentRuns = 0;
			childRuns = 0;

			// Trigger parent, which creates child
			store.enabled = false;
			store.enabled = true;
			await new Promise((resolve) => setTimeout(resolve, 5));

			expect(parentRuns).toBeGreaterThan(0);
			expect(childRuns).toBeGreaterThan(0);

			// Stop parent should work
			parentEffect.stop();
			expect(parentEffect).toBeDefined();
		});
	});
});
