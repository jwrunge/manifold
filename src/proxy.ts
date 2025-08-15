import { Effect } from "./Effect.ts";
import isEqual from "./equality.ts";
import type { StateConstraint } from "./main.ts"; // updated after rename

const _objStr = "object",
	_S = String;

// Cache proxies per original object + path prefix to avoid recreating proxies on every nested access.
// WeakMap -> (prefix -> proxy)
const proxyCache = new WeakMap<object, Map<string, unknown>>();

// New dependency map: WeakMap<object, Map<key, Set<Effect>>>
const depMap = new WeakMap<object, Map<PropertyKey, Set<Effect>>>();
// Parent references for nested objects (array structural notifications need to bubble to parent property watchers)
// Multiple parents allowed (same object referenced in different places)
interface ParentRef {
	parent: object;
	key: PropertyKey;
	path: string;
}
const parentRefs = new WeakMap<object, ParentRef[]>();
// Array metadata for structural versioning
const arrayMeta = new WeakMap<object, { version: number }>();

const pendingEffects = new Set<Effect>();
let isFlushScheduled = false;

// Always hierarchical (sort by level)
const flushEffects = () => {
	const effectsToRun = Array.from(pendingEffects);
	pendingEffects.clear();
	isFlushScheduled = false;
	const g = globalThis as unknown as Record<string, unknown>;
	if (g?.MF_TRACE) {
		try {
			console.log(
				"[mf][flush:start]",
				"count",
				effectsToRun.length,
				"ids",
				effectsToRun.map((e) => e.id)
			);
		} catch {}
	}
	effectsToRun.sort((a, b) => a.level - b.level);
	for (const effect of effectsToRun) effect.run();
};

const scheduleEffectSet = (set: Set<Effect>, debugPath?: string) => {
	for (const effect of set) pendingEffects.add(effect);
	if (!isFlushScheduled && set.size) {
		isFlushScheduled = true;
		queueMicrotask(flushEffects);
	}
	if (debugPath) {
		const g = globalThis as unknown as Record<string, unknown>;
		if (g?.MF_TRACE) {
			try {
				console.log(
					"[mf][notify]",
					debugPath,
					"effects",
					Array.from(set).map((e) => e.id)
				);
			} catch {}
		}
	}
};

const notify = (target: object, key: PropertyKey, debugPath?: string) => {
	const keyMap = depMap.get(target);
	if (!keyMap) return;
	const effectSet = keyMap.get(key);
	if (effectSet) scheduleEffectSet(effectSet, debugPath);
};

// Notify all parent property watchers for a nested object (used for array structural mutations & index writes)
const notifyParents = (obj: object) => {
	const parents = parentRefs.get(obj);
	if (!parents) return;
	for (const p of parents) notify(p.parent, p.key, p.path);
};

const track = (
	target: object,
	key: PropertyKey,
	effect: Effect,
	path: string
) => {
	let keyMap = depMap.get(target);
	if (!keyMap) {
		keyMap = new Map();
		depMap.set(target, keyMap);
	}
	let set = keyMap.get(key);
	if (!set) {
		set = new Set();
		keyMap.set(key, set);
	}
	set.add(effect);
	effect.deps.add(() => {
		set?.delete(effect);
		if (set && set.size === 0) keyMap?.delete(key);
		if (keyMap && keyMap.size === 0) depMap.delete(target);
	});
	const g = globalThis as unknown as Record<string, unknown>;
	if (g?.MF_TRACE) {
		try {
			console.log("[mf][track]", "effect", effect.id, "path", path);
		} catch {}
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
	// Avoid duplicate identical parent refs
	if (!arr.some((r) => r.parent === parent && r.key === key))
		arr.push({ parent, key, path });
};

const getOrCreateProxy = (
	// biome-ignore lint/suspicious/noExplicitAny: internal
	obj: any,
	prefix: string,
	factory: () => unknown
) => {
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

const proxy = (
	// biome-ignore lint/suspicious/noExplicitAny: internal
	obj: any,
	prefix = ""
): StateConstraint => {
	if (!obj || typeof obj !== _objStr) return obj;
	return getOrCreateProxy(obj, prefix, () => {
		return new Proxy(obj, {
			get(state, key, receiver) {
				if (typeof key === "symbol")
					return Reflect.get(state, key, receiver);
				const path = prefix ? `${prefix}.${_S(key)}` : _S(key);
				const curEffect = Effect.current;
				if (curEffect) track(state as object, key, curEffect, path);
				// Access property (avoid symbol indexing issue)
				const target = Reflect.get(state as object, key);
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
							// biome-ignore lint/suspicious/noExplicitAny: internal binding
							const result = (target as any).apply(arr, args);
							// Increment version stamp
							let meta = arrayMeta.get(state as object);
							if (!meta) {
								meta = { version: 0 };
								arrayMeta.set(state as object, meta);
							}
							meta.version++;
							// Notify collection-level + length watchers only (index watchers will re-track via parent rerun)
							notifyParents(state as object);
							notify(
								state as object,
								"length",
								prefix ? `${prefix}.length` : "length"
							);
							return result;
						};
					}
				}
				if (typeof target === _objStr && target) {
					addParentRef(target as object, state as object, key, path);
					return proxy(target, path);
				}
				return target;
			},
			set(state, key, value) {
				if (typeof key === "symbol") {
					(state as Record<string | symbol, unknown>)[key] = value;
					return true;
				}
				const rec = state as Record<string, unknown>;
				const prev = rec[key as string];
				// Fast path: identical reference or both primitives equal => no op
				if (prev === value) return true;
				// Deep equality only for non-primitive objects to preserve existing semantics in tests.
				const bothObjects =
					prev &&
					value &&
					typeof prev === _objStr &&
					typeof value === _objStr;
				if (bothObjects && isEqual(prev, value)) return true;
				const isArr = Array.isArray(state);
				const prevLen = isArr ? (state as unknown[]).length : 0;
				rec[key as string] = value;
				const path = prefix ? `${prefix}.${_S(key)}` : _S(key);
				notify(state as object, key, path);
				if (isArr && key !== "length") {
					// collection-level dependency
					notifyParents(state as object);
					// If length changed (extending or shrinking array), notify length and bump version
					const newLen = (state as unknown[]).length;
					if (newLen !== prevLen) {
						let meta = arrayMeta.get(state as object);
						if (!meta) {
							meta = { version: 0 };
							arrayMeta.set(state as object, meta);
						}
						meta.version++;
						notify(
							state as object,
							"length",
							prefix ? `${prefix}.length` : "length"
						);
					}
				}
				return true;
			},
		});
	});
};

export default proxy;
