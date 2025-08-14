import { Effect } from "./Effect.ts";
import isEqual from "./equality.ts";
import type { StateConstraint } from "./main.ts"; // updated after rename

const _objStr = "object",
	_S = String;

const pathEffects = new Map<string, Set<Effect>>();
const pendingEffects = new Set<Effect>();
let isFlushScheduled = false;

// Always hierarchical (sort by level)
const flushEffects = () => {
	const effectsToRun = Array.from(pendingEffects);
	pendingEffects.clear();
	isFlushScheduled = false;
	effectsToRun.sort((a, b) => a.level - b.level);
	for (const effect of effectsToRun) effect.run();
};

const proxy = (
	// biome-ignore lint/suspicious/noExplicitAny: internal
	obj: any,
	prefix = "",
): StateConstraint => {
	if (!obj || typeof obj !== _objStr) return obj;
	return new Proxy(obj, {
		get(state, key) {
			const path = prefix ? `${prefix}.${_S(key)}` : _S(key);
			const effect = Effect.current;
			if (effect) {
				let effectSet = pathEffects.get(path);
				if (!effectSet) {
					effectSet = new Set();
					pathEffects.set(path, effectSet);
				}
				effectSet.add(effect);
				effect.deps.add(() => {
					effectSet?.delete(effect);
					if (effectSet?.size === 0) pathEffects.delete(path);
				});
			}
			const target = state[key];
			return typeof target === _objStr && target ? proxy(target, path) : target;
		},
		set(state, key, value) {
			if (isEqual(state[key], value)) return true;
			state[key] = value;
			const path = prefix ? `${prefix}.${_S(key)}` : _S(key);
			const effectSet = pathEffects.get(path);
			if (effectSet) {
				for (const effect of effectSet) pendingEffects.add(effect);
				if (!isFlushScheduled) {
					isFlushScheduled = true;
					queueMicrotask(flushEffects);
				}
			}
			return true;
		},
	});
};

export default proxy;
