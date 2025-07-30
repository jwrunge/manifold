#!/usr/bin/env node

/**
 * Performance Analysis Tool for Manifold
 *
 * This tool runs comprehensive performance tests and generates
 * detailed reports with optimization recommendations.
 */

import { performance } from "perf_hooks";
import { State } from "./src/State.js";
import { RegEl } from "./src/registry.js";
import { evaluateExpression } from "./src/expression-parser.js";

// Test Configuration
const TEST_CONFIG = {
	iterations: {
		rapid: 1000,
		batch: 100,
		dom: 50,
		parsing: 500,
		each: 500,
	},
	thresholds: {
		rapid: 50, // ms
		batch: 30, // ms
		dom: 100, // ms
		parsing: 100, // ms
		each: 500, // ms
	},
};

// Utility Functions
const measureTime = async (fn) => {
	const start = performance.now();
	await fn();
	return performance.now() - start;
};

const getMemoryUsage = () => {
	if (process.memoryUsage) {
		const mem = process.memoryUsage();
		return {
			rss: Math.round((mem.rss / 1024 / 1024) * 100) / 100,
			heapUsed: Math.round((mem.heapUsed / 1024 / 1024) * 100) / 100,
			heapTotal: Math.round((mem.heapTotal / 1024 / 1024) * 100) / 100,
			external: Math.round((mem.external / 1024 / 1024) * 100) / 100,
		};
	}
	return null;
};

const formatTime = (ms) => {
	if (ms < 1) return `${(ms * 1000).toFixed(2)}μs`;
	if (ms < 1000) return `${ms.toFixed(2)}ms`;
	return `${(ms / 1000).toFixed(2)}s`;
};

const formatThroughput = (operations, timeMs) => {
	const opsPerSec = Math.round(operations / (timeMs / 1000));
	return `${opsPerSec.toLocaleString()} ops/sec`;
};

// Performance Tests
class PerformanceTester {
	constructor() {
		this.results = {};
		this.memoryStart = getMemoryUsage();
	}

	async runStateReactivityTests() {
		console.log("\n🔄 State Reactivity Performance Tests");
		console.log("=".repeat(50));

		// Rapid Updates Test
		const rapidResults = await this.testRapidUpdates();
		console.log(
			`✓ Rapid Updates: ${formatTime(
				rapidResults.time
			)} (${formatThroughput(
				TEST_CONFIG.iterations.rapid,
				rapidResults.time
			)})`
		);

		// Batch Updates Test
		const batchResults = await this.testBatchUpdates();
		console.log(
			`✓ Batch Updates: ${formatTime(batchResults.time)} (${
				batchResults.effectRuns
			} effect runs)`
		);

		// Deep Object Updates Test
		const deepResults = await this.testDeepObjectUpdates();
		console.log(
			`✓ Deep Objects: ${formatTime(
				deepResults.time
			)} (efficient batching: ${deepResults.batched})`
		);

		this.results.reactivity = { rapidResults, batchResults, deepResults };
		return this.results.reactivity;
	}

	async testRapidUpdates() {
		const state = new State(0);
		let updateCount = 0;

		const cleanup = state.effect(() => {
			updateCount++;
		});

		const time = await measureTime(() => {
			for (let i = 0; i < TEST_CONFIG.iterations.rapid; i++) {
				state.value = i;
			}
		});

		cleanup();
		return { time, updateCount };
	}

	async testBatchUpdates() {
		const state1 = new State(0);
		const state2 = new State(0);
		const computed = new State(() => state1.value + state2.value);
		let effectRuns = 0;

		const cleanup = computed.effect(() => {
			effectRuns++;
			computed.value; // Trigger computation
		});

		const time = await measureTime(() => {
			for (let i = 0; i < TEST_CONFIG.iterations.batch; i++) {
				state1.value = i;
				state2.value = i * 2;
			}
		});

		cleanup();
		return { time, effectRuns };
	}

	async testDeepObjectUpdates() {
		const state = new State({ count: 0, data: { nested: "value" } });
		let updateCount = 0;

		const cleanup = state.effect(() => {
			updateCount++;
		});

		const time = await measureTime(() => {
			for (let i = 0; i < 50; i++) {
				state.value = { count: i, data: { nested: `value-${i}` } };
			}
		});

		cleanup();
		return { time, batched: updateCount < 50 };
	}

	async runDOMPerformanceTests() {
		console.log("\n🌐 DOM Performance Tests");
		console.log("=".repeat(50));

		// We can't run full DOM tests in Node.js, but we can test the binding logic
		const bindingResults = await this.testBindingPerformance();
		console.log(
			`✓ Binding Logic: ${formatTime(
				bindingResults.time
			)} (${formatThroughput(
				bindingResults.operations,
				bindingResults.time
			)})`
		);

		this.results.dom = { bindingResults };
		return this.results.dom;
	}

	async testBindingPerformance() {
		const state = new State("test");
		let operations = 0;

		const time = await measureTime(() => {
			for (let i = 0; i < TEST_CONFIG.iterations.dom; i++) {
				state.value = `Update ${i}`;
				operations++;
			}
		});

		return { time, operations };
	}

	async runExpressionParsingTests() {
		console.log("\n📝 Expression Parsing Performance Tests");
		console.log("=".repeat(50));

		const simpleResults = await this.testSimpleExpressions();
		console.log(
			`✓ Simple Expressions: ${formatTime(
				simpleResults.time
			)} (${formatThroughput(simpleResults.count, simpleResults.time)})`
		);

		const complexResults = await this.testComplexExpressions();
		console.log(
			`✓ Complex Expressions: ${formatTime(
				complexResults.time
			)} (${formatThroughput(complexResults.count, complexResults.time)})`
		);

		this.results.parsing = { simpleResults, complexResults };
		return this.results.parsing;
	}

	async testSimpleExpressions() {
		const expressions = [
			"@counter",
			"@user.name",
			"@counter + 1",
			"@user.name + ' is active'",
			"@items.length > 0",
		];

		let count = 0;
		const time = await measureTime(() => {
			for (let i = 0; i < TEST_CONFIG.iterations.parsing; i++) {
				expressions.forEach((expr) => {
					evaluateExpression(expr);
					count++;
				});
			}
		});

		return { time, count };
	}

	async testComplexExpressions() {
		const expressions = [
			"@user.preferences.theme === 'dark' ? '#000' : '#fff'",
			"@items.filter(item => item.done).length + ' completed'",
			"@counter * 2 + @user.score - (@items.length || 0)",
			"@user.name.toUpperCase() + ' (' + (@user.verified ? 'verified' : 'unverified') + ')'",
		];

		let count = 0;
		const time = await measureTime(() => {
			for (let i = 0; i < TEST_CONFIG.iterations.parsing / 2; i++) {
				expressions.forEach((expr) => {
					evaluateExpression(expr);
					count++;
				});
			}
		});

		return { time, count };
	}

	async runMemoryTests() {
		console.log("\n🧠 Memory Usage Analysis");
		console.log("=".repeat(50));

		const memoryResults = await this.testMemoryUsage();
		console.log(`✓ Memory Growth: ${memoryResults.growth.toFixed(2)}MB`);
		console.log(
			`✓ Cleanup Efficiency: ${
				memoryResults.cleanupEfficient ? "Good" : "Needs Attention"
			}`
		);

		this.results.memory = memoryResults;
		return this.results.memory;
	}

	async testMemoryUsage() {
		const startMemory = getMemoryUsage();

		// Create many states and effects
		const states = [];
		const cleanupFunctions = [];

		for (let i = 0; i < 100; i++) {
			const state = new State(i);
			states.push(state);

			const cleanup = state.effect(() => {
				const value = state.value;
			});
			cleanupFunctions.push(cleanup);
		}

		const peakMemory = getMemoryUsage();

		// Clean up all effects
		cleanupFunctions.forEach((cleanup) => cleanup());

		// Force garbage collection if available
		if (global.gc) {
			global.gc();
		}

		const finalMemory = getMemoryUsage();

		return {
			start: startMemory?.heapUsed || 0,
			peak: peakMemory?.heapUsed || 0,
			final: finalMemory?.heapUsed || 0,
			growth: (finalMemory?.heapUsed || 0) - (startMemory?.heapUsed || 0),
			cleanupEfficient:
				(finalMemory?.heapUsed || 0) <
				(peakMemory?.heapUsed || 0) * 1.1,
		};
	}

	generateReport() {
		console.log("\n📊 Performance Analysis Report");
		console.log("=".repeat(60));

		const issues = [];
		const recommendations = [];

		// Analyze Reactivity Performance
		if (this.results.reactivity) {
			const { rapidResults, batchResults } = this.results.reactivity;

			if (rapidResults.time > TEST_CONFIG.thresholds.rapid) {
				issues.push(
					`⚠️  Rapid state updates are slow: ${formatTime(
						rapidResults.time
					)}`
				);
				recommendations.push(
					"Consider optimizing State.value setter or effect batching"
				);
			}

			if (batchResults.time > TEST_CONFIG.thresholds.batch) {
				issues.push(
					`⚠️  Batch updates are slow: ${formatTime(
						batchResults.time
					)}`
				);
				recommendations.push(
					"Review effect batching algorithm efficiency"
				);
			}
		}

		// Analyze DOM Performance
		if (this.results.dom) {
			const { bindingResults } = this.results.dom;

			if (bindingResults.time > TEST_CONFIG.thresholds.dom) {
				issues.push(
					`⚠️  DOM binding logic is slow: ${formatTime(
						bindingResults.time
					)}`
				);
				recommendations.push(
					"Optimize RegEl.register or binding update logic"
				);
			}
		}

		// Analyze Parsing Performance
		if (this.results.parsing) {
			const { simpleResults, complexResults } = this.results.parsing;

			if (simpleResults.time > TEST_CONFIG.thresholds.parsing) {
				issues.push(
					`⚠️  Simple expression parsing is slow: ${formatTime(
						simpleResults.time
					)}`
				);
				recommendations.push(
					"Add expression caching or optimize parser"
				);
			}

			if (complexResults.time > TEST_CONFIG.thresholds.parsing) {
				issues.push(
					`⚠️  Complex expression parsing is slow: ${formatTime(
						complexResults.time
					)}`
				);
				recommendations.push(
					"Implement advanced expression optimization"
				);
			}
		}

		// Analyze Memory Usage
		if (this.results.memory) {
			const { growth, cleanupEfficient } = this.results.memory;

			if (growth > 5) {
				issues.push(`⚠️  High memory growth: ${growth.toFixed(2)}MB`);
				recommendations.push(
					"Check for memory leaks in State or Effect cleanup"
				);
			}

			if (!cleanupEfficient) {
				issues.push(`⚠️  Inefficient memory cleanup detected`);
				recommendations.push(
					"Improve garbage collection or cleanup logic"
				);
			}
		}

		// Display Results
		if (issues.length === 0) {
			console.log(
				"✅ All performance metrics are within acceptable ranges!"
			);
		} else {
			console.log("\n🚨 Performance Issues Found:");
			issues.forEach((issue) => console.log(`   ${issue}`));
		}

		if (recommendations.length > 0) {
			console.log("\n💡 Optimization Recommendations:");
			recommendations.forEach((rec, i) =>
				console.log(`   ${i + 1}. ${rec}`)
			);
		}

		console.log("\n📈 Summary:");
		console.log(`   Total Tests: ${Object.keys(this.results).length}`);
		console.log(`   Issues Found: ${issues.length}`);
		console.log(
			`   Memory Growth: ${
				this.results.memory?.growth?.toFixed(2) || "N/A"
			}MB`
		);

		return {
			issues,
			recommendations,
			results: this.results,
		};
	}

	async runFullSuite() {
		console.log("🚀 Starting Manifold Performance Analysis\n");

		await this.runStateReactivityTests();
		await this.runDOMPerformanceTests();
		await this.runExpressionParsingTests();
		await this.runMemoryTests();

		const report = this.generateReport();

		console.log("\n✨ Performance analysis complete!");
		return report;
	}
}

// CLI Runner
async function main() {
	const tester = new PerformanceTester();
	const report = await tester.runFullSuite();

	// Exit with error code if issues found
	process.exit(report.issues.length > 0 ? 1 : 0);
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
	main().catch(console.error);
}

export { PerformanceTester, TEST_CONFIG };
