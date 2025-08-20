import { Effect, type Subscriptions } from "./Effect.ts";
import isEqual from "./equality.ts";
import type { StateConstraint } from "./main.ts";

const proxyCache = new WeakMap<object, Map<string, unknown>>(); // Cache proxies per original object - WeakMap -> (prefix -> proxy)
const depMap = new WeakMap<object, Map<PropertyKey, Subscriptions>>(); // Stores buckets per (object,key)

const pendingEffects = new Set<Effect>();
let isFlushScheduled = false;

const flushEffects = () => {
	const effectsToRun = Array.from(pendingEffects);
	pendingEffects.clear();
	isFlushScheduled = false;

	const runAll = () => {
		if (effectsToRun.length > 1) {
			let maxLevel = 0;
			for (const e of effectsToRun)
				if (e.level > maxLevel) maxLevel = e.level;

			if (maxLevel > 0) {
				const buckets: Effect[][] = Array.from(
					{ length: maxLevel + 1 },
					() => []
				);

				for (const e of effectsToRun) buckets[e.level].push(e);
				for (const b of buckets) for (const e of b) e.run();
			} else {
				for (const e of effectsToRun) e.run();
			}
		} else for (const e of effectsToRun) e.run();
	};

	const complete = (document as Document | undefined)?.startViewTransition?.(
		runAll
	);
	if (!complete) runAll();
};

const batchEffects = (bucket: Subscriptions) => {
	let scheduled = 0;
	for (const effect of bucket.effects) {
		if (effect) {
			pendingEffects.add(effect);
			scheduled++;
		}
	}

	if (!isFlushScheduled && scheduled) {
		isFlushScheduled = true;
		queueMicrotask(flushEffects);
	}
};

const notify = (target: object, key: PropertyKey) => {
	const keyMap = depMap.get(target);
	if (keyMap) {
		const bucket = keyMap.get(key);
		if (bucket) batchEffects(bucket);
	}
};

const track = (
	target: object,
	key: PropertyKey,
	effect: Effect,
	_path: string
) => {
	let keyMap = depMap.get(target);
	if (!keyMap) {
		keyMap = new Map();
		depMap.set(target, keyMap);
	}

	let bucket = keyMap.get(key);
	if (!bucket) {
		bucket = { effects: [], map: new Map() };
		keyMap.set(key, bucket);
	}

	if (!bucket.map.has(effect)) {
		bucket.effects.push(effect);
		const idx = bucket.effects.length - 1;
		bucket.map.set(effect, idx);
		effect._addDep(bucket, idx);
	}
};

// biome-ignore lint/suspicious/noExplicitAny: internal helper
const getOrCreateProxy = (obj: any, prefix: string, factory: () => unknown) => {
	let entry = proxyCache.get(obj);
	if (!entry) {
		entry = new Map();
		proxyCache.set(obj, entry);
	}
	let cached = entry.get(prefix);
	if (!cached) {
		cached = factory();
		entry.set(prefix, cached);
	}
	return cached as StateConstraint;
};

// biome-ignore lint/suspicious/noExplicitAny: internal proxy factory
const proxy = (obj: any, prefix = ""): StateConstraint => {
	if (!obj || typeof obj !== "object") return obj;
	return getOrCreateProxy(
		obj,
		prefix,
		() =>
			new Proxy(obj, {
				get(state, key, receiver) {
					if (typeof key === "symbol")
						return Reflect.get(state, key, receiver);
					const curEffect = Effect.current;
					const target = Reflect.get(state as object, key);
					const isObj = target && typeof target === "object";
					let path: string | undefined;
					const needPath = !!curEffect || isObj;
					if (needPath) path = prefix ? `${prefix}.${key}` : key;
					if (curEffect && path)
						track(state as object, key, curEffect, path);
					if (Array.isArray(state) && typeof target === "function") {
						if (
							[
								"push",
								"pop",
								"splice",
								"shift",
								"unshift",
								"sort",
								"reverse",
							].includes(key)
						) {
							return function (
								this: unknown[],
								...args: unknown[]
							) {
								const arr = state as unknown[]; // biome-ignore lint/suspicious/noExplicitAny: function bind
								const result = (target as any).apply(arr, args);

								notify(state as object, "length");
								return result;
							};
						}
					}
					if (isObj) {
						if (!path) path = prefix ? `${prefix}.${key}` : key;
						return proxy(target, path);
					}
					return target;
				},
				set(state, key, value) {
					if (typeof key === "symbol") {
						(state as Record<PropertyKey, unknown>)[key] = value;
						return true;
					}
					const rec = state as Record<string, unknown>;
					const prev = rec[key as string];
					if (prev === value) return true;

					if (isEqual(prev, value)) return true;
					const isArr = Array.isArray(state);
					const prevLen = isArr ? (state as unknown[]).length : 0;
					rec[key as string] = value;
					notify(state as object, key);
					if (isArr && key !== "length") {
						const newLen = (state as unknown[]).length;
						if (newLen !== prevLen) {
							notify(state as object, "length");
						}
					}
					return true;
				},
			})
	);
};

export default proxy;
