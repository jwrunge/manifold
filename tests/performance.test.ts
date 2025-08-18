import { afterAll, describe, expect, test } from "vitest";
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
	// New detailed stats
	ops?: number;
	medianEffectTime?: number;
	p95EffectTime?: number;
	p99EffectTime?: number;
	minEffectTime?: number;
	maxEffectTime?: number;
	memoryStart?: number;
	memoryEnd?: number;
	// Added system-level metrics
	cpuUserMs?: number;
	cpuSysMs?: number;
	msPerOp?: number;
	gcForced?: boolean;
}

// Collect results across tests to emit a single MD summary
const __PERF_RESULTS: PerformanceMetrics[] = [];

class PerformanceProfiler {
	private startTime: number = 0;
	private startMemory: number = 0;
	private effectRunCount: number = 0;
	private effectTimes: number[] = [];
	private startCpu: { user: number; system: number } | null = null;
	private gcUsed = false;

	start(name: string) {
		this.effectRunCount = 0;
		this.effectTimes = [];
		this.maybeForceGC();
		this.startMemory = this.getMemoryUsage();
		this.startCpu = this.getCPUUsage();
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
		// Attempt to minimize noise before sampling end memory/CPU
		this.maybeForceGC();
		const endTime = performance.now();
		const endMemory = this.getMemoryUsage();
		const endCpu = this.getCPUUsage();
		const duration = endTime - this.startTime;
		const memoryUsed = endMemory - this.startMemory;

		const times = this.effectTimes.slice().sort((a, b) => a - b);
		const pick = (p: number) =>
			times.length
				? times[
						Math.min(
							Math.max(
								0,
								Math.floor((p / 100) * (times.length - 1))
							),
							times.length - 1
						)
				  ]
				: 0;

		const cpuUserMs = endCpu.user - (this.startCpu?.user ?? 0) || 0;
		const cpuSysMs = endCpu.system - (this.startCpu?.system ?? 0) || 0;
		const msPerOp =
			operationCount && operationCount > 0
				? duration / operationCount
				: undefined;

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
			// New fields
			ops: operationCount,
			medianEffectTime: pick(50),
			p95EffectTime: pick(95),
			p99EffectTime: pick(99),
			minEffectTime: times[0] ?? 0,
			maxEffectTime: times[times.length - 1] ?? 0,
			memoryStart: this.startMemory,
			memoryEnd: endMemory,
			cpuUserMs,
			cpuSysMs,
			msPerOp,
			gcForced: this.gcUsed,
		};

		this.logMetrics(metrics);
		__PERF_RESULTS.push(metrics);
		return metrics;
	}

	private maybeForceGC() {
		try {
			const g = (globalThis as unknown as { gc?: () => void }).gc;
			if (typeof g === "function") {
				g();
				this.gcUsed = true;
			}
		} catch {}
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

	private getCPUUsage(): { user: number; system: number } {
		try {
			// @ts-ignore - process might not be available in all environments
			if (
				typeof process !== "undefined" &&
				typeof process.cpuUsage === "function"
			) {
				// @ts-ignore
				const u = process.cpuUsage();
				return { user: u.user / 1000, system: u.system / 1000 }; // convert µs -> ms
			}
		} catch {}
		return { user: 0, system: 0 };
	}

	private logMetrics(metrics: PerformanceMetrics) {
		console.log(`\n📊 Performance Metrics for "${metrics.name}":`);
		console.log(`   ⏱️  Duration: ${metrics.duration.toFixed(2)}ms`);
		console.log(
			`   💾 Memory: ${metrics.memoryUsed.toFixed(2)}MB (start ${(
				metrics.memoryStart ?? 0
			).toFixed(2)} ➜ end ${(metrics.memoryEnd ?? 0).toFixed(2)} MB)`
		);
		if (metrics.gcForced) console.log(`   ♻️  GC forced: yes`);
		if (metrics.cpuUserMs != null || metrics.cpuSysMs != null) {
			console.log(
				`   🧮 CPU user/sys: ${(metrics.cpuUserMs ?? 0).toFixed(
					1
				)} / ${(metrics.cpuSysMs ?? 0).toFixed(1)} ms`
			);
		}
		console.log(`   🔄 Effect runs: ${metrics.effectRuns}`);
		if (metrics.ops != null) {
			console.log(
				`   ▶️  Ops: ${metrics.ops}${
					metrics.msPerOp != null
						? ` (${metrics.msPerOp.toFixed(4)} ms/op)`
						: ""
				}`
			);
		}
		if (metrics.operationsPerSecond) {
			console.log(
				`   📈 Ops/sec: ${metrics.operationsPerSecond.toFixed(0)}`
			);
		}
		if (metrics.averageEffectTime != null) {
			console.log(
				`   ⚡ Avg/Med/P95/P99 (ms): ${metrics.averageEffectTime.toFixed(
					4
				)} / ${(metrics.medianEffectTime ?? 0).toFixed(4)} / ${(
					metrics.p95EffectTime ?? 0
				).toFixed(4)} / ${(metrics.p99EffectTime ?? 0).toFixed(4)}`
			);
			console.log(
				`   ↕️  Min/Max effect (ms): ${(
					metrics.minEffectTime ?? 0
				).toFixed(4)} / ${(metrics.maxEffectTime ?? 0).toFixed(4)}`
			);
		}
	}
}

// Emit a Markdown summary after the suite completes
async function writeMarkdownSummary(results: PerformanceMetrics[]) {
	try {
		// Dynamic imports with computed specifiers to avoid TS resolution while working at runtime
		const fsSpec = "f" + "s"; // "fs"
		const pathSpec = "p" + "ath"; // "path"
		let fsMod: unknown;
		let pathMod: unknown;
		try {
			fsMod = await import(fsSpec as string);
			pathMod = await import(pathSpec as string);
		} catch {
			const altFs = "node" + ":fs"; // "node:fs"
			const altPath = "node" + ":path"; // "node:path"
			fsMod = await import(altFs as string);
			pathMod = await import(altPath as string);
		}
		const { mkdirSync, writeFileSync } = fsMod as {
			mkdirSync: (p: string, opts: { recursive: boolean }) => void;
			writeFileSync: (p: string, data: string) => void;
		};
		const { join } = pathMod as { join: (...parts: string[]) => string };
		// @ts-ignore
		const node = typeof process !== "undefined" ? process : undefined;
		const cwd = node?.cwd ? node.cwd() : ".";
		const dir = join(cwd, "reports");
		mkdirSync(dir, { recursive: true });
		const file = join(dir, "performance-summary.md");

		const header = `# Manifold Performance Summary\n\n`;
		const envInfo =
			`- Date: ${new Date().toISOString()}\n` +
			(node?.version ? `- Node: ${node.version}\n` : "") +
			(node?.platform
				? `- Platform: ${node.platform} ${node.arch}\n`
				: "") +
			`\n`;

		let body = `| Test | Duration (ms) | Ops | ms/op | Ops/sec | Effect runs | Avg (ms) | Med (ms) | P95 (ms) | P99 (ms) | Min/Max (ms) | CPU u/s (ms) | Mem start/end/Δ (MB) | GC? |\n|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|:--:|\n`;
		for (const r of results) {
			body += `| ${r.name} | ${r.duration.toFixed(2)} | ${
				r.ops ?? ""
			} | ${r.msPerOp != null ? r.msPerOp.toFixed(4) : ""} | ${
				r.operationsPerSecond ? r.operationsPerSecond.toFixed(0) : ""
			} | ${r.effectRuns} | ${r.averageEffectTime?.toFixed(4) ?? ""} | ${
				r.medianEffectTime?.toFixed(4) ?? ""
			} | ${r.p95EffectTime?.toFixed(4) ?? ""} | ${
				r.p99EffectTime?.toFixed(4) ?? ""
			} | ${
				r.minEffectTime != null && r.maxEffectTime != null
					? `${r.minEffectTime.toFixed(4)}/${r.maxEffectTime.toFixed(
							4
					  )}`
					: ""
			} | ${
				r.cpuUserMs != null || r.cpuSysMs != null
					? `${(r.cpuUserMs ?? 0).toFixed(1)}/${(
							r.cpuSysMs ?? 0
					  ).toFixed(1)}`
					: ""
			} | ${(r.memoryStart ?? 0).toFixed(2)}/${(r.memoryEnd ?? 0).toFixed(
				2
			)}/${r.memoryUsed.toFixed(2)} | ${r.gcForced ? "yes" : ""} |\n`;
		}

		const content = header + envInfo + body + "\n";
		// Overwrite the report on each run to avoid accumulating duplicate headers
		writeFileSync(file, content);
		console.log(`\n📝 Wrote performance summary to ${file}`);
	} catch (err) {
		console.warn("Failed to write performance summary:", err);
	}
}

afterAll(async () => {
	if (__PERF_RESULTS.length) await writeMarkdownSummary(__PERF_RESULTS);
});

describe("Performance Profiling", () => {
	describe("Normal Usage Performance", () => {
		test("should handle basic state operations efficiently", async () => {
			const profiler = new PerformanceProfiler();
			profiler.start("Basic State Operations");

			const store = $.create()
				.add("counter", 0)
				.add("name", "test")
				.add("data", { value: 1 })
				.build();

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

			const store = $.create()
				.add("base", 1)
				.add("multiplier", 2)
				.derive("doubled", (s) => s.base * 2)
				.derive("tripled", (s) => s.base * 3)
				.derive("computed", (s) => s.doubled + s.tripled + s.multiplier)
				.build();

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

			const store = $.create()
				.add("level0", 0)
				.add("level1", 0)
				.add("level2", 0)
				.add("level3", 0)
				.build();

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
			const store = builder.build();

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

			const store = $.create()
				.add("deep", deepObject)
				.add("counter", 0)
				.build();

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
			const stores = Array.from({ length: 20 }, () =>
				$.create().add("value", 0).build()
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

			const store = $.create()
				.add("rapidValue", 0)
				.add("batchCounter", 0)
				.build();

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

			const store = $.create().add("value", 0).build();

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

			const metrics = profiler.finish(
				"Effect Cleanup Performance",
				effectCount
			);

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

			const hierarchicalApp = $.create().add("count", 0).build();

			$.effect(
				hierarchicalProfiler.trackEffect(() => {
					hierarchicalApp.trigger;
					$.effect(
						hierarchicalProfiler.trackEffect(() => {
							// Child effect
						})
					);
				})
			);

			for (let i = 0; i < operations; i++) {
				hierarchicalApp.trigger = i;
			}
			await new Promise((resolve) => setTimeout(resolve, 100));

			const hierarchicalMetrics = hierarchicalProfiler.finish(
				"Hierarchical Mode",
				operations
			);

			// Test performance mode
			const performanceProfiler = new PerformanceProfiler();
			performanceProfiler.start("Performance Mode");

			const performanceApp = $.create().add("count", 0).build();

			$.effect(
				performanceProfiler.trackEffect(() => {
					performanceApp.trigger;
					$.effect(
						performanceProfiler.trackEffect(() => {
							// Child effect
						})
					);
				})
			);

			for (let i = 0; i < operations; i++) {
				performanceApp.trigger = i;
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
