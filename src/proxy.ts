import { Effect, type Subscriptions } from "./Effect.ts";
import isEqual from "./equality.ts";
import type { IntermediateState } from "./main.ts";

const proxyCache = new WeakMap<object, IntermediateState>();
const depMap = new WeakMap<object, Map<PropertyKey, Subscriptions>>();
const OWN_KEYS = Symbol("mf:ownKeys");
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
					() => [],
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
const trackOwnKeys = (target: object) => {
	const curEffect = Effect._current;
	if (curEffect) track(target, OWN_KEYS, curEffect);
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
	const created = factory() as IntermediateState;
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
const hasOwn = (target: object, key: PropertyKey) => Object.hasOwn(target, key);
export const proxy = (obj: object): IntermediateState | Promise<unknown> => {
	if (!obj || typeof obj !== "object") return obj;
	// Do not proxy Promises!
	if (obj instanceof Promise) return obj;
	return getOrCreateProxy(
		obj,
		() =>
			new Proxy(obj, {
				get(state, key, receiver) {
					if (typeof key === "symbol") {
						if (key === Symbol.iterator || key === Symbol.toStringTag) {
							const val = Reflect.get(state, key, state);
							return typeof val === "function" ? val.bind(state) : val;
						}
						return Reflect.get(state, key, receiver);
					}
					const curEffect = Effect._current;
					const target = Reflect.get(state as object, key);
					const isObj = target && typeof target === "object";
					if (curEffect) track(state as object, key, curEffect);
					// Handle Set and Map methods to preserve correct `this` binding
					if (
						(state instanceof Set || state instanceof Map) &&
						typeof target === "function"
					) {
						return target.bind(state);
					}
					if (Array.isArray(state) && typeof target === "function") {
						if (arrMethods.includes(key as string)) {
							return function (this: unknown[], ...args: unknown[]) {
								const result = target.apply(state as unknown[], args);
								notify(state as object, "length");
								notify(state as object, OWN_KEYS);
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
					const existed = hasOwn(state as object, key);
					const prev = rec[key as string];
					if (prev === value || isEqual(prev, value)) return true;
					const isArr = Array.isArray(state);
					const prevLen = isArr ? (state as unknown[]).length : 0;
					rec[key as string] = value;
					notify(state as object, key);
					if (!existed) notify(state as object, OWN_KEYS);
					if (isArr && key !== "length") {
						const newLen = (state as unknown[]).length;
						if (newLen !== prevLen) notify(state as object, "length");
					}
					if (isArr && key === "length" && (value as number) < prevLen) {
						notify(state as object, OWN_KEYS);
					}
					return true;
				},
				deleteProperty(state, key) {
					if (typeof key === "symbol") {
						delete (state as Record<PropertyKey, unknown>)[key];
						return true;
					}
					if (!hasOwn(state as object, key)) return true;
					const success = delete (state as Record<string, unknown>)[key as string];
					if (!success) return false;
					notify(state as object, key);
					notify(state as object, OWN_KEYS);
					if (Array.isArray(state) && key !== "length") {
						notify(state as object, "length");
					}
					return true;
				},
				ownKeys(state) {
					trackOwnKeys(state as object);
					return Reflect.ownKeys(state);
				},
			}),
	);
};
/**
 * Create a small overlay proxy scoped to a base object.
 *
 * The returned proxy behaves like an overlay: reads fall back to `base` when
 * not present locally, while writes prefer the local overlay unless the key
 * exists on the base. This is used to create isolated view scopes.
 * @public
 */
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
				]),
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
