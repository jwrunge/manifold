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
	prefix = ""
): StateConstraint => {
	if (!obj || typeof obj !== _objStr) return obj;
	const notifyPath = (path: string) => {
		const effectSet = pathEffects.get(path);
		if (effectSet) {
			for (const effect of effectSet) pendingEffects.add(effect);
			if (!isFlushScheduled) {
				isFlushScheduled = true;
				queueMicrotask(flushEffects);
			}
		}
	};

	return new Proxy(obj, {
		get(state, key) {
			if (typeof key === "symbol") return state[key as symbol];
			const path = prefix ? `${prefix}.${_S(key)}` : _S(key);
			const curEffect = Effect.current;
			if (curEffect) {
				let effectSet = pathEffects.get(path);
				if (!effectSet) {
					effectSet = new Set();
					pathEffects.set(path, effectSet);
				}
				effectSet.add(curEffect);
				curEffect.deps.add(() => {
					effectSet?.delete(curEffect);
					if (effectSet?.size === 0) pathEffects.delete(path);
				});
			}
			const target = state[key as keyof typeof state];
			// Array mutating methods: wrap to emit structural notifications WITHOUT generic parent bubbling for objects
			if (Array.isArray(state) && typeof target === "function") {
				if (
					key === "push" ||
					key === "pop" ||
					key === "splice" ||
					key === "shift" ||
					key === "unshift" ||
					key === "sort" ||
					key === "reverse"
				) {
					return function (this: unknown[], ...args: unknown[]) {
						const arr = state as unknown[];
						const oldLen = arr.length;
						// Call original method
						// biome-ignore lint/suspicious/noExplicitAny: internal binding
						const result = (target as any).apply(arr, args);
						const newLen = arr.length;
						// Notify base array path so effects depending on the collection itself (e.g., each loops) rerun
						if (prefix) notifyPath(prefix);
						// Notify length path so effects explicitly depending on length rerun
						if (prefix) notifyPath(`${prefix}.length`);
						// For index-based watchers, we conservatively notify indices that might have changed at the tail or due to splice operations.
						if (key === "splice") {
							const start = (args[0] as number) ?? 0;
							const affected = Math.max(oldLen, newLen);
							for (let i = start; i < affected; i++)
								notifyPath(`${prefix}.${i}`);
						} else if (key === "push" || key === "unshift") {
							// New items added
							const start = key === "push" ? oldLen : 0;
							for (let i = start; i < newLen; i++)
								notifyPath(`${prefix}.${i}`);
						} else if (key === "pop") {
							notifyPath(`${prefix}.${oldLen - 1}`);
						} else if (key === "shift") {
							// shift changes indices; conservative: notify all indices
							for (let i = 0; i < newLen; i++)
								notifyPath(`${prefix}.${i}`);
						} else if (key === "sort" || key === "reverse") {
							for (let i = 0; i < newLen; i++)
								notifyPath(`${prefix}.${i}`);
						}
						return result;
					};
				}
			}
			return typeof target === _objStr && target
				? proxy(target, path)
				: target;
		},
		set(state, key, value) {
			if (typeof key === "symbol") {
				(state as Record<string | symbol, unknown>)[key] = value;
				return true;
			}
			const rec = state as Record<string, unknown>;
			if (isEqual(rec[key as string], value)) return true;
			rec[key as string] = value;
			const path = prefix ? `${prefix}.${_S(key)}` : _S(key);
			notifyPath(path);
			return true;
		},
	});
};

export default proxy;
