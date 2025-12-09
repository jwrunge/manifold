import type { IntermediateState } from "../main.ts";
import { Effect, type Subscriptions } from "./effect.ts";
import isEqual from "./equality.ts";

const proxyCache = new WeakMap<object, IntermediateState>();
const depMap = new WeakMap<object, Map<PropertyKey, Subscriptions>>();
const OWN_KEYS = Symbol("mf:ownKeys");
const pendingEffects = new Set<Effect>();
let isFlushScheduled = false;

const flushEffects = () => {
	const effectsToRun = Array.from(pendingEffects);
	pendingEffects.clear();
	isFlushScheduled = false;
	if (effectsToRun.length > 1) {
		effectsToRun.sort((a, b) => a._level - b._level);
	}
	for (const effect of effectsToRun) effect._run();
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

const handleSymbolRead = (state: object, key: symbol, receiver: unknown) => {
	if (key === Symbol.iterator || key === Symbol.toStringTag) {
		const val = Reflect.get(state, key, state);
		return typeof val === "function" ? val.bind(state) : val;
	}
	return Reflect.get(state, key, receiver);
};
const handleSymbolWrite = (state: object, key: symbol, value: unknown) => {
	(state as Record<PropertyKey, unknown>)[key] = value;
	return true;
};
const handleSymbolDelete = (state: object, key: symbol) => {
	delete (state as Record<PropertyKey, unknown>)[key];
	return true;
};
const arrayLength = (state: unknown) =>
	Array.isArray(state) ? (state as unknown[]).length : 0;
const notifyArrayMutation = (
	state: object,
	key: PropertyKey,
	prevLen: number,
) => {
	if (!Array.isArray(state)) return;
	if (key === "length") {
		if (arrayLength(state) < prevLen) notify(state, OWN_KEYS);
		return;
	}
	if (arrayLength(state) !== prevLen) notify(state, "length");
};
const notifyArrayRemoval = (state: object, key: PropertyKey) => {
	if (Array.isArray(state) && key !== "length") notify(state, "length");
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
					if (typeof key === "symbol")
						return handleSymbolRead(state as object, key, receiver);
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
					if (typeof key === "symbol")
						return handleSymbolWrite(state as object, key, value);
					const rec = state as Record<string, unknown>;
					const existed = hasOwn(state as object, key);
					const prev = rec[key as string];
					if (prev === value || isEqual(prev, value)) return true;
					const prevLen = arrayLength(state);
					rec[key as string] = value;
					notify(state as object, key);
					if (!existed) notify(state as object, OWN_KEYS);
					notifyArrayMutation(state as object, key, prevLen);
					return true;
				},
				deleteProperty(state, key) {
					if (typeof key === "symbol")
						return handleSymbolDelete(state as object, key);
					if (!hasOwn(state as object, key)) return true;
					const success = delete (state as Record<string, unknown>)[
						key as string
					];
					if (!success) return false;
					notify(state as object, key);
					notify(state as object, OWN_KEYS);
					notifyArrayRemoval(state as object, key);
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
	const baseProxy = base as typeof local;
	const hasLocalKey = (k: PropertyKey) => Object.hasOwn(localTarget, k);
	const hasBaseKey = (k: PropertyKey) => Reflect.has(base as object, k);
	const writeValue = (k: PropertyKey, v: unknown) => {
		if (hasLocalKey(k)) local[k] = v;
		else if (hasBaseKey(k)) baseProxy[k] = v;
		else local[k] = v;
		return true;
	};
	const hasKey = (k: PropertyKey) => hasLocalKey(k) || hasBaseKey(k);
	return new Proxy(Object.create(null), {
		get(_t, k) {
			// Read local first to register dependency on overlay keys even if undefined
			const lv = local[k as never];
			if (hasLocalKey(k)) return lv as unknown;
			// Read through base so effects subscribe to base changes (base is already proxied upstream)
			return baseProxy[k];
		},
		set(_t, k, v) {
			return writeValue(k, v);
		},
		has(_t, k) {
			return hasKey(k);
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
