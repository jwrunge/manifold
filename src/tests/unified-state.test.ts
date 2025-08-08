import { expect, test, describe, beforeEach, vi, it } from "vitest";
import { State, batch, batchDOMUpdates, batchComputations } from "../State";

describe("Unified State System with Integrated Batching", () => {
	describe("Core Reactivity", () => {
		it("should handle basic reactivity synchronously", () => {
			const state = new State({ count: 0, name: "test" });
			let effectRuns = 0;

			state.effect(() => {
				effectRuns++;
				state.value.count; // Access to trigger tracking
			});

			expect(effectRuns).toBe(1); // Initial run

			state.value.count = 1;
			expect(effectRuns).toBe(2); // Should run synchronously
		});

		it("should handle nested object updates", () => {
			const state = new State({ user: { name: "Alice", age: 25 } });
			let updates = 0;

			state.effect(() => {
				updates++;
				state.value.user.name; // Track nested property
			});

			expect(updates).toBe(1);

			state.value.user.name = "Bob";
			expect(updates).toBe(2);
		});

		it("should handle derived/computed state", () => {
			const baseState = new State({ name: "john", age: 30 });
			const derivedState = State.createComputed(() => ({
				name: baseState.value.name.toUpperCase(),
				age: baseState.value.age + 10,
			}));

			expect(derivedState.value.name).toBe("JOHN");
			expect(derivedState.value.age).toBe(40);

			baseState.value = { name: "jane", age: 25 };
			expect(derivedState.value.name).toBe("JANE");
			expect(derivedState.value.age).toBe(35);
		});
	});

	describe("DOM Update Batching", () => {
		it("should batch DOM updates efficiently", async () => {
			const state = new State({ x: 0, y: 0 });
			const updates: any[] = [];

			// Simulate DOM updates that would normally happen individually
			state.effect(() => {
				state.batchDOMUpdate(() => {
					updates.push({ x: state.value.x, y: state.value.y });
				});
			});

			// Make multiple rapid changes
			state.value.x = 1;
			state.value.y = 2;

			// DOM updates should be batched
			await new Promise((resolve) => queueMicrotask(resolve));
			expect(updates.length).toBe(1);
			expect(updates[0]).toEqual({ x: 1, y: 2 });
		});

		it("should handle multiple DOM batches independently", async () => {
			const state1 = new State({ count: 0 });
			const state2 = new State({ value: 100 });
			const updates1: number[] = [];
			const updates2: number[] = [];

			state1.effect(() => {
				state1.batchDOMUpdate(() => updates1.push(state1.value.count));
			});

			state2.effect(() => {
				state2.batchDOMUpdate(() => updates2.push(state2.value.value));
			});

			state1.value.count = 1;
			state2.value.value = 200;
			state1.value.count = 2;

			await new Promise((resolve) => queueMicrotask(resolve));
			expect(updates1).toEqual([2]); // Only final value
			expect(updates2).toEqual([200]);
		});

		it("should use global DOM batching utility", async () => {
			const domUpdates: string[] = [];

			batchDOMUpdates(() => domUpdates.push("update1"));
			batchDOMUpdates(() => domUpdates.push("update2"));

			expect(domUpdates.length).toBe(0); // Not executed yet

			await new Promise((resolve) => queueMicrotask(resolve));
			expect(domUpdates).toEqual(["update1", "update2"]);
		});
	});

	describe("Computation Batching", () => {
		it("should batch computations efficiently", async () => {
			const state = new State({ numbers: [1, 2, 3] });
			const computations: number[] = [];

			state.effect(() => {
				state.batchComputation(() => {
					const sum = state.value.numbers.reduce((a, b) => a + b, 0);
					computations.push(sum);
				});
			});

			state.value.numbers = [1, 2, 3, 4];
			state.value.numbers = [1, 2, 3, 4, 5];

			await new Promise((resolve) => queueMicrotask(resolve));
			expect(computations.length).toBe(1);
			expect(computations[0]).toBe(15); // Final computation result
		});

		it("should use global computation batching utility", async () => {
			const results: string[] = [];

			batchComputations(() => results.push("calc1"));
			batchComputations(() => results.push("calc2"));

			expect(results.length).toBe(0); // Not executed yet

			await new Promise((resolve) => queueMicrotask(resolve));
			expect(results).toEqual(["calc1", "calc2"]);
		});
	});

	describe("Expression-Based Effects", () => {
		it("should handle expression-based effects", async () => {
			const state = new State({ user: { name: "Alice", age: 25 } });
			const results: any[] = [];

			// Use expression effect to track computed values
			state.expressionEffect("user.age >= 21", (value) => {
				results.push(value);
			});

			expect(results[0]).toBe(true); // Initial value

			state.value.user.age = 20;
			await new Promise((resolve) => queueMicrotask(resolve));
			expect(results[1]).toBe(false);
		});

		it("should cache expression evaluations for performance", async () => {
			const state = new State({ x: 5, y: 10 });
			const results: number[] = [];

			// Same expression used multiple times
			state.expressionEffect("x * y", (value) => results.push(value));
			state.expressionEffect("x * y", (value) => results.push(value + 1));

			expect(results[0]).toBe(50);
			expect(results[1]).toBe(51);

			state.value.x = 10;
			await new Promise((resolve) => queueMicrotask(resolve));
			expect(results[2]).toBe(100);
			expect(results[3]).toBe(101);
		});

		it("should handle complex expressions", async () => {
			const state = new State({
				items: [{ price: 10 }, { price: 20 }, { price: 30 }],
				tax: 0.1,
			});
			const results: number[] = [];

			state.expressionEffect(
				"items.reduce((sum, item) => sum + item.price, 0) * (1 + tax)",
				(value) => results.push(value)
			);

			expect(results[0]).toBe(66); // (10+20+30) * 1.1

			state.value.tax = 0.2;
			await new Promise((resolve) => queueMicrotask(resolve));
			expect(results[1]).toBe(72); // 60 * 1.2
		});

		it("should handle expression errors gracefully", async () => {
			const state = new State({ user: null });
			const results: any[] = [];

			state.expressionEffect("user.name.toUpperCase()", (value) => {
				results.push(value);
			});

			expect(results[0]).toBe(undefined); // Error handled gracefully
		});
	});

	describe("Template System", () => {
		it("should handle template system for multiple expressions", async () => {
			const state = new State({ name: "John", age: 30, city: "NYC" });
			const elements: any[] = [];

			// Simulate binding multiple expressions to DOM elements
			const cleanup = state.template([
				{
					expression: "name.toUpperCase()",
					update: (value) => elements.push(`name: ${value}`),
				},
				{
					expression: "age * 2",
					update: (value) => elements.push(`doubleAge: ${value}`),
				},
				{
					expression: "`${name} from ${city}`",
					update: (value) => elements.push(`info: ${value}`),
				},
			]);

			// Initial updates should be batched
			await new Promise((resolve) => queueMicrotask(resolve));
			expect(elements.length).toBe(3);
			expect(elements).toContain("name: JOHN");
			expect(elements).toContain("doubleAge: 60");
			expect(elements).toContain("info: John from NYC");

			cleanup();
		});

		it("should update template when state changes", async () => {
			const state = new State({ count: 0, multiplier: 2 });
			const results: string[] = [];

			const cleanup = state.template([
				{
					expression: "count * multiplier",
					update: (value) => results.push(`result: ${value}`),
				},
			]);

			await new Promise((resolve) => queueMicrotask(resolve));
			expect(results).toContain("result: 0");

			state.value.count = 5;
			await new Promise((resolve) => queueMicrotask(resolve));
			expect(results[results.length - 1]).toBe("result: 10");

			cleanup();
		});

		it("should clean up template bindings properly", async () => {
			const state = new State({ value: 1 });
			const results: number[] = [];

			const cleanup = state.template([
				{
					expression: "value * 2",
					update: (value) => results.push(value),
				},
			]);

			await new Promise((resolve) => queueMicrotask(resolve));
			expect(results.length).toBe(1);

			cleanup(); // Clean up bindings

			state.value.value = 10; // Should not trigger updates
			await new Promise((resolve) => queueMicrotask(resolve));
			expect(results.length).toBe(1); // No new updates
		});

		it("should use global template utility", async () => {
			const state = new State({ x: 1, y: 2 });
			const results: string[] = [];

			const cleanup = batch.template(state, [
				{
					expression: "x + y",
					update: (value) => results.push(`sum: ${value}`),
				},
			]);

			await new Promise((resolve) => queueMicrotask(resolve));
			expect(results).toContain("sum: 3");

			cleanup();
		});
	});

	describe("Computed Batches", () => {
		it("should handle computed batches", async () => {
			const numbers = new State([1, 2, 3, 4, 5]);

			const stats = numbers.computedBatch({
				sum: () => numbers.value.reduce((a, b) => a + b, 0),
				avg: () =>
					numbers.value.reduce((a, b) => a + b, 0) /
					numbers.value.length,
				max: () => Math.max(...numbers.value),
				min: () => Math.min(...numbers.value),
			});

			// Wait for initial computation
			await new Promise((resolve) => queueMicrotask(resolve));

			expect(stats.value.sum).toBe(15);
			expect(stats.value.avg).toBe(3);
			expect(stats.value.max).toBe(5);
			expect(stats.value.min).toBe(1);
		});

		it("should update computed batch when source changes", async () => {
			const data = new State([10, 20, 30]);

			const metrics = data.computedBatch({
				total: () => data.value.reduce((a, b) => a + b, 0),
				count: () => data.value.length,
			});

			await new Promise((resolve) => queueMicrotask(resolve));
			expect(metrics.value.total).toBe(60);
			expect(metrics.value.count).toBe(3);

			data.value = [10, 20, 30, 40];
			await new Promise((resolve) => queueMicrotask(resolve));
			expect(metrics.value.total).toBe(100);
			expect(metrics.value.count).toBe(4);
		});

		it("should handle complex computed batches", async () => {
			const state = new State({
				users: [
					{ name: "Alice", age: 25, active: true },
					{ name: "Bob", age: 30, active: false },
					{ name: "Charlie", age: 35, active: true },
				],
			});

			const userStats = state.computedBatch({
				totalUsers: () => state.value.users.length,
				activeUsers: () =>
					state.value.users.filter((u) => u.active).length,
				avgAge: () =>
					state.value.users.reduce((sum, u) => sum + u.age, 0) /
					state.value.users.length,
				activeNames: () =>
					state.value.users
						.filter((u) => u.active)
						.map((u) => u.name),
			});

			await new Promise((resolve) => queueMicrotask(resolve));
			expect(userStats.value.totalUsers).toBe(3);
			expect(userStats.value.activeUsers).toBe(2);
			expect(userStats.value.avgAge).toBe(30);
			expect(userStats.value.activeNames).toEqual(["Alice", "Charlie"]);
		});
	});

	describe("Global Batch Utilities", () => {
		it("should use global batch utilities", async () => {
			const state = new State({ a: 1, b: 2 });
			const computations: any[] = [];

			// Test global batch.compute
			batch.compute(() => {
				computations.push(state.value.a + state.value.b);
			});

			await new Promise((resolve) => queueMicrotask(resolve));
			expect(computations[0]).toBe(3);

			// Test batch.run for multiple changes
			const results: any[] = [];
			state.effect(() => {
				results.push(state.value.a + state.value.b);
			});

			batch.run(() => {
				state.value.a = 10;
				state.value.b = 20;
			});

			await new Promise((resolve) => queueMicrotask(resolve));
			expect(results[results.length - 1]).toBe(30);
		});

		it("should handle batch.run with complex updates", async () => {
			const state = new State({ items: [], total: 0 });
			const snapshots: any[] = [];

			state.effect(() => {
				snapshots.push({
					count: state.value.items.length,
					total: state.value.total,
				});
			});

			expect(snapshots.length).toBe(1); // Initial run

			batch.run(() => {
				state.value.items = [1, 2, 3];
				state.value.total = 6;
			});

			await new Promise((resolve) => queueMicrotask(resolve));
			// Should only have initial + final snapshots due to batching
			expect(snapshots[snapshots.length - 1]).toEqual({
				count: 3,
				total: 6,
			});
		});

		it("should handle nested batch operations", async () => {
			const state = new State({ x: 1, y: 1 });
			const domUpdates: number[] = [];
			const computations: number[] = [];

			batch.run(() => {
				batch.dom(() => domUpdates.push(state.value.x * state.value.y));
				batch.compute(() =>
					computations.push(state.value.x + state.value.y)
				);

				state.value.x = 5;
				state.value.y = 10;
			});

			await new Promise((resolve) => queueMicrotask(resolve));
			expect(domUpdates[0]).toBe(50); // Final values: 5 * 10
			expect(computations[0]).toBe(15); // Final values: 5 + 10
		});
	});

	describe("Performance and Edge Cases", () => {
		it("should handle rapid state changes efficiently", async () => {
			const state = new State({ counter: 0 });
			const domUpdates: number[] = [];
			const computations: number[] = [];

			state.effect(() => {
				state.batchDOMUpdate(() =>
					domUpdates.push(state.value.counter)
				);
				state.batchComputation(() =>
					computations.push(state.value.counter * 2)
				);
			});

			// Rapid updates
			for (let i = 1; i <= 100; i++) {
				state.value.counter = i;
			}

			await new Promise((resolve) => queueMicrotask(resolve));

			// Should be batched to only final values
			expect(domUpdates.length).toBe(1);
			expect(domUpdates[0]).toBe(100);
			expect(computations.length).toBe(1);
			expect(computations[0]).toBe(200);
		});

		it("should handle circular dependency detection", () => {
			const stateA = new State(1);
			const stateB = new State(1);
			let warningCount = 0;

			const originalWarn = console.warn;
			console.warn = () => warningCount++;

			try {
				// Create effects that will cause infinite circular updates
				stateA.effect(() => {
					stateB.value = stateA.value + Math.random(); // Use random to ensure changes
				});

				stateB.effect(() => {
					stateA.value = stateB.value + Math.random(); // Use random to ensure changes
				});

				stateA.value = 2; // Trigger circular updates

				// Should detect and prevent infinite loops
				expect(warningCount).toBeGreaterThan(0);
			} finally {
				console.warn = originalWarn;
			}
		});

		it("should handle state cleanup properly", () => {
			const state = new State({ value: 1 });
			let effectCount = 0;

			const cleanup = state.effect(() => {
				effectCount++;
				state.value.value;
			});

			expect(effectCount).toBe(1);

			state.value.value = 2;
			expect(effectCount).toBe(2);

			cleanup(); // Stop the effect

			state.value.value = 3;
			expect(effectCount).toBe(2); // Should not increase after cleanup
		});

		it("should handle large batch operations efficiently", async () => {
			const state = new State({ items: [] as number[] });
			const updates: number[] = [];

			state.effect(() => {
				state.batchDOMUpdate(() => {
					updates.push(state.value.items.length);
				});
			});

			batch.run(() => {
				// Large batch operation
				for (let i = 0; i < 1000; i++) {
					state.value.items = [...state.value.items, i];
				}
			});

			await new Promise((resolve) => queueMicrotask(resolve));

			// Should only have one update despite 1000 changes
			expect(updates.length).toBe(1);
			expect(updates[0]).toBe(1000);
		});
	});

	describe("Integration and Real-World Scenarios", () => {
		it("should handle complex UI component scenario", async () => {
			interface TodoItem {
				id: number;
				text: string;
				completed: boolean;
			}

			const appState = new State({
				todos: [] as TodoItem[],
				filter: "all" as "all" | "active" | "completed",
				newTodoText: "",
			});

			const domUpdates: string[] = [];

			// Simulate a todo app with multiple reactive bindings
			const cleanup = appState.template([
				{
					expression: "todos.length",
					update: (count) => domUpdates.push(`Total: ${count}`),
				},
				{
					expression: "todos.filter(t => !t.completed).length",
					update: (count) => domUpdates.push(`Active: ${count}`),
				},
				{
					expression: "todos.filter(t => t.completed).length",
					update: (count) => domUpdates.push(`Completed: ${count}`),
				},
			]);

			// Add todos in batch
			batch.run(() => {
				appState.value.todos = [
					{ id: 1, text: "Learn React", completed: false },
					{ id: 2, text: "Build App", completed: true },
					{ id: 3, text: "Test App", completed: false },
				];
			});

			await new Promise((resolve) => queueMicrotask(resolve));

			expect(domUpdates).toContain("Total: 3");
			expect(domUpdates).toContain("Active: 2");
			expect(domUpdates).toContain("Completed: 1");

			cleanup();
		});

		it("should handle dashboard-style aggregations", async () => {
			const analyticsState = new State({
				events: [
					{ type: "click", timestamp: Date.now(), value: 1 },
					{ type: "view", timestamp: Date.now(), value: 1 },
					{ type: "click", timestamp: Date.now(), value: 2 },
				],
				timeRange: "1h",
			});

			const dashboard = analyticsState.computedBatch({
				totalEvents: () => analyticsState.value.events.length,
				totalClicks: () =>
					analyticsState.value.events.filter(
						(e) => e.type === "click"
					).length,
				totalValue: () =>
					analyticsState.value.events.reduce(
						(sum, e) => sum + e.value,
						0
					),
				avgValue: () => {
					const events = analyticsState.value.events;
					return events.length > 0
						? events.reduce((sum, e) => sum + e.value, 0) /
								events.length
						: 0;
				},
			});

			await new Promise((resolve) => queueMicrotask(resolve));

			expect(dashboard.value.totalEvents).toBe(3);
			expect(dashboard.value.totalClicks).toBe(2);
			expect(dashboard.value.totalValue).toBe(4);
			expect(dashboard.value.avgValue).toBe(4 / 3);
		});
	});
});
