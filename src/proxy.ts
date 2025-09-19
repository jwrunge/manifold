import { Effect, type Subscriptions } from "./Effect.ts";
import isEqual from "./equality.ts";
import type { StateConstraint } from "./main.ts";

const proxyCache = new WeakMap<object, StateConstraint>();
const depMap = new WeakMap<object, Map<PropertyKey, Subscriptions>>();
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
				if (e._level > maxLevel) maxLevel = e._level;
			if (maxLevel > 0) {
				const buckets: Effect[][] = Array.from(
					{ length: maxLevel + 1 },
					() => []
				);
				for (const e of effectsToRun) buckets[e._level].push(e);
				for (const b of buckets) for (const e of b) e._run();
			} else {
				for (const e of effectsToRun) e._run();
			}
		} else for (const e of effectsToRun) e._run();
	};
	runAll();
};
const batchEffects = (bucket: Subscriptions) => {
	let scheduled = 0;
	for (const effect of bucket._effects) {
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
	const bucket = depMap.get(target)?.get(key);
	if (bucket) batchEffects(bucket);
};
const track = (target: object, key: PropertyKey, effect: Effect) => {
	let keyMap = depMap.get(target);
	if (!keyMap) {
		keyMap = new Map();
		depMap.set(target, keyMap);
	}
	let bucket = keyMap.get(key);
	if (!bucket) {
		bucket = { _effects: [], _map: new Map() };
		keyMap.set(key, bucket);
	}
	if (!bucket._map.has(effect)) {
		bucket._effects.push(effect);
		const idx = bucket._effects.length - 1;
		bucket._map.set(effect, idx);
		effect._addDep(bucket, idx);
	}
};
const getOrCreateProxy = (obj: object, factory: () => unknown) => {
	const cached = proxyCache.get(obj);
	if (cached) return cached;
	const created = factory() as StateConstraint;
	proxyCache.set(obj, created);
	return created;
};
const arrMethods = [
	"push",
	"pop",
	"splice",
	"shift",
	"unshift",
	"sort",
	"reverse",
];
export const proxy = (obj: object): StateConstraint | Promise<unknown> => {
	if (!obj || typeof obj !== "object") return obj;
	// Do not proxy Promises!
	if (obj instanceof Promise) return obj;
	return getOrCreateProxy(
		obj,
		() =>
			new Proxy(obj, {
				get(state, key, receiver) {
					if (typeof key === "symbol")
						return Reflect.get(state, key, receiver);
					const curEffect = Effect._current;
					const target = Reflect.get(state as object, key);
					const isObj = target && typeof target === "object";
					if (curEffect) track(state as object, key, curEffect);
					if (Array.isArray(state) && typeof target === "function") {
						if (arrMethods.includes(key as string)) {
							return function (
								this: unknown[],
								...args: unknown[]
							) {
								const result = target.apply(
									state as unknown[],
									args
								);
								notify(state as object, "length");
								return result;
							};
						}
					}
					if (isObj) return proxy(target);
					return target;
				},
				set(state, key, value) {
					if (typeof key === "symbol") {
						(state as Record<PropertyKey, unknown>)[key] = value;
						return true;
					}
					const rec = state as Record<string, unknown>;
					const prev = rec[key as string];
					if (prev === value || isEqual(prev, value)) return true;
					const isArr = Array.isArray(state);
					const prevLen = isArr ? (state as unknown[]).length : 0;
					rec[key as string] = value;
					notify(state as object, key);
					if (isArr && key !== "length") {
						const newLen = (state as unknown[]).length;
						if (newLen !== prevLen)
							notify(state as object, "length");
					}
					return true;
				},
			})
	);
};
export const scopeProxy = <T extends object>(base: T): T => {
	const localTarget: Record<PropertyKey, unknown> = Object.create(null);
	const local = proxy(localTarget) as Record<PropertyKey, unknown>;
	const hasBase = (k: PropertyKey) => Reflect.has(base as object, k);
	const hasLocal = (k: PropertyKey) => Object.hasOwn(localTarget, k);
	return new Proxy(Object.create(null), {
		get(_t, k) {
			// Read local first to register dependency on overlay keys even if undefined
			const lv = local[k as never];
			if (hasLocal(k)) return lv as unknown;
			// Read through base so effects subscribe to base changes (base is already proxied upstream)
			return (base as typeof local)[k];
		},
		set(_t, k, v) {
			if (hasLocal(k)) local[k] = v;
			else if (hasBase(k)) (base as typeof local)[k] = v;
			else local[k] = v;
			return true;
		},
		has(_t, k) {
			return hasLocal(k) || hasBase(k);
		},
		ownKeys() {
			return Array.from(
				new Set([
					...Reflect.ownKeys(localTarget),
					...Reflect.ownKeys(base as object),
				])
			);
		},
		getOwnPropertyDescriptor(_t, k) {
			return (
				Reflect.getOwnPropertyDescriptor(localTarget, k) ??
				Reflect.getOwnPropertyDescriptor(base as object, k) ??
				undefined
			);
		},
	}) as unknown as T;
};
