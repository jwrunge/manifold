export type EffectDependency = () => void;

const NOOP = () => {};

interface EffectOptions {
	Ephemeral?: boolean; // legacy (not used) - keeping casing safety
	ephemeral?: boolean;
}

// Internal dep reference used by Effect for cleanup & version pre-pass
interface DepRef {
	bucket: DepBucket;
	index: number;
	versionAtTrack: number;
}

// Bucket interface (duplicated here for type locality; actual instances created in proxy.ts)
export interface DepBucket {
	effects: (Effect | null)[];
	map: Map<Effect, number>; // effect -> index
	version: number; // increments on writes
	// Optional hole tracking for compaction
	holes?: number;
	// Free list of reusable indices (LIFO)
	free?: number[];
}

export class Effect {
	static current: Effect | null = null;
	static _idCounter = 0;
	// Ephemeral pooling
	static #pool: Effect[] = [];
	static #POOL_MAX = 1024;

	static acquire(fn: () => void, opts?: EffectOptions) {
		if (opts?.ephemeral) {
			const inst = Effect.#pool.pop();
			if (inst) {
				// Reinitialize reused instance
				inst.fn = fn;
				inst.#active = true;
				inst.#deps.length = 0; // should already be clean, safeguard
				inst.dirtySeq = 0;
				inst.level = 0; // will be recomputed if nested creations occur afterward
				inst.ephemeral = true;
				inst.inPool = false;
				inst.id = ++Effect._idCounter; // maintain monotonic ids (tests may rely on ordering determinism indirectly)
				inst.generation++;
				inst.lastScheduleStamp = 0; // reset scheduling marker (used externally)
				return inst;
			}
			return new Effect(fn, opts);
		}
		return new Effect(fn, opts);
	}

	// Replaces Set<EffectDependency>
	#deps: DepRef[] = [];
	#active = true;
	fn: () => void;
	level: number; // depth level for hierarchical ordering
	id: number;
	// Dirty sequence stamp (incremented each time effect is (re)schedule-requested)
	dirtySeq = 0;
	// Pool metadata
	ephemeral = false;
	inPool = false;
	generation = 0; // increments each reuse
	// Scheduling marker (replaces external WeakMap stamp so we can reset on reuse)
	lastScheduleStamp = 0;

	constructor(fn: () => void, opts?: EffectOptions) {
		this.fn = fn;
		this.level = Effect.current ? Effect.current.level + 1 : 0;
		this.id = ++Effect._idCounter;
		this.ephemeral = !!opts?.ephemeral;
		const g = globalThis as unknown as Record<string, unknown>;
		if (g?.MF_TRACE) {
			try {
				console.log(
					"[mf][effect:create]",
					this.id,
					"level",
					this.level,
					this.ephemeral ? "(ephemeral)" : ""
				);
			} catch {}
		}
	}

	// Called by tracking system to add dependency (avoids closure allocation)
	_addDep(bucket: DepBucket, index: number, version: number) {
		this.#deps.push({ bucket, index, versionAtTrack: version });
	}

	// Pre-pass to determine if any dependency version changed
	shouldRun(): boolean {
		// Feature flag controlled. Default: always run for correctness.
		let enable = false;
		try {
			const g = globalThis as unknown as Record<string, unknown>;
			if (g?.MF_ENABLE_VERSION_SKIP && !g?.MF_DISABLE_VERSION_SKIP) enable = true;
			if (g?.MF_DEBUG_FORCE_RUN) return true;
		} catch {}
		if (!enable) return true;
		for (let i = 0; i < this.#deps.length; i++) {
			const d = this.#deps[i];
			const curEff = d.bucket.effects[d.index];
			if (curEff !== this) return true; // conservative run
			if (d.bucket.version !== d.versionAtTrack) return true;
		}
		return false;
	}

	run() {
		if (!this.#active) return;
		this.#clean();

		// Set current effect and run function
		const prev = Effect.current;
		Effect.current = this;
		try {
			const g = globalThis as unknown as Record<string, unknown>;
			if (g?.MF_TRACE) {
				try {
					console.log("[mf][effect:run]", this.id);
				} catch {}
			}
			this.fn();
		} finally {
			Effect.current = prev;
		}
	}

	stop() {
		if (!this.#active) return;
		this.#active = false;
		const g = globalThis as unknown as Record<string, unknown>;
		if (g?.MF_TRACE) {
			try {
				console.log("[mf][effect:stop]", this.id);
			} catch {}
		}
		this.#clean();
		if (this.ephemeral && !this.inPool) {
			if (Effect.#pool.length < Effect.#POOL_MAX) {
				// Release captured closures early
				this.fn = NOOP;
				this.inPool = true;
				this.#deps.length = 0;
				this.dirtySeq = 0;
				this.lastScheduleStamp = 0;
				Effect.#pool.push(this);
			}
		}
	}

	#clean() {
		// Tombstone removal without array realloc
		for (const d of this.#deps) {
			const bucket = d.bucket;
			if (bucket.effects[d.index] === this) {
				bucket.effects[d.index] = null;
				bucket.map.delete(this);
				// Track hole + free list
				if (bucket.holes != null) bucket.holes++; else bucket.holes = 1;
				if (bucket.free) bucket.free.push(d.index); else bucket.free = [d.index];
				// Adaptive compaction threshold
				// Compact when holes exceed max(8, 25% of length) and at least 4 existing effects
				const len = bucket.effects.length;
				const holeThresh = Math.max(8, (len * 0.25) | 0);
				if (len >= 4 && bucket.holes > holeThresh) {
					const newArr: (Effect | null)[] = [];
					bucket.holes = 0;
					bucket.map.clear();
					bucket.free = [];
					for (const eff of bucket.effects) if (eff) {
						bucket.map.set(eff, newArr.length);
						newArr.push(eff);
					}
					bucket.effects = newArr;
				}
			}
		}
		this.#deps.length = 0;
	}
}
