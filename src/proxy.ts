import { Effect } from "./Effect.ts";
import isEqual from "./equality.ts";
import type { FuncsConstraint, State, StateConstraint } from "./State.ts";
import { useHierarchicalFlushing } from "./State.ts";

const _objStr = "object",
	_S = String;

// Track effects by property path using effect instances instead of functions
const pathEffects = new Map<string, Set<Effect>>();

// Batch system to deduplicate effect runs
const pendingEffects = new Set<Effect>();
let isFlushScheduled = false;

// Simple flush - O(n) - Maximum performance
const flushEffectsSimple = () => {
	const effectsToRun = Array.from(pendingEffects);
	pendingEffects.clear();
	isFlushScheduled = false;

	// Just run all effects - most efficient
	for (const effect of effectsToRun) {
		effect.run();
	}
};

// Hierarchical execution using Effect.level property - O(n log n)
const flushEffectsHierarchical = () => {
	const effectsToRun = Array.from(pendingEffects);
	pendingEffects.clear();
	isFlushScheduled = false;

	// Sort by level property - O(n log n)
	effectsToRun.sort((a, b) => a.level - b.level);

	for (const effect of effectsToRun) {
		effect.run();
	}
};

const proxy = (
	// biome-ignore lint/suspicious/noExplicitAny: non-user-facing types can be flexible
	obj: any,
	parentState: State<StateConstraint, FuncsConstraint>,
	prefix = ""
): StateConstraint => {
	if (!obj || typeof obj !== _objStr) return obj;
	return new Proxy(obj, {
		get(state, key) {
			const path = prefix ? `${prefix}.${_S(key)}` : _S(key);

			const effect = Effect.current;
			if (effect) {
				// Track effect instance, not function
				let effectSet = pathEffects.get(path);
				if (!effectSet) {
					effectSet = new Set();
					pathEffects.set(path, effectSet);
				}
				effectSet.add(effect);

				// Cleanup: remove effect from this path when effect is cleaned up
				effect.deps.add(() => {
					effectSet?.delete(effect);
					if (effectSet?.size === 0) {
						pathEffects.delete(path);
					}
				});
			}

			const target = state[key];
			return typeof target === _objStr && target
				? proxy(target, parentState, path)
				: target;
		},
		set(state, key, value) {
			if (isEqual(state[key], value)) return true;
			state[key] = value;

			const path = prefix ? `${prefix}.${_S(key)}` : _S(key);
			const effectSet = pathEffects.get(path);
			if (effectSet) {
				// Add effects to pending set (automatic deduplication)
				for (const effect of effectSet) {
					pendingEffects.add(effect);
				}

				// Schedule flush based on global strategy
				if (!isFlushScheduled) {
					isFlushScheduled = true;
					queueMicrotask(
						useHierarchicalFlushing
							? flushEffectsHierarchical
							: flushEffectsSimple
					);
				}
			}

			return true;
		},
	});
};

export default proxy;
