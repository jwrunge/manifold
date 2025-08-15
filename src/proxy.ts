import { type DepBucket, Effect } from "./Effect.ts";
import isEqual from "./equality.ts";
import type { StateConstraint } from "./main.ts"; // updated after rename

const _objStr = "object",
	_S = String;

// Cache proxies per original object + path prefix to avoid recreating proxies on every nested access.
// WeakMap -> (prefix -> proxy)
const proxyCache = new WeakMap<object, Map<string, unknown>>();

// New dependency map now stores versioned buckets per (object,key)
const depMap = new WeakMap<object, Map<PropertyKey, DepBucket>>();
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

// Lightweight internal logger (avoids scattering flag checks & try/catch)
const __log = (...args: unknown[]) => {
	const g = globalThis as unknown as Record<string, unknown>;
	if (!(g?.MF_TRACE || g?.MF_DEV_DEBUG)) return;
	try {
		console.log(...args);
	} catch {}
};

// Debug accessor for array version metadata
export const getArrayVersion = (arr: unknown): number | undefined => {
	if (!Array.isArray(arr)) return undefined;
	return arrayMeta.get(arr)?.version;
};

// Stats + scheduling stamps
let scheduleSeq = 0; // incremented each time we schedule a flush
const stats = {
	batches: 0,
	effectsScheduled: 0,
	effectsRan: 0,
	effectsSkipped: 0,
	maxBatchSize: 0,
	lastBatchSize: 0,
	avgBatchSize: 0,
	avgLevels: 0,
	lastLevels: 0,
	// timing
	lastDuration: 0,
	avgDuration: 0,
	totalDuration: 0,
	splitFlushes: 0,
	cap: Infinity as number,
};
// Scheduler configuration (flush cap)
let flushCap = Infinity; // can be set via debug API
const now = () =>
	typeof performance !== "undefined" && performance.now
		? performance.now()
		: Date.now();
const configureScheduler = (opts: { maxPerFlush?: number } = {}) => {
	if (opts.maxPerFlush != null && opts.maxPerFlush > 0) {
		flushCap = opts.maxPerFlush;
		stats.cap = flushCap;
	}
	return { maxPerFlush: flushCap }; // ensure used
};

// Attach to global manifold debug namespace if present / requested
(() => {
	try {
		const g = globalThis as unknown as Record<string, unknown>;
		if (g && (g.MF_DEBUG || g.MF_TRACE || g.MF_DEV_DEBUG)) {
			if (!g.__MF_MANIFOLD) g.__MF_MANIFOLD = {};
			const mf = g.__MF_MANIFOLD as Record<string, unknown>;
			if (!mf.debug) mf.debug = {};
			const dbg = mf.debug as Record<string, unknown>;
			if (!dbg.getArrayVersion) dbg.getArrayVersion = getArrayVersion;
			if (!dbg.scheduler) dbg.scheduler = {};
			const sched = dbg.scheduler as Record<string, unknown>;
			if (!sched.stats) sched.stats = stats;
			// expose configureScheduler to mark it used
			if (!sched.configure) sched.configure = configureScheduler;
			// Expose debug helpers lazily defined later
		}
	} catch {}
})();

const pendingEffects = new Set<Effect>();
let isFlushScheduled = false;

// Always hierarchical (sort by level)
const flushEffects = () => {
	// increment sequence for this actual flush
	++scheduleSeq; // reused as completed batch counter too
	const start = now();
	let effectsToRun = Array.from(pendingEffects);
	pendingEffects.clear();
	isFlushScheduled = false;
	// Optional capping / splitting
	if (effectsToRun.length > flushCap) {
		const slice = effectsToRun.slice(0, flushCap);
		const remainder = effectsToRun.slice(flushCap);
		for (const r of remainder) pendingEffects.add(r); // re-queue remainder
		if (remainder.length) {
			isFlushScheduled = true;
			queueMicrotask(flushEffects);
			stats.splitFlushes++;
		}
		effectsToRun = slice;
	}
	stats.batches++;
	stats.lastBatchSize = effectsToRun.length;
	if (effectsToRun.length > stats.maxBatchSize)
		stats.maxBatchSize = effectsToRun.length;
	// Compute avg batch size (EMA for stability)
	stats.avgBatchSize = stats.avgBatchSize
		? stats.avgBatchSize * 0.9 + effectsToRun.length * 0.1
		: effectsToRun.length;
	__log(
		"[mf][flush:start]",
		"count",
		effectsToRun.length,
		"ids",
		effectsToRun.map((e) => e.id)
	);
	if (effectsToRun.length <= 1) {
		for (const e of effectsToRun) {
			// Version pre-pass skip
			if (!e.shouldRun()) continue;
			stats.effectsRan++;
			e.run();
		}
		const dur = now() - start;
		stats.lastDuration = dur;
		stats.totalDuration += dur;
		stats.avgDuration = stats.avgDuration
			? stats.avgDuration * 0.9 + dur * 0.1
			: dur;
		return;
	}
	let maxLevel = 0;
	for (const e of effectsToRun) {
		if (e.level > maxLevel) maxLevel = e.level;
	}
	stats.lastLevels = maxLevel;
	stats.avgLevels = stats.avgLevels
		? stats.avgLevels * 0.9 + maxLevel * 0.1
		: maxLevel;
	// Fast path: all effects at level 0
	if (maxLevel === 0) {
		for (const e of effectsToRun) {
			if (!e.shouldRun()) continue;
			stats.effectsRan++;
			e.run();
		}
		const dur = now() - start;
		stats.lastDuration = dur;
		stats.totalDuration += dur;
		stats.avgDuration = stats.avgDuration
			? stats.avgDuration * 0.9 + dur * 0.1
			: dur;
		return;
	}
	const buckets: Effect[][] = Array.from({ length: maxLevel + 1 }, () => []);
	for (const e of effectsToRun) buckets[e.level].push(e);
	for (const bucket of buckets)
		for (const e of bucket) {
			if (!e.shouldRun()) continue;
			stats.effectsRan++;
			e.run();
		}
	const dur = now() - start;
	stats.lastDuration = dur;
	stats.totalDuration += dur;
	stats.avgDuration = stats.avgDuration
		? stats.avgDuration * 0.9 + dur * 0.1
		: dur;
	// Update exposed stats object (already referenced)
	stats; // noop hint
};

// Schedule all effects in a bucket
const scheduleBucket = (bucket: DepBucket, debugPath?: string) => {
	const batchMarker = scheduleSeq + 1;
	let scheduled = 0;
	const arr = bucket.effects;
	for (let i = 0; i < arr.length; i++) {
		const effect = arr[i];
		if (!effect) continue;
		stats.effectsScheduled++;
		const last = effect.lastScheduleStamp;
		if (last === batchMarker) {
			stats.effectsSkipped++;
			continue;
		}
		effect.lastScheduleStamp = batchMarker;
		effect.dirtySeq++;
		pendingEffects.add(effect);
		scheduled++;
	}
	if (!isFlushScheduled && scheduled) {
		isFlushScheduled = true;
		queueMicrotask(flushEffects);
	}
	if (debugPath && scheduled) {
		__log(
			"[mf][notify]",
			debugPath,
			"effects",
			arr.filter(Boolean).map((e) => (e as Effect).id)
		);
	}
};

const notify = (target: object, key: PropertyKey, debugPath?: string) => {
	const keyMap = depMap.get(target);
	if (!keyMap) return;
	const bucket = keyMap.get(key);
	if (bucket) {
		bucket.version++;
		scheduleBucket(bucket, debugPath);
	}
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
	let bucket = keyMap.get(key);
	if (!bucket) {
		bucket = { effects: [], map: new Map(), version: 0 } as DepBucket;
		keyMap.set(key, bucket);
	}
	if (!bucket.map.has(effect)) {
		bucket.effects.push(effect);
		const idx = bucket.effects.length - 1;
		bucket.map.set(effect, idx);
		effect._addDep(bucket, idx, bucket.version);
	} else {
		// Already tracked (duplicate read in same run) – no action needed
	}
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
				const curEffect = Effect.current;
				// Fast path: no tracking & primitive/non-object value
				const target = Reflect.get(state as object, key);
				const isObj = target && typeof target === _objStr;
				// If we need to track or create nested proxy we will build path lazily
				let path: string | undefined;
				const needPath = !!curEffect || isObj; // only reasons we require path internally (debug logging handled inside helpers)
				if (needPath) path = prefix ? `${prefix}.${_S(key)}` : _S(key);
				if (curEffect && path)
					track(state as object, key, curEffect, path);
				// Array mutating methods: wrap to emit structural notifications
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
				if (isObj) {
					if (!path) path = prefix ? `${prefix}.${_S(key)}` : _S(key);
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
				if (prev === value) return true; // ref or primitive equality short-circuit
				const bothObjects =
					prev &&
					value &&
					typeof prev === _objStr &&
					typeof value === _objStr;
				if (bothObjects && isEqual(prev, value)) return true;
				const isArr = Array.isArray(state);
				const prevLen = isArr ? (state as unknown[]).length : 0;
				rec[key as string] = value;
				// Notify dependents (path used only for debug logging; skip computing unless tracing enabled)
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
