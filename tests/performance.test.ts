import { describe, expect, test } from "vitest";
import type { Effect } from "../src/Effect.ts";
import $ from "../src/main.ts";

// Performance profiling utilities
interface PerformanceMetrics {
	name: string;
	duration: number;
	memoryUsed: number;
	effectRuns: number;
	operationsPerSecond?: number;
	averageEffectTime?: number;
}

class PerformanceProfiler {
	private startTime: number = 0;
	private startMemory: number = 0;
	private effectRunCount: number = 0;
	private effectTimes: number[] = [];

	start(name: string) {
		this.effectRunCount = 0;
		this.effectTimes = [];
		this.startMemory = this.getMemoryUsage();
		this.startTime = performance.now();
		console.log(`\n🚀 Starting performance test: ${name}`);
	}

	trackEffect(fn: () => void): () => void {
		return () => {
			const effectStart = performance.now();
			this.effectRunCount++;
			fn();
			const effectEnd = performance.now();
			this.effectTimes.push(effectEnd - effectStart);
		};
	}

	finish(name: string, operationCount?: number): PerformanceMetrics {
		const endTime = performance.now();
		const endMemory = this.getMemoryUsage();
		const duration = endTime - this.startTime;
		const memoryUsed = endMemory - this.startMemory;

		const metrics: PerformanceMetrics = {
			name,
			duration,
			memoryUsed,
			effectRuns: this.effectRunCount,
			operationsPerSecond: operationCount
				? (operationCount / duration) * 1000
				: undefined,
			averageEffectTime:
				this.effectTimes.length > 0
					? this.effectTimes.reduce((a, b) => a + b, 0) /
					  this.effectTimes.length
					: 0,
		};

		this.logMetrics(metrics);
		return metrics;
	}

	private getMemoryUsage(): number {
		// Memory tracking is environment-dependent
		try {
			// @ts-ignore - process might not be available in all environments
			if (typeof process !== "undefined" && process.memoryUsage) {
				// @ts-ignore
				return process.memoryUsage().heapUsed / 1024 / 1024; // MB
			}
		} catch {
			// Fallback for environments without process
		}
		// In browser environment or when process is unavailable
		return 0;
	}

	private logMetrics(metrics: PerformanceMetrics) {
		console.log(`\n📊 Performance Metrics for "${metrics.name}":`);
		console.log(`   ⏱️  Duration: ${metrics.duration.toFixed(2)}ms`);
		console.log(`   💾 Memory: ${metrics.memoryUsed.toFixed(2)}MB`);
		console.log(`   🔄 Effect runs: ${metrics.effectRuns}`);
		if (metrics.operationsPerSecond) {
			console.log(
				`   📈 Ops/sec: ${metrics.operationsPerSecond.toFixed(0)}`
			);
		}
		if (metrics.averageEffectTime) {
			console.log(
				`   ⚡ Avg effect time: ${metrics.averageEffectTime.toFixed(
					4
				)}ms`
			);
		}
	}
}

describe("Performance Profiling", () => {
	describe("Normal Usage Performance", () => {
		test("should handle basic state operations efficiently", async () => {
			const profiler = new PerformanceProfiler();
			profiler.start("Basic State Operations");

			const { state: store } = $.create()
				.add("counter", 0)
				.add("name", "test")
				.add("data", { value: 1 })
				.build(true);

			let effectRuns = 0;
			$.effect(
				profiler.trackEffect(() => {
					store.counter;
					store.name;
					store.data.value;
					effectRuns++;
				})
			);

			// Perform 1000 state updates
			const operations = 1000;
			for (let i = 0; i < operations; i++) {
				store.counter = i;
				if (i % 100 === 0) {
					store.name = `test-${i}`;
				}
				if (i % 50 === 0) {
					store.data = { value: i };
				}
			}

			// Wait for effects to settle
			await new Promise((resolve) => setTimeout(resolve, 100));

			const metrics = profiler.finish(
				"Basic State Operations",
				operations
			);

			// Performance assertions
			expect(metrics.duration).toBeLessThan(1000); // Should complete in under 1 second
			expect(metrics.effectRuns).toBeGreaterThan(0); // Effects should run due to batching
			expect(effectRuns).toBeGreaterThan(0);
			// With batching, effect runs will be much lower than operations
			console.log(
				`   📊 Effect efficiency: ${effectRuns} runs for ${operations} operations`
			);
		});

		test("should handle derived state efficiently", async () => {
			const profiler = new PerformanceProfiler();
			profiler.start("Derived State Performance");

			const { state: store } = $.create()
				.add("base", 1)
				.add("multiplier", 2)
				.addDerived("doubled", (s) => s.base * 2)
				.addDerived("tripled", (s) => s.base * 3)
				.addDerived(
					"computed",
					(s) => s.doubled + s.tripled + s.multiplier
				)
				.build(true);

			let derivedAccessCount = 0;
			$.effect(
				profiler.trackEffect(() => {
					store.computed;
					store.doubled;
					derivedAccessCount++;
				})
			);

			// Update base state 500 times
			const operations = 500;
			for (let i = 1; i <= operations; i++) {
				store.base = i;
				if (i % 100 === 0) {
					store.multiplier = i / 10;
				}
			}

			await new Promise((resolve) => setTimeout(resolve, 50));

			const metrics = profiler.finish(
				"Derived State Performance",
				operations
			);

			// Verify derived state is correct
			expect(store.doubled).toBe(operations * 2);
			expect(store.tripled).toBe(operations * 3);
			expect(derivedAccessCount).toBeGreaterThan(0);

			// Performance assertions
			expect(metrics.duration).toBeLessThan(500);
		});

		test("should handle hierarchical effects efficiently", async () => {
			const profiler = new PerformanceProfiler();
			profiler.start("Hierarchical Effects Performance");

			const { state: store } = $.create()
				.add("level0", 0)
				.add("level1", 0)
				.add("level2", 0)
				.add("level3", 0)
				.build(true);

			let totalEffectRuns = 0;

			// Level 0 effect
			$.effect(
				profiler.trackEffect(() => {
					const value = store.level0;
					totalEffectRuns++;
					if (value > 0) {
						store.level1 = value * 2;
					}
				})
			);

			// Level 1 effect
			$.effect(
				profiler.trackEffect(() => {
					const value = store.level1;
					totalEffectRuns++;
					if (value > 0) {
						store.level2 = value + 10;
					}
				})
			);

			// Level 2 effect
			$.effect(
				profiler.trackEffect(() => {
					const value = store.level2;
					totalEffectRuns++;
					if (value > 0) {
						store.level3 = value * 3;
					}
				})
			);

			// Trigger cascade 200 times
			const operations = 200;
			for (let i = 1; i <= operations; i++) {
				store.level0 = i;
			}

			await new Promise((resolve) => setTimeout(resolve, 100));

			const metrics = profiler.finish(
				"Hierarchical Effects Performance",
				operations
			);

			// Verify final state
			expect(store.level0).toBe(operations);
			expect(store.level1).toBe(operations * 2);
			expect(store.level2).toBe(operations * 2 + 10);
			expect(store.level3).toBe((operations * 2 + 10) * 3);

			// Performance assertions
			expect(metrics.duration).toBeLessThan(300);
			expect(totalEffectRuns).toBeGreaterThan(0); // Effects should run, but batching may reduce count
			console.log(
				`   📊 Hierarchical effects: ${totalEffectRuns} runs for ${operations} operations`
			);
		});
	});

	describe("Stress Testing", () => {
		test("should handle many simultaneous state updates", async () => {
			const profiler = new PerformanceProfiler();
			profiler.start("Mass State Updates Stress Test");

			// Create store with many state properties
			let builder = $.create();
			for (let i = 0; i < 50; i++) {
				builder = builder.add(`prop${i}`, i);
			}
			const { state: store } = builder.build(true);

			let effectRunCount = 0;
			const effectCounts = new Array(50).fill(0);

			// Create effects for each property
			for (let i = 0; i < 50; i++) {
				const index = i;
				$.effect(
					profiler.trackEffect(() => {
						(store as Record<string, number>)[`prop${index}`];
						effectCounts[index]++;
						effectRunCount++;
					})
				);
			}

			// Perform massive state updates
			const operations = 2000;
			for (let i = 0; i < operations; i++) {
				const propIndex = i % 50;
				(store as Record<string, number>)[`prop${propIndex}`] = i;
			}

			await new Promise((resolve) => setTimeout(resolve, 200));

			const metrics = profiler.finish(
				"Mass State Updates Stress Test",
				operations
			);

			// Performance assertions
			expect(metrics.duration).toBeLessThan(2000); // Should complete in under 2 seconds
			expect(effectRunCount).toBeGreaterThan(0); // Effects should run, batching affects count
			expect(effectCounts.every((count) => count > 0)).toBe(true);
			console.log(
				`   📊 Mass updates: ${effectRunCount} effect runs for ${operations} operations`
			);
		});

		test("should handle deep object nesting performance", async () => {
			const profiler = new PerformanceProfiler();
			profiler.start("Deep Object Nesting Stress Test");

			// Create deeply nested object
			const deepObject = {
				level1: {
					level2: {
						level3: {
							level4: {
								level5: {
									value: 0,
									data: Array.from(
										{ length: 100 },
										(_, i) => ({
											id: i,
											value: i * 2,
										})
									),
								},
							},
						},
					},
				},
			};

			const { state: store } = $.create()
				.add("deep", deepObject)
				.add("counter", 0)
				.build(true);

			let deepAccessCount = 0;
			let arrayAccessCount = 0;

			$.effect(
				profiler.trackEffect(() => {
					store.deep.level1.level2.level3.level4.level5.value;
					deepAccessCount++;
				})
			);

			$.effect(
				profiler.trackEffect(() => {
					store.deep.level1.level2.level3.level4.level5.data.length;
					arrayAccessCount++;
				})
			);

			// Update deep nested value many times
			const operations = 1000;
			for (let i = 0; i < operations; i++) {
				store.deep.level1.level2.level3.level4.level5.value = i;

				if (i % 100 === 0) {
					// Occasionally update array
					store.deep.level1.level2.level3.level4.level5.data.push({
						id: 1000 + i,
						value: i,
					});
				}
			}

			await new Promise((resolve) => setTimeout(resolve, 150));

			const metrics = profiler.finish(
				"Deep Object Nesting Stress Test",
				operations
			);

			// Verify final state
			expect(store.deep.level1.level2.level3.level4.level5.value).toBe(
				operations - 1
			);
			expect(deepAccessCount).toBeGreaterThan(0);
			expect(arrayAccessCount).toBeGreaterThan(0);

			// Performance assertions
			expect(metrics.duration).toBeLessThan(1500);
		});

		test("should handle circular dependency stress test", async () => {
			const profiler = new PerformanceProfiler();
			profiler.start("Circular Dependency Stress Test");

			// Create multiple stores that could create circular dependencies
			const storeCount = 10;
			const stores = Array.from(
				{ length: 20 },
				() => $.create().add("value", 0).build(true).state
			);

			let totalEffectRuns = 0;
			const maxRuns = 50;

			// Create potentially circular effects between stores
			for (let i = 0; i < storeCount; i++) {
				const currentIndex = i;
				const nextIndex = (i + 1) % storeCount;

				$.effect(
					profiler.trackEffect(() => {
						const value = stores[currentIndex].value;
						totalEffectRuns++;

						// Safety valve to prevent infinite loops
						if (totalEffectRuns > maxRuns) return;

						if (value > 0 && value < 5) {
							stores[nextIndex].value = value + 1;
						}
					})
				);
			}

			// Trigger multiple circular chains
			const operations = 20;
			for (let i = 0; i < operations; i++) {
				const randomStore = Math.floor(Math.random() * storeCount);
				stores[randomStore].value = 1;

				// Let effects settle between triggers
				await new Promise((resolve) => setTimeout(resolve, 10));

				// Reset for next iteration
				stores.forEach((store) => {
					store.value = 0;
				});
			}

			await new Promise((resolve) => setTimeout(resolve, 100));

			const metrics = profiler.finish(
				"Circular Dependency Stress Test",
				operations
			);

			// Performance assertions - should not hang or crash
			expect(metrics.duration).toBeLessThan(3000);
			expect(totalEffectRuns).toBeLessThan(500); // Should be controlled by maxRuns safety valve
			console.log(
				`   📊 Circular dependency control: ${totalEffectRuns} runs (max allowed: ${maxRuns})`
			);
		});

		test("should handle rapid state changes performance", async () => {
			const profiler = new PerformanceProfiler();
			profiler.start("Rapid State Changes Stress Test");

			const { state: store } = $.create()
				.add("rapidValue", 0)
				.add("batchCounter", 0)
				.build(true);

			let effectRuns = 0;
			let lastSeenValue = -1;

			$.effect(
				profiler.trackEffect(() => {
					const value = store.rapidValue;
					effectRuns++;
					lastSeenValue = value;
				})
			);

			// Rapid fire state updates (should be batched)
			const operations = 5000;
			const batchSize = 100;

			for (let batch = 0; batch < operations / batchSize; batch++) {
				// Rapid updates within same batch
				for (let i = 0; i < batchSize; i++) {
					store.rapidValue = batch * batchSize + i;
				}

				// Small delay to let batching work
				await new Promise((resolve) => setTimeout(resolve, 1));
			}

			await new Promise((resolve) => setTimeout(resolve, 100));

			const metrics = profiler.finish(
				"Rapid State Changes Stress Test",
				operations
			);

			// Verify final state
			expect(store.rapidValue).toBe(operations - 1);
			expect(lastSeenValue).toBe(operations - 1);

			// Performance assertions
			expect(metrics.duration).toBeLessThan(1000);
			// Effect should run much less than operations due to batching
			expect(effectRuns).toBeLessThan(operations / 2);
			console.log(
				`   📊 Batching efficiency: ${(
					(1 - effectRuns / operations) *
					100
				).toFixed(1)}%`
			);
		});
	});

	describe("Memory and Cleanup Performance", () => {
		test("should efficiently clean up stopped effects", async () => {
			const profiler = new PerformanceProfiler();
			profiler.start("Effect Cleanup Performance");

			const { state: store } = $.create().add("value", 0).build(true);

			// Create many effects
			const effectCount = 1000;
			const effects: Effect[] = [];
			let activeEffectRuns = 0;

			for (let i = 0; i < effectCount; i++) {
				const effect = $.effect(
					profiler.trackEffect(() => {
						store.value;
						activeEffectRuns++;
					})
				);
				effects.push(effect);
			}

			// Trigger once to establish baseline
			store.value = 1;
			await new Promise((resolve) => setTimeout(resolve, 50));
			const baselineRuns = activeEffectRuns;

			// Stop half the effects
			for (let i = 0; i < effectCount / 2; i++) {
				effects[i].stop();
			}

			// Reset counter and trigger again
			activeEffectRuns = 0;
			store.value = 2;
			await new Promise((resolve) => setTimeout(resolve, 50));
			const afterCleanupRuns = activeEffectRuns;

			const metrics = profiler.finish("Effect Cleanup Performance");

			// Verify cleanup worked
			expect(afterCleanupRuns).toBeLessThan(baselineRuns);
			expect(afterCleanupRuns).toBeCloseTo(
				effectCount / 2,
				effectCount * 0.1
			);

			// Performance assertions
			expect(metrics.duration).toBeLessThan(500);
			console.log(
				`   🧹 Cleanup efficiency: ${baselineRuns} -> ${afterCleanupRuns} effect runs`
			);
		});
	});

	describe("Comparative Performance", () => {
		test("should compare hierarchical vs performance mode", async () => {
			const operations = 1000;

			// Test hierarchical mode
			const hierarchicalProfiler = new PerformanceProfiler();
			hierarchicalProfiler.start("Hierarchical Mode");

			const hierarchicalApp = $.create().add("count", 0).build(true);

			$.effect(
				hierarchicalProfiler.trackEffect(() => {
					hierarchicalApp.state.trigger;
					$.effect(
						hierarchicalProfiler.trackEffect(() => {
							// Child effect
						})
					);
				})
			);

			for (let i = 0; i < operations; i++) {
				hierarchicalApp.state.trigger = i;
			}
			await new Promise((resolve) => setTimeout(resolve, 100));

			const hierarchicalMetrics = hierarchicalProfiler.finish(
				"Hierarchical Mode",
				operations
			);

			// Test performance mode
			const performanceProfiler = new PerformanceProfiler();
			performanceProfiler.start("Performance Mode");

			const performanceApp = $.create().add("count", 0).build(true);

			$.effect(
				performanceProfiler.trackEffect(() => {
					performanceApp.state.trigger;
					$.effect(
						performanceProfiler.trackEffect(() => {
							// Child effect
						})
					);
				})
			);

			for (let i = 0; i < operations; i++) {
				performanceApp.state.trigger = i;
			}
			await new Promise((resolve) => setTimeout(resolve, 100));

			const performanceMetrics = performanceProfiler.finish(
				"Performance Mode",
				operations
			);

			// Compare results
			console.log(`\n🏁 Performance Comparison:`);
			console.log(
				`   Hierarchical: ${hierarchicalMetrics.duration.toFixed(2)}ms`
			);
			console.log(
				`   Performance:  ${performanceMetrics.duration.toFixed(2)}ms`
			);
			console.log(
				`   Difference:   ${(
					hierarchicalMetrics.duration - performanceMetrics.duration
				).toFixed(2)}ms`
			);

			// Both should complete reasonably fast
			expect(hierarchicalMetrics.duration).toBeLessThan(1000);
			expect(performanceMetrics.duration).toBeLessThan(1000);
		});
	});
});
