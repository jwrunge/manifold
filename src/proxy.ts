import { type DepBucket, Effect } from "./Effect.ts";
import isEqual from "./equality.ts";
import type { StateConstraint } from "./main.ts";

// Cache proxies per original object + path prefix to avoid recreating proxies on every nested access.
// WeakMap -> (prefix -> proxy)
const proxyCache = new WeakMap<object, Map<string, unknown>>();

// Dependency map stores buckets per (object,key)
const depMap = new WeakMap<object, Map<PropertyKey, DepBucket>>();
interface ParentRef {
	parent: object;
	key: PropertyKey;
	path: string;
}
const parentRefs = new WeakMap<object, ParentRef[]>();
const arrayMeta = new WeakMap<object, { version: number }>();

export const getArrayVersion = (arr: unknown): number | undefined =>
	Array.isArray(arr) ? arrayMeta.get(arr)?.version : undefined;

const pendingEffects = new Set<Effect>();
let isFlushScheduled = false;

const flushEffects = () => {
	const effectsToRun = Array.from(pendingEffects);
	pendingEffects.clear();
	isFlushScheduled = false;
	if (effectsToRun.length <= 1) {
		for (const e of effectsToRun) e.run();
		return;
	}
	let maxLevel = 0;
	for (const e of effectsToRun) if (e.level > maxLevel) maxLevel = e.level;
	if (maxLevel === 0) {
		for (const e of effectsToRun) e.run();
		return;
	}
	const buckets: Effect[][] = Array.from({ length: maxLevel + 1 }, () => []);
	for (const e of effectsToRun) buckets[e.level].push(e);
	for (const b of buckets) for (const e of b) e.run();
};

const scheduleBucket = (bucket: DepBucket) => {
	let scheduled = 0;
	for (let i = 0; i < bucket.effects.length; i++) {
		const effect = bucket.effects[i];
		if (!effect) continue;
		pendingEffects.add(effect);
		scheduled++;
	}
	if (!isFlushScheduled && scheduled) {
		isFlushScheduled = true;
		queueMicrotask(flushEffects);
	}
};

const notify = (target: object, key: PropertyKey) => {
	const keyMap = depMap.get(target);
	if (!keyMap) return;
	const bucket = keyMap.get(key);
	if (bucket) scheduleBucket(bucket);
};

const notifyParents = (obj: object) => {
	const parents = parentRefs.get(obj);
	if (!parents) return;
	for (const p of parents) notify(p.parent, p.key);
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

const addParentRef = (
	child: object,
	parent: object,
	key: PropertyKey,
	path: string
) => {
	let arr = parentRefs.get(child);
	if (!arr) {
		arr = [];
		parentRefs.set(child, arr);
	}
	if (!arr.some((r) => r.parent === parent && r.key === key))
		arr.push({ parent, key, path });
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
								let meta = arrayMeta.get(state as object);
								if (!meta) {
									meta = { version: 0 };
									arrayMeta.set(state as object, meta);
								}
								meta.version++;
								notifyParents(state as object);
								notify(state as object, "length");
								return result;
							};
						}
					}
					if (isObj) {
						if (!path) path = prefix ? `${prefix}.${key}` : key;
						addParentRef(
							target as object,
							state as object,
							key,
							path
						);
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
					const bothObjects =
						prev &&
						value &&
						typeof prev === "object" &&
						typeof value === "object";
					if (bothObjects && isEqual(prev, value)) return true;
					const isArr = Array.isArray(state);
					const prevLen = isArr ? (state as unknown[]).length : 0;
					rec[key as string] = value;
					notify(state as object, key);
					if (isArr && key !== "length") {
						notifyParents(state as object);
						const newLen = (state as unknown[]).length;
						if (newLen !== prevLen) {
							let meta = arrayMeta.get(state as object);
							if (!meta) {
								meta = { version: 0 };
								arrayMeta.set(state as object, meta);
							}
							meta.version++;
							notify(state as object, "length");
						}
					}
					return true;
				},
			})
	);
};
export default proxy;
