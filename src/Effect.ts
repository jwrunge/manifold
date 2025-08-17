export type EffectFn = () => void;

interface DepRef {
	bucket: DepBucket;
	index: number;
}

export interface DepBucket {
	effects: (Effect | null)[];
	map: Map<Effect, number>;
	holes?: number;
}

export class Effect {
	static current: Effect | null = null;
	static #pool: Effect[] = [];

	static acquire(fn: () => void, ephemeral?: boolean) {
		if (ephemeral) {
			const inst = Effect.#pool.pop();
			if (inst) {
				inst.fn = fn;
				inst.#active = true;
				inst.#deps.length = 0;
				inst.level = Effect.current ? Effect.current.level + 1 : 0;
				inst.ephemeral = true;
				return inst;
			}
			return new Effect(fn, true);
		}
		return new Effect(fn, false);
	}

	#deps: DepRef[] = [];
	#active = true;
	fn: () => void;
	level: number;
	ephemeral: boolean;

	constructor(fn: () => void, ephemeral: boolean) {
		this.fn = fn;
		this.level = Effect.current ? Effect.current.level + 1 : 0;
		this.ephemeral = !!ephemeral;
	}

	_addDep(bucket: DepBucket, index: number) {
		this.#deps.push({ bucket, index });
	}

	run() {
		if (!this.#active) return;
		this.#clean();
		const prev = Effect.current;
		Effect.current = this;
		try {
			this.fn();
		} finally {
			Effect.current = prev;
		}
	}

	stop() {
		if (!this.#active) return;
		this.#active = false;
		this.#clean();
		if (this.ephemeral) {
			if (Effect.#pool.length < 1024) {
				this.fn = () => {};
				this.#deps.length = 0;
				Effect.#pool.push(this);
			}
		}
	}

	#clean() {
		for (const d of this.#deps) {
			const bucket = d.bucket;
			if (bucket.effects[d.index] === this) {
				bucket.effects[d.index] = null;
				bucket.map.delete(this);
				bucket.holes = (bucket.holes || 0) + 1;
				const len = bucket.effects.length;
				const holeThresh = Math.max(8, (len * 0.25) | 0);
				if (len >= 4 && (bucket.holes || 0) > holeThresh) {
					const newArr: (Effect | null)[] = [];
					bucket.holes = 0;
					bucket.map.clear();
					for (const eff of bucket.effects)
						if (eff) {
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
