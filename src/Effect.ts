export type EffectFn = () => void;

interface SubscriptionRef {
	sub: Subscriptions;
	index: number;
}

export interface Subscriptions {
	effects: (Effect | null)[];
	map: Map<Effect, number>;
	holes?: number; // Allow holes in the effects array to optimize memory -- compacted in #clean()
}

export const effect = (fn: EffectFn) => {
	const e = Effect.acquire(fn);
	e.run();
	return e;
};

export class Effect {
	static current: Effect | null = null;
	static #pool: Effect[] = [];

	static acquire(fn: () => void) {
		const inst = Effect.#pool.pop();
		if (inst) {
			inst.fn = fn;
			inst.#active = true;
			inst.#deps.length = 0;
			inst.level = Effect.current ? Effect.current.level + 1 : 0;
			return inst;
		}
		return new Effect(fn);
	}

	#deps: SubscriptionRef[] = [];
	#active = true;
	fn: () => void;
	level: number;

	constructor(fn: () => void) {
		this.fn = fn;
		this.level = Effect.current ? Effect.current.level + 1 : 0;
	}

	_addDep(sub: Subscriptions, index: number) {
		this.#deps.push({ sub: sub, index });
	}

	run() {
		if (this.#active) {
			this.#clean();
			const prev = Effect.current;
			Effect.current = this;
			try {
				this.fn();
			} finally {
				Effect.current = prev;
			}
		}
	}

	stop() {
		if (this.#active) {
			this.#active = false;
			this.#clean();

			// Return to pool for reuse
			if (Effect.#pool.length < 1024) {
				this.fn = () => {};
				this.#deps.length = 0;
				Effect.#pool.push(this);
			}
		}
	}

	#clean() {
		for (const { sub, index } of this.#deps) {
			if (sub.effects[index] === this) {
				sub.effects[index] = null;
				sub.map.delete(this);
				sub.holes = (sub.holes ?? 0) + 1;
				const { length } = sub.effects;
				if (
					length >= 4 &&
					sub.holes > Math.max(8, (length * 0.25) | 0) // Compact if holes > 25% or 8
				) {
					const newArr: (Effect | null)[] = [];
					sub.holes = 0;
					sub.map.clear();
					for (const eff of sub.effects)
						if (eff) {
							sub.map.set(eff, newArr.length);
							newArr.push(eff);
						}
					sub.effects = newArr;
				}
			}
		}
		this.#deps.length = 0;
	}
}
